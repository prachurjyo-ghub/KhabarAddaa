const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    size: { type: Object, default: null },
    toppings: { type: [Object], default: [] },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", default: null },
    customerName: { type: String, default: "" },
    customerPhone: { type: String, default: "" },
    orderType: {
      type: String,
      enum: ["delivery", "takeaway", "dine-in"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PREPARING", "READY", "IN_TRANSIT", "DELIVERED", "CANCELLED"],
      default: "PENDING",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bkash", "card"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "refunded"],
      default: "unpaid",
    },
    address: { type: String, default: "" },
    instructions: { type: String, default: "" },
    tableId: { type: mongoose.Schema.Types.ObjectId, ref: "DiningTable", default: null },
    tableName: { type: String, default: "" },
    guests: { type: Number, default: null },
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null },
    items: { type: [orderItemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    createdByStaffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
