const mongoose = require("mongoose");

const customerOtpSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    purpose: {
      type: String,
      enum: ["password_reset"],
      required: true,
    },
    code: { type: String, required: true },
    verified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

customerOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("CustomerOtp", customerOtpSchema);
