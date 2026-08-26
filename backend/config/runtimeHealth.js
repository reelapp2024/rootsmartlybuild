const mongoose = require("mongoose");
const Redis = require("ioredis");
const {
  getBullRedisConfig,
  getRedisConnectionLabel,
  bullQueueName,
} = require("./bullRedis");

function mongoStateLabel(state) {
  return (
    {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    }[state] || String(state)
  );
}

/**
 * Probe Redis + Mongo and print a clear startup banner.
 * Returns { ok, redis, mongo, details }.
 */
async function checkRuntimeHealth(options = {}) {
  const { timeoutMs = 4000 } = options;
  const redisCfg = getBullRedisConfig();
  const details = {
    redisHost: redisCfg.host,
    redisPort: redisCfg.port,
    redisDb: redisCfg.db ?? 0,
    redisLabel: getRedisConnectionLabel(redisCfg),
    redisViaUrl: Boolean(process.env.REDIS_URL || process.env.redisUrl),
    bullPrefix: process.env.BULL_PREFIX || "ldt",
    sectionQueue: bullQueueName("section-generation"),
    mongoState: mongoStateLabel(mongoose.connection.readyState),
    mongoDb: mongoose.connection?.name || null,
  };

  let redisOk = false;
  let redisError = null;
  let redisPingMs = null;
  const redis = new Redis({
    host: redisCfg.host,
    port: redisCfg.port,
    db: redisCfg.db ?? 0,
    password: redisCfg.password,
    username: redisCfg.username,
    tls: redisCfg.tls,
    connectTimeout: timeoutMs,
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  try {
    const t0 = Date.now();
    await redis.connect();
    const pong = await Promise.race([
      redis.ping(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis ping timeout")), timeoutMs)
      ),
    ]);
    redisPingMs = Date.now() - t0;
    redisOk = String(pong).toUpperCase() === "PONG";
  } catch (err) {
    redisError = err.message || String(err);
    redisOk = false;
  } finally {
    try {
      await redis.quit();
    } catch (_e) {
      try {
        redis.disconnect();
      } catch (_e2) {
        /* ignore */
      }
    }
  }

  const mongoOk = mongoose.connection.readyState === 1;
  const ok = redisOk && mongoOk;

  details.redisOk = redisOk;
  details.redisError = redisError;
  details.redisPingMs = redisPingMs;
  details.mongoOk = mongoOk;

  return { ok, redisOk, mongoOk, details };
}

function printRuntimeHealthBanner(result) {
  const d = result?.details || {};
  const line = (label, value, good) => {
    const mark = good === true ? "OK  " : good === false ? "FAIL" : "INFO";
    console.log(`[startup][${mark}] ${label}: ${value}`);
  };

  console.log("\n========== SMARTLYBUILD BACKEND HEALTH ==========");
  line(
    "MongoDB",
    d.mongoOk
      ? `connected (db=${d.mongoDb || "?"}, state=${d.mongoState})`
      : `NOT connected (state=${d.mongoState})`,
    Boolean(d.mongoOk)
  );
  line(
    "Redis",
    d.redisOk
      ? `connected ${d.redisLabel || `${d.redisHost}:${d.redisPort}`} ping=${d.redisPingMs}ms${d.redisViaUrl ? " via REDIS_URL" : ""}`
      : `NOT connected ${d.redisLabel || `${d.redisHost}:${d.redisPort}`} — ${d.redisError || "unknown error"}`,
    Boolean(d.redisOk)
  );
  line("Bull prefix", `${d.bullPrefix} (section queue="${d.sectionQueue}")`, true);
  line("Section AI queue", d.sectionQueue, true);
  if (!d.redisOk) {
    console.log(
      "[startup][FAIL] Section/content generation will NOT run until Redis is up (set REDIS_URL, e.g. redis://127.0.0.1:6379)."
    );
  }
  if (!d.mongoOk) {
    console.log(
      "[startup][FAIL] API/DB writes will fail until MongoDB URI is reachable (env `uri`)."
    );
  }
  console.log("=================================================\n");
}

module.exports = {
  checkRuntimeHealth,
  printRuntimeHealthBanner,
  mongoStateLabel,
};
