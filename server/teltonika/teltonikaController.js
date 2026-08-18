const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");

class TeltonikaController {
  constructor(options = {}) {
    this.messageHistoryCount = 10;
    this.isDBConnected = options.isDBConnected;
    this.fastData = new Map();
    this.fastData.set("devices", new Map());
  }
  attachTracker(tracker) {
    this.trackerEvents(tracker);
    tracker.start();

    this.forcedRefersh = setInterval(() => {
      const devices = this.fastData.get("devices");
      devices.forEach((value, key) => {
        this.updateDeviceStructured(key);
      });
    }, 30000);
  }

  trackerEvents(tracker) {
    tracker.on("message", async ({ meta, payload }) => {
      const deviceIMEI = meta.deviceIMEI;
      const ts = payload?.state?.reported?.ts;

      if (this.isRealtimePacket(ts)) {
        console.log(
          `[Teltonika] ACCEPTED payload | IMEI=${deviceIMEI} | ts=${ts} | age=${Math.round(
            Math.abs(Date.now() - ts) / 1000,
          )}s | data: ${JSON.stringify(payload)}`,
        );
        this.updateDevice(deviceIMEI, payload);
      }
    });

    tracker.on("disconnection", async ({ meta }) => {});

    tracker.on("raw", ({ meta, raw }) => {
      console.warn(
        "[Teltonika] raw data received (could not parse to JSON):",
        raw,
      );
    });
  }

  getDevice(key) {
    return this.fastData.get("devices").get(key);
  }

  setDevice(key, value) {
    return this.fastData.get("devices").set(key, value);
  }

  filterDevices(imeis) {
    return new Map(
      [...this.fastData.get("devices")].filter(([key]) => imeis.has(key)),
    );
  }

  updateDevice(imei, data) {
    const device = this.getDevice(imei);
    if (device) {
      this.updateDeviceUnstructured(device, data);
      this.updateDeviceStructured(imei);
    } else {
      this.setDevice(imei, {
        ts: Date.now(),
        structured: {
          general: {},
          safety: {},
          locs: {},
        },
        unstructured: [data],
      });
    }
  }

  updateDeviceStructured(imei) {
    const device = this.getDevice(imei);
    this.deviceStatusUpdate(device);
    this.deviceSafetyUpdate(device);
    this.deviceLocsUpdate(device);
  }

  deviceStatusUpdate(device) {
    device.structured.general.status ||= "offline";
    device.structured.general.ignition ||= "off";
    device.structured.general.moving ||= "stopped";

    const prevLatestData = device.unstructured[device.unstructured.length - 1];

    const now = Date.now();
    device.structured.general.ts = prevLatestData?.state?.reported?.ts || now;

    if (prevLatestData.state.reported["239"] == 1) {
      device.structured.general.ignition = "on";
    } else {
      device.structured.general.ignition = "off";
    }

    if (prevLatestData.state.reported["240"] == 1) {
      device.structured.general.moving = "moving";
    } else {
      device.structured.general.moving = "stopped";
    }

    const diffInSeconds =
      (now - new Date(device.structured.general.ts).getTime()) / 1000;

    if (
      device.structured.general.ignition == "on" ||
      device.structured.general.moving == "moving"
    ) {
      if (diffInSeconds <= 5) {
        device.structured.general.status = "active";
        return;
      }
      if (diffInSeconds <= 20) {
        device.structured.general.status = "idle";
        return;
      }
    }

    if (
      device.structured.general.ignition == "off" &&
      device.structured.general.moving == "stopped"
    ) {
      if (diffInSeconds <= 20) {
        device.structured.general.status = "parked";
        return;
      }
    }

    device.structured.general.status = "offline";
    return;
  }

  deviceSafetyUpdate(device) {
    const prevLatestData = device.unstructured[device.unstructured.length - 1];

    device.structured.safety.ts =
      prevLatestData?.state?.reported?.ts || Date.now();
    device.structured.safety.alerts ||= [];
    const alertsMap = new Map(
      device.structured.safety.alerts.map((a) => [a.type, a]),
    );

    // Crash
    if (prevLatestData.state.reported["247"]) {
      device.structured.safety.crashDetected = true;
      alertsMap.set("crash detected", {
        type: "crash detected",
        unhandled: true,
      });
    } else {
      device.structured.safety.crashDetected = false;
      alertsMap.delete("crash detected");
    }

    // Overspeed
    if (prevLatestData.state.reported["255"]) {
      device.structured.safety.overspeeding = true;
      alertsMap.set("over speeding", {
        type: "over speeding",
        unhandled: true,
      });
    } else {
      device.structured.safety.overspeeding = false;
      alertsMap.delete("over speeding");
    }

    device.structured.safety.alerts = [...alertsMap.values()];
  }

  deviceLocsUpdate(device) {
    const prevLatestData = device.unstructured[device.unstructured.length - 1];
    device.structured.locs.ts =
      prevLatestData?.state?.reported?.ts || Date.now();
    const [lat, lng] = prevLatestData?.state?.reported?.latlng
      ?.split(",")
      .map(Number) || [0.0, 0.0];
    device.structured.locs.lat = lat;
    device.structured.locs.lng = lng;
    device.structured.locs.alt = prevLatestData?.state?.reported?.alt || 0.0;
  }

  updateDeviceUnstructured(device, data) {
    const prevLatestData = device.unstructured[device.unstructured.length - 1];
    if (prevLatestData.state.reported.ts < data.state.reported.ts) {
      if (device.unstructured.length == this.messageHistoryCount) {
        device.unstructured.shift();
      }
      device.unstructured.push(data);
    }
  }

  isRealtimePacket(ts, windowSeconds = 5) {
    if (!ts) return false;
    const now = Date.now();
    const diffSeconds = Math.abs(now - ts) / 1000;
    return diffSeconds <= windowSeconds;
  }
}

module.exports = TeltonikaController;
