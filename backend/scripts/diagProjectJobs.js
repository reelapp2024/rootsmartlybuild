require("dotenv").config();
const Bull = require("bull");
const { getBullRedisConfig, bullQueueName } = require("../config/bullRedis");

(async () => {
  const q = new Bull(bullQueueName("section-generation"), {
    redis: getBullRedisConfig(),
  });
  const pid = "6a5788d81c1685702a350ff9";
  for (const state of ["failed", "completed", "waiting", "active", "delayed"]) {
    const jobs = await q.getJobs([state], 0, 100);
    const mine = jobs.filter((j) => String(j.data?.projectId || "") === pid);
    console.log(state, "total", jobs.length, "for project", mine.length);
    for (const j of mine.slice(0, 5)) {
      console.log(" ", j.id, j.name, j.failedReason || "ok");
    }
  }
  await q.close();
  process.exit(0);
})();
