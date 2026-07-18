require("dotenv").config();
const Bull = require("bull");

(async () => {
  const q = new Bull("section-generation", {
    redis: { host: process.env.redisHost || "127.0.0.1", port: Number(process.env.redisPort || 6379) },
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
  const delayed = await q.getDelayed(0, 5);
  console.log("waiting", waiting.length, "delayed", delayed.length);
  await q.close();
  process.exit(0);
})();
