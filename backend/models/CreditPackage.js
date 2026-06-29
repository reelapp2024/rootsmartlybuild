const mongoose = require("mongoose");

const creditPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    credits: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    is_active: { type: Number, enum: [0, 1], default: 1 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("credit_packages", creditPackageSchema);

