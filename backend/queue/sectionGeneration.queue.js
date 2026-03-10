const Bull = require("bull");

// Queue name
const SECTION_GENERATION_QUEUE = "section-generation";

// Redis connection
const redisConfig = {
  host: process.env.redisHost || "127.0.0.1",
  port: process.env.redisPort || 6379
};

// Create queue
const sectionGenerationQueue = new Bull(SECTION_GENERATION_QUEUE, {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 15000 // 15 seconds
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Helper to enqueue section generation
 */
async function enqueueSectionGeneration({
  projectId,
  pageId,
  sectionId,
  locationId = null,
  extraData = {}
}) {
  return sectionGenerationQueue.add("generate-section", {
    projectId,
    pageId,
    sectionId,
    locationId,
    extraData
  });
}

module.exports = {
  sectionGenerationQueue,
  enqueueSectionGeneration,
  SECTION_GENERATION_QUEUE
};
