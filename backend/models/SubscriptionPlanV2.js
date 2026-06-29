const mongoose = require("mongoose");

const subscriptionPlanV2Schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    billing_type: {
      type: String,
      enum: ["monthly", "yearly", "one_time"],
      required: true,
      default: "monthly",
    },
    credits_per_cycle: { type: Number, default: 0, min: 0 },
    validity_days: { type: Number, default: 30, min: 1 },
    is_active: { type: Number, enum: [0, 1], default: 1 },
    plugin_ids: [{ type: String, trim: true }],
    payment_gateway_config: {
      stripe: { type: mongoose.Schema.Types.Mixed, default: {} },
      razorpay: { type: mongoose.Schema.Types.Mixed, default: {} },
      other: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("subscription_plans", subscriptionPlanV2Schema);

