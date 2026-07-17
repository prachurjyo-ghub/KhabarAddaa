const mongoose = require("mongoose");

const staffOtpSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    purpose: {
      type: String,
      enum: ["email_change", "password_reset"],
      required: true,
    },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

staffOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("StaffOtp", staffOtpSchema);
