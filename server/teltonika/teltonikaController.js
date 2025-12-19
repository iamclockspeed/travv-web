const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");

class TeltonikaController {
  constructor(options = {}) {
    this.isDBConnected = options.isDBConnected;
  }
  attachTracker(tracker) {
    tracker.on("message", async ({ meta, payload, raw }) => {
      try {
        const deviceIMEI = meta.deviceIMEI;

        if (!this.isDBConnected()) return;

        console.log(raw);

        await Device.updateOne(
          { imei: deviceIMEI },
          {
            $set: {
              lastSeenAt: new Date(),
              raw: payload,
            },
          }
        );

        await DeviceMessage.create({
          meta: meta,
          body: payload,
        });

        console.log(`[Teltonika] Saved message from ${deviceIMEI}`);
      } catch (err) {
        console.error("[Teltonika] failed to save message:", err);
      }
    });

    tracker.on("raw", ({ raw, socket }) => {
      console.warn(
        "[Teltonika] raw data received (could not parse to JSON):",
        raw
      );
    });

    tracker.start();
  }
}

module.exports = TeltonikaController;
