const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");

class TeltonikaController {
  constructor(options = {}) {
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
            (Date.now() - ts) / 1000,
          )}s | data: ${JSON.stringify(payload)}`,
        );
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

  isRealtimePacket(ts, windowSeconds = 5) {
    if (!ts) return false;
    const now = Date.now();
    const diffSeconds = Math.abs(now - ts) / 1000;
    return diffSeconds <= windowSeconds;
  }
}

module.exports = TeltonikaController;
