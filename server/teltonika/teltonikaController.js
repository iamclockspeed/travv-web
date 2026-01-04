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

        const structured = await this.calculations(deviceIMEI, payload);

        await Device.updateOne(
          { imei: deviceIMEI },
          {
            $set: {
              lastSeenAt: Date.now(),
              structured: structured,
              raw: payload,
            },
          }
        );

        await DeviceMessage.create({
          meta: meta,
          body: {
            structured: structured,
            raw: payload,
          },
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

    tracker.on("disconnected", async ({ deviceIMEI }) => {
      const prevState = await Device.findOne({ imei: deviceIMEI });

      const status = this.deviceStatusUpdate(prevState);

      await Device.updateOne(
        { imei: deviceIMEI },
        {
          $set: {
            lastSeenAt: Date.now(),
            "structured.status": status,
          },
        }
      );
    });

    tracker.start();
  }
  async calculations(deviceIMEI, payload) {
    const prevState = await Device.findOne({ imei: deviceIMEI });
    const structured = prevState?.structured ?? {};
    structured.safety ||= {};

    // Device Status
    structured.status = this.deviceStatusUpdate(prevState, structured);

    if (payload.state.reported["247"]) {
      structured.safety.crashDetected = true;
    }

    if (payload.state.reported["255"]) {
      structured.safety.overspeeding = true;
    }

    return structured;
  }

  deviceStatusUpdate(prevState) {
    const now = Date.now();
    const diffInSeconds =
      (now - new Date(prevState.lastSeenAt).getTime()) / 1000;
    if (diffInSeconds <= 2) {
      return "active";
    }
    if (diffInSeconds <= 20) {
      return "idle";
    }
    return "offline";
  }
}

module.exports = TeltonikaController;
