const mongoose = require("mongoose");

const deviceAlertSchema = new mongoose.Schema(
  {
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    capped: {
      size: 10 * 1024 * 1024,
      max: 5000,
    },
  },
);

module.exports = mongoose.model("DeviceAlert", deviceAlertSchema);
