const mongoose = require("mongoose");

const userSubscriptionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan_id: { type: mongoose.Schema.Types.ObjectId, ref: "subscription_plans", required: true },
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    status: { type: String, enum: ["active", "inactive", "cancelled", "expired"], default: "active" },
    next_billing_date: { type: Date, required: false, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("user_subscriptions", userSubscriptionSchema);

