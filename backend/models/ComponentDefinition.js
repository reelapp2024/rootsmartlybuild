const mongoose = require("mongoose");
const { Schema } = mongoose;

const componentDefinitionSchema = new Schema({
  name: { type: String, required: true, trim: true },    // e.g., "Hero", "Button"
  type: { type: String, required: true, trim: true },    // e.g., "Hero", "Button"
  variant: { type: String, trim: true, default: "default" }, // e.g., "classic", "split"
  defaultProps: { type: Schema.Types.Mixed, default: {} },   // Base props for this variant
  icon: { type: String }, // For palette UI
  category: { type: String }, // e.g., "Layout", "Content"
}, { timestamps: true });

module.exports = mongoose.model("ComponentDefinition", componentDefinitionSchema);
