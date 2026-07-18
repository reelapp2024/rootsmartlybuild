/**
 * Shared Bull Redis connection options.
 * Isolates this repo from other local backends sharing 127.0.0.1:6379
 * (bare queue names caused "Missing process handler for job type generate-section"
 * when another checkout's worker stole jobs).
 */
function getBullRedisConfig() {
  const host = String(process.env.redisHost || process.env.REDIS_HOST || "127.0.0.1").trim();
  const port = Number(process.env.redisPort || process.env.REDIS_PORT || 6379);
  const dbRaw = process.env.redisDb ?? process.env.REDIS_DB;
  const db = dbRaw === undefined || dbRaw === "" ? undefined : Number(dbRaw);
  const password = process.env.redisPassword || process.env.REDIS_PASSWORD || undefined;

  const cfg = { host, port };
  if (Number.isFinite(db) && db >= 0) cfg.db = db;
  if (password) cfg.password = password;
  return cfg;
}

/** Prefix Bull queue names so local multi-repo setups don't share workers. */
function bullQueueName(baseName) {
  const prefix = String(process.env.BULL_PREFIX || "ldt")
    .trim()
    .replace(/:+$/, "");
  const base = String(baseName || "").trim();
  if (!prefix) return base;
  return `${prefix}:${base}`;
}

module.exports = {
  getBullRedisConfig,
  bullQueueName,
};
