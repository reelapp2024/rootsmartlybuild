const mongoose = require("mongoose");

const offerV2Schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    applicable_to: { type: String, enum: ["plan", "service", "package"], required: true },
    target_ids: [{ type: mongoose.Schema.Types.Mixed }],
    user_scope: { type: String, enum: ["all", "specific"], default: "all" },
    user_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    valid_from: { type: Date, required: false, default: null },
    valid_to: { type: Date, required: false, default: null },
    is_active: { type: Number, enum: [0, 1], default: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("offers", offerV2Schema);

