const mongoose = require("mongoose");

const creditSystemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    usd_to_credits: { type: Number, required: true, default: 100, min: 0.0001 },
    min_credits_for_website_creation: { type: Number, required: true, default: 10, min: 0 },
    freepik_credits_per_image: { type: Number, required: true, default: 1, min: 0 },
    nanobanana_credits_per_image: { type: Number, required: true, default: 1, min: 0 },
    openai_input_credits_per_1k_tokens: { type: Number, required: true, default: 0.5, min: 0 },
    openai_output_credits_per_1k_tokens: { type: Number, required: true, default: 1, min: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

module.exports = mongoose.model("credit_system_config", creditSystemConfigSchema);

