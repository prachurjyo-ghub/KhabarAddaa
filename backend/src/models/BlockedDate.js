const mongoose = require("mongoose");

const blockedDateSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true },
    reason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BlockedDate", blockedDateSchema);
