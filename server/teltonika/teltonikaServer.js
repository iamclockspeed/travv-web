const net = require("net");
const EventEmitter = require("events");
const Device = require("../models/devices");

class TeltonikaServer extends EventEmitter {
  constructor(options = {}) {
    super();
    this.mongoose = options.mongoose;
    this.isDBConnected = options.isDBConnected;
    this.port =
      options.port || parseInt(process.env.TELTONIKA_PORT, 10) || 5055;
    this.host = options.host || "0.0.0.0";
    this.server = null;
    this.approvedDevices = new Map();
  }

  start() {
    if (this.server) return;

    this.server = net.createServer((socket) => {
      const remote = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`[Teltonika] Connection from ${remote}`);

      socket.on("data", async (buffer) => {
        if (buffer.length === 17 && buffer[1] === 15) {
          const deviceIMEI = buffer.subarray(2, 17).toString("utf-8");

          if (!this.isDBConnected()) return;

          if (this.approvedDevices.has(deviceIMEI)) {
            socket.deviceIMEI = deviceIMEI;
            socket.write(Buffer.from([0x01]));
            return;
          }

          try {
            const device = await Device.findOne({ imei: deviceIMEI }).select(
              "imei",
            );

            if (!device) {
              console.log("IMEI Not found in DB:", deviceIMEI);
              socket.write(Buffer.from([0x00]));
              return;
            }

            console.log("Approving device:", deviceIMEI);

            socket.deviceIMEI = deviceIMEI;

            this.approvedDevices.set(deviceIMEI, {
              socket,
              lastSeen: new Date(),
            });

            socket.write(Buffer.from([0x01]));
          } catch (err) {
            console.error("DB error:", err);
            socket.write(Buffer.from([0x00]));
          }

          return;
        }

        if (socket.deviceIMEI) {
          this._handleJsonString(buffer.toString("utf-8"), socket);
        }
      });

      socket.on("close", () => {
        console.log(`[Teltonika] Disconnected ${remote}`);
        if (socket.deviceIMEI) {
          this.approvedDevices.delete(socket.deviceIMEI);
          this.onDisconnection(socket);
        }
      });

      socket.on("error", (err) => {
        console.error(
          `[Teltonika] socket error ${remote}:`,
          err.message || err,
        );
      });
    });

    this.server.on("error", (err) => {
      console.error("[Teltonika] server error:", err);
    });

    this.server.listen(this.port, this.host, () => {
      console.log(
        `[Teltonika] TCP server listening on ${this.host}:${this.port}`,
      );
    });
  }

  getMeta(socket) {
    return {
      remoteAddress: socket.remoteAddress,
      remotePort: socket.remotePort,
      deviceIMEI: socket.deviceIMEI,
      receiveTime: new Date(),
    };
  }

  _handleJsonString(str, socket) {
    try {
      const obj = JSON.parse(str);
      this._emitParsed(obj, socket);
    } catch (err) {
      console.warn(
        "[Teltonika] JSON parse failed (string). Buffering as raw:",
        err.message,
      );
      this.emit("raw", { meta: this.getMeta(socket), raw: str });
    }
  }

  _emitParsed(obj, socket) {
    this.emit("message", { meta: this.getMeta(socket), payload: obj });
  }

  onDisconnection(socket) {
    this.emit("disconnection", { meta: this.getMeta(socket) });
  }

  stop(callback) {
    if (!this.server) return callback && callback();
    this.server.close((err) => {
      this.server = null;
      callback && callback(err);
    });
  }
}

module.exports = TeltonikaServer;
