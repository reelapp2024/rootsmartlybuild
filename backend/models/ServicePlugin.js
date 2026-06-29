const mongoose = require("mongoose");

const servicePluginSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    price: { type: Number, default: 0, min: 0 },
    credit_cost: { type: Number, default: 0, min: 0 },
    is_subscription_based: { type: Number, enum: [0, 1], default: 0 },
    is_active: { type: Number, enum: [0, 1], default: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("services", servicePluginSchema);

