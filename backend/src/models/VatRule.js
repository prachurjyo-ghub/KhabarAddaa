const mongoose = require("mongoose");

const vatRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    rate: { type: Number, required: true, min: 0 },
    appliesTo: {
      type: String,
      enum: ["all", "category", "product"],
      default: "all",
    },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("VatRule", vatRuleSchema);
