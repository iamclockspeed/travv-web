const Device = require("../models/devices");
const DeviceMessage = require("../models/devicemessage");

class TeltonikaController {
  constructor(options = {}) {
    this.isDBConnected = options.isDBConnected;
  }
  attachTracker(tracker) {
    tracker.on("message", async ({ meta, payload }) => {
      try {
        if (!this.isDBConnected()) {
          console.warn(
            "Database is not connected yet. Skipping data received.",
          );
          return;
        }

        const deviceIMEI = meta.deviceIMEI;
        const ts = payload?.state?.reported?.ts;

        if (!this.isRealtimePacket(ts)) {
          console.warn(
            `[Teltonika] REJECTED payload | IMEI=${deviceIMEI} | ts=${ts} | age=${Math.round(
              (Date.now() - ts) / 1000,
            )}s | data: ${JSON.stringify(payload)}`,
          );
          await this.updateAndStoreData(ts, meta, payload, true);
          return;
        } else {
          console.log(
            `[Teltonika] ACCEPTED payload | IMEI=${deviceIMEI} | ts=${ts} | age=${Math.round(
              (Date.now() - ts) / 1000,
            )}s | data: ${JSON.stringify(payload)}`,
          );
        }

        await this.updateAndStoreData(ts, meta, payload);

        console.log(`[Teltonika] Saved message from ${deviceIMEI}`);
      } catch (err) {
        console.error("[Teltonika] failed to save message:", err);
      }
    });

    tracker.on("disconnection", async ({ meta }) => {
      const structured = await this.calculations(meta, null);

      await Device.updateOne(
        { imei: meta.deviceIMEI },
        {
          $set: {
            lastSeenAt: Date.now(),
            structured: structured,
            raw: null,
          },
        },
      );
    });

    tracker.on("raw", ({ raw, socket }) => {
      console.warn(
        "[Teltonika] raw data received (could not parse to JSON):",
        raw,
      );
    });

    tracker.start();
  }

  async updateAndStoreData(ts, meta, payload, skip_structured = false) {
    if (!skip_structured) {
      const structured = await this.calculations(meta, payload);

      await Device.updateOne(
        { imei: meta.deviceIMEI },
        {
          $set: {
            lastSeenAt: ts,
            structured: structured,
            raw: payload,
          },
        },
      );
    }

    await DeviceMessage.create({
      meta: meta,
      body: {
        structured: structured,
        raw: payload,
      },
    });
  }

  async calculations(meta, payload) {
    const prevState = await Device.findOne({ imei: meta.deviceIMEI });
    const structured = prevState?.structured ?? {};
    structured.safety ||= {};
    structured.safety.alerts ||= [];

    // Device Status
    structured.status = this.deviceStatusUpdate(prevState);

    if (payload) {
      const alertsMap = new Map(
        (structured.safety.alerts || []).map((a) => [a.type, a]),
      );

      // Crash
      if (payload.state.reported["247"]) {
        structured.safety.crashDetected = true;
        alertsMap.set("crash detected", {
          type: "crash detected",
          unhandled: true,
        });
      } else {
        structured.safety.crashDetected = false;
        alertsMap.delete("crash detected");
      }

      // Overspeed
      if (payload.state.reported["255"]) {
        structured.safety.overspeeding = true;
        alertsMap.set("over speeding", {
          type: "over speeding",
          unhandled: true,
        });
      } else {
        structured.safety.overspeeding = false;
        alertsMap.delete("over speeding");
      }

      structured.safety.alerts = [...alertsMap.values()];
    }

    return structured;
  }

  deviceStatusUpdate(prevState) {
    const now = Date.now();
    const diffInSeconds =
      (now - new Date(prevState.lastSeenAt).getTime()) / 1000;
    if (diffInSeconds <= 5) return "active";
    if (diffInSeconds <= 20) return "idle";
    return "offline";
  }

  isRealtimePacket(ts, windowSeconds = 5) {
    if (!ts) return false;
    const now = Date.now();
    const diffSeconds = Math.abs(now - ts) / 1000;
    return diffSeconds <= windowSeconds;
  }
}

module.exports = TeltonikaController;
