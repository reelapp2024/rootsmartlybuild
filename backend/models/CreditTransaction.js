const mongoose = require("mongoose");

const creditTransactionSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    project_id: { type: mongoose.Schema.Types.Mixed, required: false, default: null, index: true },
    usage_type: { type: Number, enum: [0, 1, 2, 3], required: false, default: 3 }, // 0 OpenAI, 1 Freepik, 2 NanoBanana/images, 3 Other
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true, min: 0 },
    source: {
      type: String,
      enum: ["subscription", "purchase", "usage", "refund", "admin", "plugin"],
      required: true,
    },
    reference_id: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
    prompt_from: { type: String, default: "", trim: true },
    prompt_for: { type: String, default: "", trim: true },
    page_id: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
    input_tokens: { type: Number, default: 0, min: 0 },
    output_tokens: { type: Number, default: 0, min: 0 },
    images_count: { type: Number, default: 0, min: 0 },
    pricing: { type: Number, default: 0, min: 0 },
    status: { type: Number, enum: [0, 1], default: 1 },
    is_retried: { type: Number, enum: [0, 1], default: 0 },
    transaction_id: { type: String, default: "", trim: true },
    subscription_purchase_id: { type: mongoose.Schema.Types.Mixed, required: false, default: null },
    balance_after: { type: Number, required: true, min: 0 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("credit_transactions", creditTransactionSchema);

