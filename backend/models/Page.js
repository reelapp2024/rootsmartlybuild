const mongoose = require("mongoose");
const { Schema } = mongoose;

const pageSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String },
  rootNodes: [{ type: Schema.Types.ObjectId, ref: "BuilderNode" }],
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  seo: {
    title: String,
    metaDescription: String,
    keywords: [String],
  },
  userId: { type: Schema.Types.ObjectId, ref: "User" },
  projectId: { type: Schema.Types.ObjectId, ref: "userProjects" }
}, { timestamps: true });

module.exports = mongoose.model("Page", pageSchema);
