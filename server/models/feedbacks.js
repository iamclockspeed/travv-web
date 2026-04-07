const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
    },
    rating: { type: Number, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Feedback", feedbackSchema);
