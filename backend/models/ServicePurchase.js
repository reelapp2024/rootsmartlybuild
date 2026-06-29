const mongoose = require("mongoose");

const servicePurchaseSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "services", required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "orders", required: true },
    paid_by: { type: String, enum: ["credits", "money", "mixed"], required: true },
    status: { type: String, enum: ["active", "inactive", "failed"], default: "active" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("service_purchases", servicePurchaseSchema);

