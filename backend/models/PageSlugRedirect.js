const mongoose = require("mongoose");
const { Schema } = mongoose;

const pageSlugRedirectSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "userProjects",
      required: true,
      index: true,
    },
    fromSlug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    pageId: {
      type: Schema.Types.ObjectId,
      ref: "WebsitePage",
      required: true,
      index: true,
    },
    statusCode: {
      type: Number,
      default: 301,
    },
  },
  { timestamps: true }
);

pageSlugRedirectSchema.index({ projectId: 1, fromSlug: 1 }, { unique: true });

module.exports = mongoose.model("PageSlugRedirect", pageSlugRedirectSchema);
