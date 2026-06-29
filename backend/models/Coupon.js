const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    usage_limit: { type: Number, default: 0, min: 0 }, // 0 = unlimited
    used_count: { type: Number, default: 0, min: 0 },
    valid_from: { type: Date, required: false, default: null },
    valid_to: { type: Date, required: false, default: null },
    is_active: { type: Number, enum: [0, 1], default: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("coupons", couponSchema);

