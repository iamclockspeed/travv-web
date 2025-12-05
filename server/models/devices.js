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
    vehicle: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
      registrationNumber: { type: String },
      assignedAt: { type: Date, default: Date.now },
    },
    alreadyInUse: {
      type: Boolean,
      default: false,
    },
    installedOn: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["offline", "idle", "active"],
      default: "offline",
    },
    lastSeenAt: { type: Date },
    raw: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
