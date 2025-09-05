const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const operatorSchema = new mongoose.Schema(
  {
    fullLegalName: { type: String, required: true, trim: true },
    profileName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    password: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "debarred"],
      default: "active",
      required: true,
    },
    companyName: String,
    companyAddress: String,
    companyDocuments: [
      {
        type: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
        verified: {
          type: Boolean,
          default: false,
        },
      },
    ],
    lastLoginAt: Date,
    lastLoginIp: String,
  },
  { timestamps: true }
);

operatorSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

module.exports = mongoose.model("Operator", operatorSchema);
