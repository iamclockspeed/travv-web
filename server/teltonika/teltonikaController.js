const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");
const DeviceAlert = require("../models/devicealert");
const VehicleRoute = require("../models/vehicleroute");
const Vehicle = require("../models/vehicles");

/*
 * Teltonika IO element codes used throughout status/alert logic.
 * Centralised so the meaning of each code is documented in one
 * place instead of scattered through magic strings.
 */
const IO = {
  IGNITION: "239",
  MOVEMENT: "240",
  OVERSPEED: "255",
  CRASH: "247",
  EXCESSIVE_IDLE: "251",
  GPS_BATTERY: "113",
  EXT_BATTERY: "66",
  UNPLUGGED: "252",
  TOWING: "246",
};

// Synthetic "IO code" for the geofence alert (not a real Teltonika IO element).
const GEOFENCE_EVT = 155;

class TeltonikaController {
  constructor(options = {}) {
    // DB connection status closure.
    this.isDBConnected = options.isDBConnected;

    this.defaultRouteWidthInMeters = options.defaultRouteWidthInMeters ?? 30;

    /*
     * Max unstructured packets kept per device, both in memory
     * and when hydrating from the DB. Enforced everywhere the
     * unstructured list is mutated (see trimUnstructured()).
     */
    this.unstructuredMaxMsg = 100;

    // Recalculate time-dependent device state.
    this.statusRefreshIntervalMs = 5_000;

    // Persist state to MongoDB.
    this.persistenceIntervalMs = 60_000;

    // Startup DB hydration retry configuration.
    this.prefetchMaxRetries = options.prefetchMaxRetries ?? 10;
    this.prefetchRetryDelayMs = options.prefetchRetryDelayMs ?? 2_000;
    this.prefetchMaxRetryDelayMs = options.prefetchMaxRetryDelayMs ?? 30_000;

    this.fastData = new Map();
    this.fastData.set("devices", new Map());
    this.fastData.set("routes", new Map());
    this.fastData.set("routesByImei", new Map());

    /*
     * IMPORTANT:
     *
     * structured.alerts.list contains ONLY currently active alerts.
     *
     * pendingDeviceAlerts contains alert events that have been created
     * but have not yet been successfully persisted to DeviceAlert.
     *
     * This prevents a short-lived alert from being lost when it is
     * created and cleared between two persistence cycles.
     *
     * Map<imei, Array<alert>>
     */
    this.pendingDeviceAlerts = new Map();

    this.tracker = null;

    this.forcedRefresh = null;
    this.persistenceInterval = null;

    this.isPersisting = false;
    this.isShuttingDown = false;
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  async attachTracker(tracker) {
    this.tracker = tracker;

    this.trackerEvents(tracker);

    /*
     * Do not start the tracker until persistent state
     * has been successfully restored.
     *
     * prefetchFromPersistentStorage() retries internally.
     */
    await this.prefetchFromPersistentStorage();

    if (this.isShuttingDown) {
      return;
    }

    tracker.start();

    /*
     * Recalculate status frequently.
     */
    this.startForcedRefresh();

    /*
     * Persist less frequently.
     */
    this.startPersistenceLoop();

    console.log("[Teltonika] Controller started");
  }

  async shutdown() {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    console.log("[Teltonika] Shutting down...");

    if (this.forcedRefresh) {
      clearInterval(this.forcedRefresh);
      this.forcedRefresh = null;
    }

    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
      this.persistenceInterval = null;
    }

    /*
     * Final persistence.
     *
     * updateToPersistentStorage() will still work because
     * it checks isDBConnected(), but it doesn't reject
     * because of isShuttingDown.
     */
    await this.updateToPersistentStorage();

    if (this.tracker && typeof this.tracker.stop === "function") {
      try {
        await this.tracker.stop();
      } catch (error) {
        console.error("[Teltonika] Tracker shutdown failed:", error);
      }
    }

    console.log("[Teltonika] Shutdown complete");
  }

  // ============================================================
  // STARTUP PREFETCH WITH RETRY
  // ============================================================

  async prefetchFromPersistentStorage() {
    let attempt = 0;
    let delay = this.prefetchRetryDelayMs;

    while (!this.isShuttingDown && attempt < this.prefetchMaxRetries) {
      attempt++;

      /*
       * Check DB connection before every attempt.
       */
      if (!this.isDBConnected()) {
        console.warn(
          `[Teltonika] DB disconnected | ` +
            `prefetch attempt ${attempt}/${this.prefetchMaxRetries}`,
        );

        await this.sleep(delay);
        delay = this.nextBackoffDelay(delay);
        continue;
      }

      try {
        console.log(
          `[Teltonika] Hydrating from DB | ` +
            `attempt ${attempt}/${this.prefetchMaxRetries}`,
        );

        await this.hydrateFromPersistentStorage();

        console.log(
          `[Teltonika] DB hydration successful | ` + `attempt=${attempt}`,
        );

        return;
      } catch (error) {
        console.error(
          `[Teltonika] DB hydration failed | ` +
            `attempt=${attempt}/${this.prefetchMaxRetries}`,
          error,
        );

        /*
         * Don't sleep after the final attempt.
         */
        if (attempt >= this.prefetchMaxRetries) {
          break;
        }

        console.log(`[Teltonika] Retrying hydration in ` + `${delay}ms...`);

        await this.sleep(delay);
        delay = this.nextBackoffDelay(delay);
      }
    }

    if (this.isShuttingDown) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * Don't start the tracker with an empty/incomplete
     * memory state after hydration failure.
     */
    throw new Error(
      `[Teltonika] Unable to hydrate persistent state ` +
        `after ${this.prefetchMaxRetries} attempts`,
    );
  }

  /*
   * Exponential backoff, capped at prefetchMaxRetryDelayMs.
   *
   * e.g. 2s, 4s, 8s, 16s, 30s, 30s...
   */
  nextBackoffDelay(delay) {
    return Math.min(delay * 2, this.prefetchMaxRetryDelayMs);
  }

  async hydrateFromPersistentStorage() {
    /*
     * Connection can disappear between the check above
     * and the actual MongoDB query.
     *
     * Let the MongoDB error propagate to the retry loop.
     */
    const devices = await Device.find(
      {},
      {
        imei: 1,
        structuredTrackingData: 1,
      },
    ).lean();

    if (!devices.length) {
      /*
       * Empty DB is a successful hydration.
       *
       * This is different from a DB failure.
       */
      console.log("[Teltonika] DB contains no devices");
      return;
    }

    const imeis = devices.map((device) => device.imei).filter(Boolean);

    /*
     * Load latest N messages per IMEI (already sorted oldest -> newest).
     */
    const messagesByImei = await this.loadLatestMessages(imeis);

    /*
     * Build everything locally first.
     *
     * This is important.
     *
     * If something fails during hydration, fastData should
     * not contain half-hydrated devices.
     */
    const hydratedDevices = new Map();

    for (const dbDevice of devices) {
      const imei = dbDevice.imei;

      if (!imei) {
        continue;
      }

      const unstructured = messagesByImei.get(imei) || [];

      const structured = dbDevice.structuredTrackingData || {
        general: {},
        alerts: {},
        locs: {},
      };

      /*
       * Protect against incomplete historical documents.
       */
      structured.general ||= {};
      structured.alerts ||= {};
      structured.locs ||= {};
      structured.alerts.list ||= [];

      const device = {
        structured,
        unstructured,
        /*
         * Watermark: newest packet ts that's already durably
         * stored, so the persistence loop doesn't keep
         * re-sending messages we restored from the DB.
         */
        lastPersistedMsgTs: unstructured.length
          ? unstructured[unstructured.length - 1].state.reported.ts
          : 0,
      };

      /*
       * Recalculate location/status from the latest
       * restored packet.
       *
       * Do NOT recreate historical alerts.
       */
      if (unstructured.length) {
        this.deviceLocsUpdate(device);
        this.deviceStatusUpdate(device);
      }

      hydratedDevices.set(imei, device);
    }

    await this.hydrateFromPersistentStorageOnDemand();

    /*
     * Atomic-ish replacement of the in-memory device map.
     *
     * We only replace it after the complete DB hydration
     * succeeded.
     */
    this.fastData.set("devices", hydratedDevices);

    /*
     * No pending alerts are recreated during hydration.
     * Historical alerts are already in DeviceAlert.
     */
    this.pendingDeviceAlerts.clear();

    console.log(`[Teltonika] Hydrated ` + `${hydratedDevices.size} devices`);
  }

  /*
   * Hydrates route geometries and the imei -> routes lookup used
   * for geofence checks. Runs as part of startup hydration, and
   * is also called directly (on demand) by API routes when
   * routes/vehicles change and need to be reflected in fastData
   * without a full restart.
   */
  async hydrateFromPersistentStorageOnDemand() {
    // Load all routes.
    const routes = await VehicleRoute.find({}).lean();

    const hydratedRoutes = new Map();

    for (const route of routes) {
      if (!route?._id) continue;

      /**
       * routeId -> route.pathData
       */
      hydratedRoutes.set(String(route._id), route.pathData);
    }

    // Load vehicles with their devices.
    const vehicles = await Vehicle.find({})
      .select("device routes")
      .populate("device", "imei")
      .lean();

    const hydratedRoutesByImei = new Map();

    for (const vehicle of vehicles) {
      const imei = vehicle?.device?.imei;

      if (!imei) continue;

      const vehicleRoutes = (vehicle.routes || [])
        .map((routeId) => hydratedRoutes.get(String(routeId)))
        .filter(Boolean);

      /**
       * imei -> [route.pathData, ...]
       */
      hydratedRoutesByImei.set(imei, vehicleRoutes);
    }

    /**
     * Atomic-ish replacement of the in-memory maps.
     * Replace only after complete DB hydration succeeds.
     */
    this.fastData.set("routes", hydratedRoutes);
    this.fastData.set("routesByImei", hydratedRoutesByImei);

    console.log(`[Teltonika] Hydrated ${hydratedRoutes.size} routes`);
    console.log(
      `[Teltonika] Hydrated ${hydratedRoutesByImei.size} vehicle route mappings`,
    );
  }

  async loadLatestMessages(imeis) {
    if (!imeis.length) {
      return new Map();
    }

    const rows = await DeviceMessage.aggregate([
      {
        $match: {
          "meta.imei": { $in: imeis },
        },
      },

      /*
       * Newest first.
       */
      {
        $sort: {
          "meta.imei": 1,
          "meta.ts": -1,
        },
      },

      /*
       * Group messages by IMEI.
       */
      {
        $group: {
          _id: "$meta.imei",
          messages: { $push: "$body" },
        },
      },

      /*
       * Keep only latest N messages.
       */
      {
        $project: {
          messages: { $slice: ["$messages", this.unstructuredMaxMsg] },
        },
      },
    ]);

    const result = new Map();

    for (const row of rows) {
      /*
       * Mongo:   newest -> oldest
       * Controller: oldest -> newest
       */
      result.set(row._id, (row.messages || []).reverse());
    }

    return result;
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // ============================================================
  // REFRESH / PERSISTENCE LOOPS
  // ============================================================

  startForcedRefresh() {
    if (this.forcedRefresh) {
      clearInterval(this.forcedRefresh);
    }

    this.forcedRefresh = setInterval(() => {
      if (this.isShuttingDown) {
        return;
      }

      const devices = this.fastData.get("devices");

      devices.forEach((device, imei) => {
        /*
         * No alert processing here.
         *
         * Status and location are recalculated because
         * they can become stale without a new packet.
         */
        this.updateDeviceStructured(imei, { updateAlerts: false });
      });
    }, this.statusRefreshIntervalMs);
  }

  startPersistenceLoop() {
    if (this.persistenceInterval) {
      clearInterval(this.persistenceInterval);
    }

    this.persistenceInterval = setInterval(() => {
      if (this.isShuttingDown) {
        return;
      }

      this.updateToPersistentStorage().catch((error) => {
        console.error("[Teltonika] Periodic persistence failed:", error);
      });
    }, this.persistenceIntervalMs);
  }

  // ============================================================
  // TRACKER EVENTS
  // ============================================================

  trackerEvents(tracker) {
    tracker.on("message", async ({ meta, payload }) => {
      if (this.isShuttingDown) {
        return;
      }

      const deviceIMEI = meta?.deviceIMEI;

      if (!deviceIMEI) {
        console.warn("[Teltonika] Received packet without IMEI");
        return;
      }

      const incomingTs = Number(payload?.state?.reported?.ts);

      if (!Number.isFinite(incomingTs)) {
        console.warn("[Teltonika] Received packet without a valid timestamp");
        return;
      }

      const evt = Number(payload?.state?.reported?.evt);

      if (!Number.isFinite(evt)) {
        console.warn("[Teltonika] Received packet without a valid event");
        return;
      }

      this.updateDevice(deviceIMEI, payload);
    });

    tracker.on("disconnection", async ({ meta }) => {
      console.log(
        `[Teltonika] Device disconnected | ` + `IMEI=${meta?.deviceIMEI}`,
      );
    });

    tracker.on("raw", ({ raw }) => {
      console.warn(
        "[Teltonika] Raw data received " + "(could not parse to JSON):",
        raw,
      );
    });
  }

  // ============================================================
  // MEMORY
  // ============================================================

  getDevice(key) {
    return this.fastData.get("devices").get(key);
  }

  setDevice(key, value) {
    return this.fastData.get("devices").set(key, value);
  }

  filterDevices(imeis, returnArray = false) {
    const devices = this.fastData.get("devices");
    const filtered = [];

    for (const [key, value] of devices) {
      if (imeis.has(key)) {
        filtered.push([key, value]);
      }
    }

    return returnArray ? filtered : new Map(filtered);
  }

  getRoutesForDevice(imei) {
    return this.fastData.get("routesByImei")?.get(imei) || [];
  }

  /*
   * Packets can arrive out of order (retries, buffered/offline
   * devices flushing a backlog, etc.), so push order does NOT
   * imply chronological order. Scan for the max ts rather than
   * assuming the last-pushed element is the latest. Bounded by
   * unstructuredMaxMsg (trimUnstructured), so this stays cheap.
   */
  getLatestUnstructured(device) {
    const list = device.unstructured;
    let latest = list[0];

    for (let i = 1; i < list.length; i++) {
      if (list[i].state.reported.ts > latest.state.reported.ts) {
        latest = list[i];
      }
    }

    return latest;
  }

  /*
   * Keeps device.unstructured bounded to unstructuredMaxMsg.
   * Since packets aren't necessarily pushed in chronological
   * order, we can't just drop from the front — that could evict
   * a genuinely recent packet that happened to arrive early and
   * keep a stale one that arrived late. Sort by ts and drop the
   * oldest instead. Without this, live devices accumulate
   * packets forever.
   */
  trimUnstructured(device) {
    const list = device.unstructured;
    const excess = list.length - this.unstructuredMaxMsg;

    if (excess <= 0) {
      return;
    }

    list.sort((a, b) => a.state.reported.ts - b.state.reported.ts);
    list.splice(0, excess);
  }

  // ============================================================
  // DEVICE UPDATE
  // ============================================================

  updateDevice(imei, data) {
    const device = this.getDevice(imei);

    if (!device) {
      const newDevice = {
        structured: { general: {}, alerts: {}, locs: {} },
        unstructured: [data],
        lastPersistedMsgTs: 0,
      };

      this.setDevice(imei, newDevice);

      this.updateDeviceStructured(imei, { updateAlerts: true });
      return;
    }

    device.unstructured.push(data);
    this.trimUnstructured(device);

    this.updateDeviceStructured(imei, { updateAlerts: true });
  }

  updateDeviceStructured(imei, { updateAlerts = false } = {}) {
    const device = this.getDevice(imei);

    if (!device || !device.unstructured?.length) {
      return;
    }

    /*
     * Time/state based.
     */
    this.deviceLocsUpdate(device);
    this.deviceStatusUpdate(device);

    /*
     * Packet/event based.
     */
    if (updateAlerts) {
      this.deviceAlertsUpdate(device, imei);
    }
  }

  // ============================================================
  // STATUS
  // ============================================================

  deviceStatusUpdate(device) {
    const latest = this.getLatestUnstructured(device);
    const reported = latest.state.reported;

    const general = device.structured.general;

    const packetTs = reported.ts;

    general.ts = packetTs;

    const diffInSeconds = Math.max(0, (Date.now() - packetTs) / 1000);

    if (diffInSeconds >= 60) {
      general.ignition = "off";
      general.moving = "stopped";
      general.status = "offline";
      return;
    }

    /*
     * IO 239 = ignition.
     */
    general.ignition = Number(reported[IO.IGNITION]) === 1 ? "on" : "off";

    /*
     * IO 240 = movement.
     */
    general.moving = Number(reported[IO.MOVEMENT]) === 1 ? "moving" : "stopped";

    /*
     * Ignition ON/OFF and moving.
     */
    if (general.moving === "moving") {
      general.status = "active";
      return;
    }

    /*
     * Ignition ON and not moving.
     */
    if (general.ignition === "on" && general.moving === "stopped") {
      general.status = "idle";
      return;
    }

    /*
     * Ignition OFF and stopped.
     */
    if (general.ignition === "off" && general.moving === "stopped") {
      general.status = "parked";
      return;
    }
  }

  // ============================================================
  // LOCATION
  // ============================================================

  deviceLocsUpdate(device) {
    const latest = this.getLatestUnstructured(device);
    const reported = latest.state.reported;

    const locs = device.structured.locs;

    locs.ts = reported.ts;

    const [lat, lng] = reported.latlng?.split(",").map(Number) || [0, 0];
    locs.lat = Number.isFinite(lat) ? lat : 0;
    locs.lng = Number.isFinite(lng) ? lng : 0;

    const alt = Number(reported.alt);
    locs.alt = Number.isFinite(alt) ? alt : 0;
  }

  // ============================================================
  // ALERTS
  // ============================================================

  /*
   * Queue an alert event for durable persistence.
   *
   * IMPORTANT:
   * This queue is independent from active alerts.
   *
   * Therefore:
   *
   *   alert ON
   *   alert OFF
   *
   * before the persistence loop still results in
   * the alert being written to DeviceAlert.
   */
  queueDeviceAlert(imei, alert) {
    if (!imei || !alert) {
      return;
    }

    let queue = this.pendingDeviceAlerts.get(imei);

    if (!queue) {
      queue = [];
      this.pendingDeviceAlerts.set(imei, queue);
    }

    /*
     * Prevent duplicate queue entries for the
     * exact same event.
     *
     * Same IMEI + timestamp + event is also the
     * uniqueness condition used by persistence.
     */
    const duplicate = queue.some(
      (item) => item.ts === alert.ts && item.evt === alert.evt,
    );

    if (duplicate) {
      return;
    }

    queue.push({
      ...alert,
    });

    console.log(
      `[Teltonika] Alert queued | ` +
        `IMEI=${imei} | ` +
        `type=${alert.message} | ` +
        `ts=${alert.ts} | ` +
        `evt=${alert.evt}`,
    );
  }

  /*
   * Simple ON/OFF alert:
   *
   *   IO value 1 -> activate
   *   IO value 0 -> clear
   *   anything else -> unchanged
   *
   * onCreate is called ONLY when the alert transitions
   * from inactive -> active.
   */
  toggleAlert(alertsMap, common, ioCode, key, type, reported, onCreate) {
    const value = Number(reported[ioCode]);

    const wasActive = alertsMap.has(key);

    if (value === 1) {
      const alert = {
        ...common,
        evt: ioCode,
        type,
        message: key,
      };

      alertsMap.set(key, alert);

      /*
       * Only queue an alert on OFF -> ON.
       *
       * This is important because every incoming packet
       * may contain the same IO=1 value.
       */
      if (!wasActive && typeof onCreate === "function") {
        onCreate(alert);
      }
    } else if (value === 0) {
      alertsMap.delete(key);
    }
  }

  deviceAlertsUpdate(device, imei) {
    const latest = this.getLatestUnstructured(device);

    const reported = latest.state.reported;

    const alerts = device.structured.alerts;

    alerts.ts = reported.ts;

    alerts.list ||= [];

    const alertsMap = new Map(
      alerts.list.map((alert) => [alert.message, alert]),
    );

    const [lat, lng] = reported.latlng?.split(",").map(Number) || [0, 0];

    const alt = Number(reported.alt);

    const common = {
      ts: alerts.ts,
      locs: {
        lat: Number.isFinite(lat) ? lat : 0,

        lng: Number.isFinite(lng) ? lng : 0,

        alt: Number.isFinite(alt) ? alt : 0,
      },
    };

    /*
     * Overspeed.
     */
    this.toggleAlert(
      alertsMap,
      common,
      IO.OVERSPEED,
      "over speeding",
      "safety",
      reported,
      (alert) => this.queueDeviceAlert(imei, alert),
    );

    /*
     * Geofence violation.
     */
    const routeViolation = this.checkRouteViolation(imei, {
      lat,
      lng,
    });

    if (routeViolation) {
      /*
       * Only create/queue when it becomes active.
       */

      const wasActive = alertsMap.has("geofence violation");

      if (!wasActive) {
        const alert = {
          ...common,
          evt: GEOFENCE_EVT,
          type: "safety",
          message: "geofence violation",
        };

        alertsMap.set("geofence violation", alert);

        this.queueDeviceAlert(imei, alert);
      }
    } else {
      alertsMap.delete("geofence violation");
    }

    /*
     * Crash.
     *
     * Stays active until a full day has passed
     * without a new crash reading.
     */
    if (Number(reported[IO.CRASH]) > 0) {
      const wasActive = alertsMap.has("crash detected");

      const alert = {
        ...common,
        evt: IO.CRASH,
        type: "safety",
        message: "crash detected",
      };

      alertsMap.set("crash detected", alert);

      /*
       * Only persist the first crash event.
       */
      if (!wasActive) {
        this.queueDeviceAlert(imei, alert);
      }
    } else {
      const lastAlertTS = alertsMap.get("crash detected")?.ts;

      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (lastAlertTS && Date.now() - lastAlertTS >= ONE_DAY) {
        alertsMap.delete("crash detected");
      }
    }

    /*
     * Excessive idle.
     */
    this.toggleAlert(
      alertsMap,
      common,
      IO.EXCESSIVE_IDLE,
      "excessive idle",
      "behaviour",
      reported,
      (alert) => this.queueDeviceAlert(imei, alert),
    );

    /*
     * Low battery.
     *
     * Hysteresis:
     *   <=15% -> activate
     *   >=50% -> clear
     */
    const battery = Number(reported[IO.GPS_BATTERY]);

    if (battery <= 15) {
      const wasActive = alertsMap.has("low battery");

      const alert = alertsMap.get("low battery") || {
        ...common,
        evt: IO.GPS_BATTERY,
        type: "health",
        message: "low battery",
      };

      alertsMap.set("low battery", alert);

      /*
       * Queue only on inactive -> active.
       */
      if (!wasActive) {
        this.queueDeviceAlert(imei, alert);
      }
    } else if (battery >= 50) {
      alertsMap.delete("low battery");
    }

    /*
     * Unplug detection.
     */
    this.toggleAlert(
      alertsMap,
      common,
      IO.UNPLUGGED,
      "unplugged",
      "maintenance",
      reported,
      (alert) => this.queueDeviceAlert(imei, alert),
    );

    /*
     * Towing detection.
     */
    this.toggleAlert(
      alertsMap,
      common,
      IO.TOWING,
      "towing",
      "maintenance",
      reported,
      (alert) => this.queueDeviceAlert(imei, alert),
    );

    /*
     * This remains the CURRENT ACTIVE ALERT list.
     *
     * It is intentionally independent from
     * pendingDeviceAlerts.
     */
    alerts.list = [...alertsMap.values()];
  }

  // ============================================================
  // GEOFENCE VIOLATION DETECTION
  // ============================================================

  checkRouteViolation(imei, point) {
    const routes = this.getRoutesForDevice(imei);

    // No routes assigned = no route violation.
    if (!routes.length) {
      return false;
    }

    const insideAnyRoute = routes.some((route) => {
      const halfWidthMeters =
        (route?.routeWidthMeters || this.defaultRouteWidthInMeters) / 2;

      return this.isPointInsideRoute(point, route.path, halfWidthMeters);
    });

    return !insideAnyRoute;
  }

  /**
   * Returns true when the vehicle point is inside
   * the corridor around the route centerline.
   *
   * route = [
   *   { coordinates: { longitude, latitude } },
   *   ...
   * ]
   */
  isPointInsideRoute(point, route, thresholdMeters) {
    if (
      !Number.isFinite(point?.lat) ||
      !Number.isFinite(point?.lng) ||
      !Array.isArray(route) ||
      route.length < 2
    ) {
      return false;
    }

    for (let i = 0; i < route.length - 1; i++) {
      const a = route[i]?.coordinates;
      const b = route[i + 1]?.coordinates;

      if (!a || !b) {
        continue;
      }

      const distance = this.distancePointToSegmentMeters(
        point.lat,
        point.lng,
        Number(a.latitude),
        Number(a.longitude),
        Number(b.latitude),
        Number(b.longitude),
      );

      // Found a segment close enough — no need to check the rest.
      if (distance <= thresholdMeters) {
        return true;
      }
    }

    return false;
  }

  /**
   * Distance from a geographic point to a line segment.
   *
   * Uses a local equirectangular projection, which is
   * sufficiently accurate for short road segments.
   */
  distancePointToSegmentMeters(
    pointLat,
    pointLng,
    startLat,
    startLng,
    endLat,
    endLng,
  ) {
    const R = 6371000; // Earth radius in meters.

    const lat0 = this.toRadians((pointLat + startLat + endLat) / 3);
    const cosLat = Math.cos(lat0);

    // Convert coordinates to local meters.
    const px = this.toRadians(pointLng) * R * cosLat;
    const py = this.toRadians(pointLat) * R;

    const ax = this.toRadians(startLng) * R * cosLat;
    const ay = this.toRadians(startLat) * R;

    const bx = this.toRadians(endLng) * R * cosLat;
    const by = this.toRadians(endLat) * R;

    const abx = bx - ax;
    const aby = by - ay;

    const apx = px - ax;
    const apy = py - ay;

    const abSquared = abx * abx + aby * aby;

    // Degenerate segment.
    if (abSquared === 0) {
      return Math.hypot(apx, apy);
    }

    // Projection of P onto AB, clamped to the segment.
    const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / abSquared));

    const closestX = ax + t * abx;
    const closestY = ay + t * aby;

    return Math.hypot(px - closestX, py - closestY);
  }

  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // ============================================================
  // DATABASE PERSISTENCE
  // ============================================================

  async updateToPersistentStorage() {
    /*
     * DB availability is a function.
     */
    if (!this.isDBConnected()) {
      return;
    }

    /*
     * Don't overlap persistence operations.
     */
    if (this.isPersisting) {
      console.warn("[Teltonika] Persistence already running");
      return;
    }

    this.isPersisting = true;

    try {
      const devices = this.fastData.get("devices");

      if (!devices.size) {
        return;
      }

      const {
        deviceUpdates,
        deviceMessageOps,
        deviceAlertOps,
        watermarks,
        pendingAlertImeis,
      } = this.buildPersistenceOps(devices);

      const operations = [];

      if (deviceUpdates.length) {
        operations.push(
          Device.bulkWrite(deviceUpdates, {
            ordered: false,
          }),
        );
      }

      if (deviceMessageOps.length) {
        operations.push(
          DeviceMessage.bulkWrite(deviceMessageOps, {
            ordered: false,
          }),
        );
      }

      if (deviceAlertOps.length) {
        operations.push(
          DeviceAlert.bulkWrite(deviceAlertOps, {
            ordered: false,
          }),
        );
      }

      /*
       * IMPORTANT:
       *
       * All writes must succeed before advancing
       * either message watermarks or pending alerts.
       */
      await Promise.all(operations);

      /*
       * Only advance the "already persisted"
       * message watermark after successful writes.
       */
      for (const [imei, ts] of watermarks) {
        const device = devices.get(imei);

        if (device) {
          device.lastPersistedMsgTs = ts;
        }
      }

      /*
       * IMPORTANT:
       *
       * Now that DeviceAlert.bulkWrite() succeeded,
       * remove the pending alert events.
       *
       * If the DB write failed, this section is never reached,
       * so the alerts remain queued for the next cycle.
       */
      for (const imei of pendingAlertImeis) {
        this.pendingDeviceAlerts.delete(imei);
      }

      console.log(
        `[Teltonika] DB sync complete | ` +
          `devices=${deviceUpdates.length} | ` +
          `messages=${deviceMessageOps.length} | ` +
          `alerts=${deviceAlertOps.length}`,
      );
    } catch (error) {
      /*
       * DO NOT clear pendingDeviceAlerts here.
       *
       * The next persistence cycle will retry them.
       */
      console.error("[Teltonika] DB persistence failed:", error);
    } finally {
      this.isPersisting = false;
    }
  }

  /*
   * Builds the bulk write op lists for devices,
   * messages, and alert events.
   */
  buildPersistenceOps(devices) {
    const deviceUpdates = [];
    const deviceMessageOps = [];
    const deviceAlertOps = [];
    const watermarks = new Map();

    /*
     * Track which devices contributed pending alert
     * events during this persistence cycle.
     */
    const pendingAlertImeis = new Set();

    const upsertByImeiTsEvt = (imei, ts, evt, body) => ({
      updateOne: {
        filter: {
          "meta.imei": imei,
          "meta.ts": ts,
          "meta.evt": evt,
        },

        update: {
          $setOnInsert: {
            meta: {
              imei,
              ts,
              evt,
            },
            body,
          },
        },

        upsert: true,
      },
    });

    for (const [imei, data] of devices) {
      /*
       * Structured snapshot.
       */
      deviceUpdates.push({
        updateOne: {
          filter: {
            imei,
          },

          update: {
            $set: {
              structuredTrackingData: data.structured,
            },
          },
        },
      });

      /*
       * Only-unpersisted messages.
       */
      const watermark = data.lastPersistedMsgTs || 0;

      let maxTs = watermark;

      for (const item of data.unstructured || []) {
        const ts = item.state.reported.ts;

        if (ts <= watermark) {
          continue;
        }

        const evt = item.state.reported.evt;

        deviceMessageOps.push(upsertByImeiTsEvt(imei, ts, evt, item));

        if (ts > maxTs) {
          maxTs = ts;
        }
      }

      if (maxTs > watermark) {
        watermarks.set(imei, maxTs);
      }

      /*
       * --------------------------------------------------------
       * ACTIVE ALERTS
       * --------------------------------------------------------
       *
       * We intentionally DO NOT use active alerts as the
       * only source for DeviceAlert persistence anymore.
       *
       * Active alerts can disappear before the 60-second
       * persistence interval.
       */

      /*
       * --------------------------------------------------------
       * PENDING ALERT EVENTS
       * --------------------------------------------------------
       *
       * These are alert creations that occurred since the
       * previous successful persistence.
       */
      const pendingAlerts = this.pendingDeviceAlerts.get(imei) || [];

      if (pendingAlerts.length) {
        pendingAlertImeis.add(imei);

        for (const item of pendingAlerts) {
          const ts = item.ts;

          const evt = item.evt;

          deviceAlertOps.push(upsertByImeiTsEvt(imei, ts, evt, item));
        }
      }
    }

    return {
      deviceUpdates,
      deviceMessageOps,
      deviceAlertOps,
      watermarks,
      pendingAlertImeis,
    };
  }
}

module.exports = TeltonikaController;
