const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },
    customerEmail: { type: String, default: "", trim: true },
    guests: { type: Number, required: true, min: 1, max: 12 },
    date: { type: String, required: true }, // YYYY-MM-DD
    startMinutes: { type: Number, required: true }, // minutes from midnight
    endMinutes: { type: Number, required: true },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningTable", default: null },
    tableName: { type: String, default: "" },
    note: { type: String, default: "" },
    source: {
      type: String,
      enum: ["online", "admin", "walk_in"],
      default: "online",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Checked In",
        "Seated",
        "Completed",
        "Cancelled",
        "No Show",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
