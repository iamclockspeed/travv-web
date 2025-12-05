const mongoose = require("mongoose");

const TeltonikaMessageSchema = new mongoose.Schema({
  deviceId: { type: String },
  payload: { type: Object, required: true },
  raw: { type: String },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TeltonikaMessage", TeltonikaMessageSchema);
