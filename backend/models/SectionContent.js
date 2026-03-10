const mongoose = require("mongoose");
const { Schema } = mongoose;

const SectionContentSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "userProjects",
      required: true,
      index: true
    },

    // NULL = non-location pages
    locationId: {
      type: Schema.Types.Mixed,
      default: null,
      index: true
    },

    // "home" | ObjectId
    pageId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },

    // "hero" | "cta" | ObjectId
    sectionId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },

    // AI generated JSON
    data: {
      type: Schema.Types.Mixed,
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "generated", "failed"],
      default: "generated",
      index: true
    },

    version: {
      type: Number,
      default: 1
    },

    error: {
      type: String,
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    meta: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

// Unique section per project + page + location
SectionContentSchema.index(
  { projectId: 1, locationId: 1, pageId: 1, sectionId: 1 },
  { unique: true, name: "unique_section_instance" }
);

// Fast page fetch
SectionContentSchema.index(
  { projectId: 1, locationId: 1, pageId: 1, isDeleted: 1 },
  { name: "page_fetch" }
);

// Section ops (regen hero, etc)
SectionContentSchema.index(
  { projectId: 1, sectionId: 1 },
  { name: "section_ops" }
);

module.exports = mongoose.model("SectionContent", SectionContentSchema);
