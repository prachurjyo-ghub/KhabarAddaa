const mongoose = require("mongoose");

const diningTableSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    seats: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["Available", "Unavailable"],
      default: "Available",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DiningTable", diningTableSchema);
