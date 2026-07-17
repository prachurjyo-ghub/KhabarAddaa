const mongoose = require("mongoose");

const restaurantImageSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RestaurantImage", restaurantImageSchema);
