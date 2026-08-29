const mongoose = require("mongoose");

const deviceMessageSchema = new mongoose.Schema(
  {
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    body: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
    capped: {
      max: 50000,
    },
  },
);

module.exports = mongoose.model("DeviceMessage", deviceMessageSchema);
