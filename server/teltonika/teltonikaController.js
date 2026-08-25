const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");
const DeviceAlert = require("../models/devicealert");
const VehicleRoute = require("../models/vehicleroute");
const Vehicle = require("../models/vehicles");

class TeltonikaController {
  constructor(options = {}) {
    // DB connection status closure.
    // Always call this as this.isDBConnected().
    this.isDBConnected = options.isDBConnected;

    this.routeWidthMeters = options.routeWidthMeters ?? 30;

    this.unstructuredMaxMsg = 10;

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

        delay = Math.min(delay * 2, this.prefetchMaxRetryDelayMs);

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

        /*
         * Exponential backoff:
         *
         * 2s
         * 4s
         * 8s
         * 16s
         * 30s
         * 30s...
         */
        delay = Math.min(delay * 2, this.prefetchMaxRetryDelayMs);
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
     * Load latest 10 messages per IMEI.
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
        ts: Date.now(),

        structured,

        unstructured,
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

    console.log(`[Teltonika] Hydrated ` + `${hydratedDevices.size} devices`);
  }

  async hydrateFromPersistentStorageOnDemand() {
    // Load all routes
    const routes = await VehicleRoute.find({}).lean();

    const hydratedRoutes = new Map();

    for (const route of routes) {
      if (!route?._id) continue;

      const routeId = String(route._id);

      /**
       * routeId -> route.pathData
       */
      hydratedRoutes.set(routeId, route.pathData);
    }

    // Load vehicles with their devices
    const vehicles = await Vehicle.find({})
      .select("device routes")
      .populate("device", "imei")
      .lean();

    const hydratedRoutesByImei = new Map();

    for (const vehicle of vehicles) {
      const imei = vehicle?.device?.imei;

      if (!imei) continue;

      const vehicleRoutes = [];

      for (const routeId of vehicle.routes || []) {
        const pathData = hydratedRoutes.get(String(routeId));

        if (pathData) {
          vehicleRoutes.push(pathData);
        }
      }

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
          "meta.imei": {
            $in: imeis,
          },
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

          messages: {
            $push: "$body",
          },
        },
      },

      /*
       * Keep only latest N messages.
       */
      {
        $project: {
          messages: {
            $slice: ["$messages", this.unstructuredMaxMsg],
          },
        },
      },
    ]);

    const result = new Map();

    for (const row of rows) {
      /*
       * Mongo:
       *
       * newest -> oldest
       *
       * Controller:
       *
       * oldest -> newest
       */
      result.set(row._id, (row.messages || []).reverse());
    }

    return result;
  }

  sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  // ============================================================
  // REFRESH / PERSISTENCE
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
        this.updateDeviceStructured(imei, {
          updateAlerts: false,
        });
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

      const ts = payload?.state?.reported?.ts;

      if (!deviceIMEI) {
        console.warn("[Teltonika] Received packet without IMEI");

        return;
      }

      if (this.isAcceptablePacket(ts)) {
        // console.log(
        //   `[Teltonika] ACCEPTED payload | ` +
        //     `IMEI=${deviceIMEI} | ` +
        //     `ts=${ts} | ` +
        //     `age=${Math.round(Math.abs(Date.now() - ts) / 1000)}s`,
        //   JSON.stringify(payload),
        // );

        this.updateDevice(deviceIMEI, payload);
      } else {
        // console.log(
        //   `[Teltonika] Rejected payload | ` +
        //     `IMEI=${deviceIMEI} | ` +
        //     `ts=${ts} | ` +
        //     `age=${Math.round(Math.abs(Date.now() - ts) / 1000)}s`,
        //   JSON.stringify(payload),
        // );
      }
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
    const filtered = [...this.fastData.get("devices")].filter(([key]) =>
      imeis.has(key),
    );

    if (returnArray) {
      return filtered;
    }

    return new Map(filtered);
  }

  getRoutesForDevice(imei) {
    const routesByImei = this.fastData.get("routesByImei");

    return routesByImei?.get(imei) || [];
  }

  // ============================================================
  // DEVICE UPDATE
  // ============================================================

  updateDevice(imei, data) {
    const device = this.getDevice(imei);

    if (!device) {
      const newDevice = {
        ts: Date.now(),

        structured: {
          general: {},
          alerts: {},
          locs: {},
        },

        unstructured: [data],
      };

      this.setDevice(imei, newDevice);

      /*
       * New packet.
       *
       * Process alerts.
       */
      this.updateDeviceStructured(imei, {
        updateAlerts: true,
      });

      return;
    }

    const added = this.updateDeviceUnstructured(device, data);

    /*
     * Old/duplicate packet.
     */
    if (!added) {
      return;
    }

    /*
     * New packet.
     */
    this.updateDeviceStructured(imei, {
      updateAlerts: true,
    });
  }

  // ============================================================
  // STRUCTURED DATA
  // ============================================================

  updateDeviceStructured(imei, { updateAlerts = false } = {}) {
    const device = this.getDevice(imei);

    if (!device) {
      return;
    }

    if (!device.unstructured?.length) {
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
    const latest = device.unstructured[device.unstructured.length - 1];

    const reported = latest?.state?.reported;

    if (!reported) {
      return;
    }

    const general = device.structured.general;

    general.status ||= "offline";
    general.ignition ||= "off";
    general.moving ||= "stopped";

    const packetTs = Number(reported.ts);

    if (!Number.isFinite(packetTs)) {
      general.status = "offline";
      return;
    }

    general.ts = packetTs;

    /*
     * IO 239 = ignition.
     */
    general.ignition = Number(reported["239"]) === 1 ? "on" : "off";

    /*
     * IO 240 = movement.
     */
    general.moving = Number(reported["240"]) === 1 ? "moving" : "stopped";

    const diffInSeconds = Math.max(0, (Date.now() - packetTs) / 1000);

    /*
     * Ignition ON or moving.
     */
    if (general.ignition === "on" || general.moving === "moving") {
      if (diffInSeconds <= 5) {
        general.status = "active";
        return;
      }

      if (diffInSeconds <= 20) {
        general.status = "idle";
        return;
      }
    }

    /*
     * Ignition OFF and stopped.
     */
    if (general.ignition === "off" && general.moving === "stopped") {
      if (diffInSeconds <= 20) {
        general.status = "parked";
        return;
      }
    }

    general.status = "offline";
  }

  // ============================================================
  // LOCATION
  // ============================================================

  deviceLocsUpdate(device) {
    const latest = device.unstructured[device.unstructured.length - 1];

    const reported = latest?.state?.reported;

    if (!reported) {
      return;
    }

    const locs = device.structured.locs;

    const timestamp = Number(reported.ts);

    locs.ts = Number.isFinite(timestamp) ? timestamp : Date.now();

    const [lat, lng] = reported.latlng?.split(",").map(Number) || [0, 0];

    locs.lat = Number.isFinite(lat) ? lat : 0;

    locs.lng = Number.isFinite(lng) ? lng : 0;

    const alt = Number(reported.alt);

    locs.alt = Number.isFinite(alt) ? alt : 0;
  }

  // ============================================================
  // ALERTS
  // ============================================================

  deviceAlertsUpdate(device, imei) {
    const latest = device.unstructured[device.unstructured.length - 1];

    const reported = latest?.state?.reported;

    if (!reported) {
      return;
    }

    if (reported.evt !== 0) {
      console.log(reported.evt, ": " + reported[[reported.evt]]);
    }

    const alerts = device.structured.alerts;

    alerts.ts = Number(reported.ts) || Date.now();

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
    if (Number(reported["255"]) === 1) {
      alertsMap.set("over speeding", {
        ...common,

        type: "safety",
        message: "over speeding",
      });
    } else if (Number(reported["255"]) === 0) {
      alertsMap.delete("over speeding");
    }

    const routeViolation = this.checkRouteViolation(imei, {
      lat,
      lng,
    });

    if (routeViolation) {
      if (!alertsMap.has("geofence violation")) {
        alertsMap.set("geofence violation", {
          ...common,
          type: "safety",
          message: "geofence violation",
        });
      }
    } else {
      alertsMap.delete("geofence violation");
    }

    /*
     * Crash.
     *
     */
    if (Number(reported["247"]) > 0) {
      alertsMap.set("crash detected", {
        ...common,

        type: "safety",
        message: "crash detected",
      });
    } else {
      const lastAlertTS = alertsMap.get("crash detected")?.ts;
      if (lastAlertTS) {
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - lastAlertTS >= ONE_DAY) {
          alertsMap.delete("crash detected");
        }
      }
    }

    /*
     * Excessive Idle
     */
    if (Number(reported["251"]) === 1) {
      alertsMap.set("excessive idle", {
        ...common,

        type: "behaviour",
        message: "excessive idle",
      });
    } else if (Number(reported["251"]) === 0) {
      alertsMap.delete("excessive idle");
    }

    /*
     * Low Batter (Currently GPS Battery).
     */
    const battery = Number(reported["113"]);

    if (battery <= 15) {
      if (!alertsMap.has("low battery")) {
        alertsMap.set("low battery", {
          ...common,
          type: "health",
          message: "low battery",
        });
      }
    } else if (battery >= 50) {
      alertsMap.delete("low battery");
    }

    /*
     * Unplug detection.
     */
    if (Number(reported["252"]) === 1) {
      alertsMap.set("unplugged", {
        ...common,

        type: "maintenance",
        message: "unplugged",
      });
    } else if (Number(reported["252"]) === 0) {
      alertsMap.delete("unplugged");
    }

    /*
     * Towing detection.
     */
    if (Number(reported["246"]) === 1) {
      alertsMap.set("towing", {
        ...common,

        type: "maintenance",
        message: "towing",
      });
    } else if (Number(reported["246"]) === 0) {
      alertsMap.delete("towing");
    }

    alerts.list = [...alertsMap.values()];
  }

  // ============================================================
  // GEO FENCE VIOLATION DETECTION HELPERS
  // ============================================================

  checkRouteViolation(imei, point) {
    const routes = this.getRoutesForDevice(imei);

    // No routes assigned = no route violation
    if (!routes.length) {
      return false;
    }

    const insideAnyRoute = routes.some((route) => {
      const halfWidthMeters =
        route?.routeWidthMeters || this.routeWidthMeters / 2;
      return this.isPointInsideRoute(point, route.path, halfWidthMeters);
    });

    return !insideAnyRoute;
  }

  /**
   * Returns true when the vehicle point is inside
   * the corridor around the route centerline.
   *
   * route = [
   *   {
   *     coordinates: {
   *       longitude,
   *       latitude
   *     }
   *   },
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

    let nearestDistance = Infinity;

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

      if (distance < nearestDistance) {
        nearestDistance = distance;
      }

      // We already know the vehicle is inside.
      if (nearestDistance <= thresholdMeters) {
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
    const R = 6371000; // Earth radius in meters

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

    // Projection of P onto AB.
    let t = (apx * abx + apy * aby) / abSquared;

    // Clamp projection to the segment.
    t = Math.max(0, Math.min(1, t));

    const closestX = ax + t * abx;
    const closestY = ay + t * aby;

    return Math.hypot(px - closestX, py - closestY);
  }

  toRadians(degrees) {
    return (degrees * Math.PI) / 180;
  }

  // ============================================================
  // UNSTRUCTURED DATA
  // ============================================================

  updateDeviceUnstructured(device, data) {
    const incomingTs = Number(data?.state?.reported?.ts);
    const incomingPr = Number(data?.state?.reported?.pr ?? 0);

    // Invalid timestamp → reject packet.
    if (!Number.isFinite(incomingTs)) {
      return false;
    }

    const list = device.unstructured;

    // No previous packets → accept.
    if (!list.length) {
      list.push(data);
      return true;
    }

    // Because the array is always time ordered,
    // the last item is the newest packet.
    const latestIndex = list.length - 1;
    const latest = list[latestIndex];

    const latestTs = Number(latest?.state?.reported?.ts);
    const latestPr = Number(latest?.state?.reported?.pr ?? 0);

    // If the existing timestamp is invalid, replace it.
    if (!Number.isFinite(latestTs)) {
      list[latestIndex] = data;
      return true;
    }

    // ------------------------------------------------------------
    // 1. Incoming packet is older → reject.
    // ------------------------------------------------------------
    if (incomingTs < latestTs) {
      return false;
    }

    // ------------------------------------------------------------
    // 2. Same timestamp → higher Teltonika priority wins.
    // ------------------------------------------------------------
    if (incomingTs === latestTs) {
      if (incomingPr > latestPr) {
        list[latestIndex] = data;
        return true;
      }

      // Same or lower priority → reject.
      return false;
    }

    // ------------------------------------------------------------
    // 3. Incoming packet is newer → accept.
    // ------------------------------------------------------------
    if (list.length >= this.unstructuredMaxMsg) {
      list.shift();
    }

    list.push(data);

    return true;
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

      const deviceUpdates = [];
      const deviceMessageOps = [];
      const deviceAlertOps = [];

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
         * Latest messages.
         */
        for (const item of data.unstructured || []) {
          const ts = Number(item?.state?.reported?.ts);

          if (!Number.isFinite(ts)) {
            continue;
          }

          deviceMessageOps.push({
            updateOne: {
              filter: {
                "meta.imei": imei,
                "meta.ts": ts,
              },

              update: {
                $setOnInsert: {
                  meta: {
                    imei,
                    ts,
                  },

                  body: item,
                },
              },

              upsert: true,
            },
          });
        }

        /*
         * Save alerts.
         */
        for (const item of data.structured.alerts.list || []) {
          const ts = Number(item?.ts);

          if (!Number.isFinite(ts)) {
            continue;
          }

          deviceAlertOps.push({
            updateOne: {
              filter: {
                "meta.imei": imei,
                "meta.ts": ts,
              },

              update: {
                $setOnInsert: {
                  meta: {
                    imei,
                    ts,
                  },

                  body: item,
                },
              },

              upsert: true,
            },
          });
        }
      }

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

      await Promise.all(operations);

      console.log(
        `[Teltonika] DB sync complete | ` +
          `devices=${deviceUpdates.length} | ` +
          `messages=${deviceMessageOps.length} | ` +
          `alerts=${deviceAlertOps.length}`,
      );
    } catch (error) {
      console.error("[Teltonika] DB persistence failed:", error);
    } finally {
      this.isPersisting = false;
    }
  }

  // ============================================================
  // PACKET FILTER
  // ============================================================

  isAcceptablePacket(ts, windowSeconds = 30) {
    const timestamp = Number(ts);

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    const diffSeconds = Math.abs(Date.now() - timestamp) / 1000;

    return diffSeconds <= windowSeconds;
  }

  // ============================================================
  // SHUTDOWN
  // ============================================================

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
}

module.exports = TeltonikaController;
