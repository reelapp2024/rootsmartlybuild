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

    // "home" | ObjectId
    pageId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },

    // For service bundle rows (sectionId === "service_sections"), explicit linkage.
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "service",
      default: null,
      index: true
    },

    // "hero" | "cta" | ObjectId
    sectionId: {
      type: Schema.Types.Mixed,
      required: true,
      index: true
    },

     // ✅ NEW FIELD
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

// Unique service bundle row per project+service+location.
SectionContentSchema.index(
  { projectId: 1, sectionId: 1, serviceId: 1, locationId: 1 },
  {
    unique: true,
    name: "unique_service_bundle_instance",
    partialFilterExpression: {
      sectionId: "service_sections",
      isDeleted: false
    }
  }
);

// Unique page-scoped row per project+page+section+location.
SectionContentSchema.index(
  { projectId: 1, pageId: 1, sectionId: 1, locationId: 1 },
  {
    unique: true,
    name: "unique_page_section_instance",
    partialFilterExpression: {
      sectionId: { $ne: "service_sections" },
      isDeleted: false
    }
  }
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
