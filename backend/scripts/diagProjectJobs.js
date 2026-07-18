require("dotenv").config();
const Bull = require("bull");
const crypto = require("crypto");

(async () => {
  const q = new Bull("section-generation", {
    redis: { host: process.env.redisHost || "127.0.0.1", port: Number(process.env.redisPort || 6379) },
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
