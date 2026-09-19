const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    routeName: { type: String, required: true, unique: true },
    pathData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("VehicleRoute", deviceSchema);
