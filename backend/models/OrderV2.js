const mongoose = require("mongoose");

const orderV2Schema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    total_amount: { type: Number, required: true, min: 0 },
    credits_used: { type: Number, default: 0, min: 0 },
    money_paid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["pending", "paid", "failed", "cancelled"], default: "paid" },
    payment_gateway: { type: String, enum: ["dummy", "stripe", "razorpay", "other"], default: "dummy" },
    item_type: { type: String, enum: ["plan", "package", "service"], required: true },
    item_id: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("orders", orderV2Schema);

