const mongoose = require("mongoose");

const sizeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    extra: { type: Number, default: 0 },
  },
  { _id: false }
);

const toppingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const menuItemSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: "" },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    homepageBadge: {
      type: String,
      enum: [
        "none",
        "weekly-best-seller",
        "premium",
        "popular",
        "chef-special",
      ],
      default: "none",
    },
    customizable: { type: Boolean, default: false },
    sizes: { type: [sizeSchema], default: [] },
    toppings: { type: [toppingSchema], default: [] },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MenuItem", menuItemSchema);
