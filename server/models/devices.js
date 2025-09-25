const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, trim: true },
    imei: { type: String, required: true, unique: true },
    simNumber: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    manufacturer: { type: String, required: true },
    firmwareVersion: { type: String, default: "1.0.0" },
    type: {
      type: String,
      enum: ["GPS"],
      default: "GPS",
    },
    alreadyInUse: {
      type: Boolean,
      default: false,
    },
    installedOn: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
