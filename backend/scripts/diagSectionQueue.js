require("dotenv").config();
const Bull = require("bull");
const { getBullRedisConfig, bullQueueName } = require("../config/bullRedis");

(async () => {
  const name = bullQueueName("section-generation");
  const q = new Bull(name, { redis: getBullRedisConfig() });
  console.log("queue", name);
  console.log("counts", await q.getJobCounts());
  await q.close();
  process.exit(0);
})();
