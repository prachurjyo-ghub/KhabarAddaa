const mongoose = require("mongoose");

const dateOverrideSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // YYYY-MM-DD
    isClosed: { type: Boolean, default: false },
    openMinutes: { type: Number, default: null },
    closeMinutes: { type: Number, default: null },
    slotDurationMinutes: { type: Number, default: null },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DateOverride", dateOverrideSchema);
