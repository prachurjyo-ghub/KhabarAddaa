const mongoose = require("mongoose");

function deriveStatus(quantity) {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= 10) return "Low Stock";
  return "In Stock";
}

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, default: "General", trim: true },
    quantity: { type: Number, required: true, min: 0, default: 0 },
    unit: { type: String, default: "pcs", trim: true },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "Out of Stock",
    },
    lastRestocked: { type: Date, default: null },
  },
  { timestamps: true }
);

inventoryItemSchema.pre("validate", function syncStatus() {
  this.status = deriveStatus(this.quantity);
});

inventoryItemSchema.statics.deriveStatus = deriveStatus;

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
