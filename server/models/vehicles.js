const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Bus", "Car", "Van", "CNEQP", "Motorcycle", "Bicycle"],
      default: "Bus",
      required: true,
    },
    make: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    fuelType: {
      type: String,
      enum: ["Diesel", "Petrol", "CNG", "Electric", "Hybrid"],
      default: "Diesel",
      required: true,
    },
    documents: [
      {
        type: {
          type: String,
          enum: ["RC", "FitnessCertificate", "PUCC", "Insurance", "Invoice"],
          required: true,
        },
        number: { type: String, trim: true },
        expiryDate: { type: Date },
        url: { type: String, default: null },
        uploadedAt: { type: Date, default: Date.now },
        verified: { type: Boolean, default: false },
      },
    ],
    images: [
      {
        url: { type: String, required: true },
        description: { type: String, default: "" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device" },
    operator: { type: mongoose.Schema.Types.ObjectId, ref: "Operator" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehicle", vehicleSchema);
