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

  updateDevice(imei, data) {
    const device = this.getDevice(imei);
    if (device) {
      this.updateDeviceUnstructured(device, data);
    } else {
      this.setDevice(imei, {
        structured: {},
        unstructured: [data],
      });
    }
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
