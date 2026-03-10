const mongoose = require("mongoose");
const { Schema } = mongoose;

const builderNodeSchema = new Schema({
  componentDef: { type: Schema.Types.ObjectId, ref: "ComponentDefinition" },
  type: { type: String, required: true },
  variant: { type: String, trim: true },
  props: { type: Schema.Types.Mixed, default: {} }, // Fully flexible
  style: { type: Schema.Types.Mixed, default: {} }, // For styling/appearance
  animation: { type: Schema.Types.Mixed, default: {} }, // For motion/animation
  children: [{ type: Schema.Types.ObjectId, ref: "BuilderNode" }],
  parent: { type: Schema.Types.ObjectId, ref: "BuilderNode", default: null },
  pageId: { type: Schema.Types.ObjectId, ref: "Page" },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  projectId: { type: Schema.Types.ObjectId, ref: "userProjects" },
  order: { type: Number, default: 0 },
  isGlobal: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("BuilderNode", builderNodeSchema);
