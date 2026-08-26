require("dotenv").config();
const Bull = require("bull");
const { getBullRedisConfig, bullQueueName } = require("../config/bullRedis");

(async () => {
  const q = new Bull(bullQueueName("section-generation"), {
    redis: getBullRedisConfig(),
  });
  const failed = await q.getFailed(0, 20);
  console.log("failed count", failed.length);
  for (const j of failed) {
    console.log("---");
    console.log("id", j.id);
    console.log("name", j.name);
    console.log("attempts", j.attemptsMade, j.opts?.attempts);
    console.log("reason", String(j.failedReason || "").slice(0, 250));
    console.log("projectId", j.data?.projectId);
    console.log("sections", Array.isArray(j.data?.selectedSectionIds) ? j.data.selectedSectionIds.length : null);
    console.log("stack", String(j.stacktrace?.[0] || "").slice(0, 300));
  }
  const waiting = await q.getWaiting(0, 5);
  console.log("waiting sample", waiting.map((j) => j.id));
  await q.close();
  process.exit(0);
})();
