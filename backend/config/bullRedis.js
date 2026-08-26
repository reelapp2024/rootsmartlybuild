/**
 * Shared Redis connection for Bull queues and utility clients.
 *
 * Prefer a full URL (REDIS_URL). Falls back to host/port pieces
 * (Railway: REDISHOST / REDISPORT / REDISPASSWORD) then legacy redisHost/redisPort.
 *
 * Local:   REDIS_URL=redis://127.0.0.1:6379
 * Railway: REDIS_URL=${{Redis.REDIS_URL}}  (Variables → reference Redis service)
 */

function firstNonEmpty(...values) {
  for (const v of values) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return null;
}

/**
 * Full Redis URL from env (hosting / Railway / local).
 * Also accepts common Railway aliases.
 */
function getRedisUrlFromEnv() {
  return firstNonEmpty(
    process.env.REDIS_URL,
    process.env.redisUrl,
    process.env.REDIS_URI,
    process.env.REDIS_PRIVATE_URL,
    process.env.REDIS_PUBLIC_URL
  );
}

/**
 * Build redis:// URL from discrete Railway / host vars when REDIS_URL is missing.
 */
function buildRedisUrlFromPieces() {
  const host = firstNonEmpty(
    process.env.REDISHOST,
    process.env.REDIS_HOST,
    process.env.redisHost
  );
  if (!host || host === "127.0.0.1" || host === "localhost") {
    // Only build from pieces when we have a real remote host (Railway internal DNS, etc.)
    // Localhost is handled by the legacy fallback below.
    if (!host) return null;
  }

  const port = firstNonEmpty(
    process.env.REDISPORT,
    process.env.REDIS_PORT,
    process.env.redisPort,
    "6379"
  );
  const password = firstNonEmpty(
    process.env.REDISPASSWORD,
    process.env.REDIS_PASSWORD,
    process.env.redisPassword
  );
  const username = firstNonEmpty(
    process.env.REDISUSER,
    process.env.REDIS_USERNAME,
    process.env.redisUsername,
    password ? "default" : null
  );

  const auth =
    password != null
      ? `${encodeURIComponent(username || "default")}:${encodeURIComponent(password)}@`
      : "";

  return `redis://${auth}${host}:${port}`;
}

function applyDbAndPasswordOverrides(cfg) {
  const dbRaw = process.env.redisDb ?? process.env.REDIS_DB;
  if (dbRaw !== undefined && dbRaw !== "") {
    const db = Number(dbRaw);
    if (Number.isFinite(db) && db >= 0) cfg.db = db;
  }
  const password = firstNonEmpty(
    process.env.redisPassword,
    process.env.REDIS_PASSWORD,
    process.env.REDISPASSWORD
  );
  if (password) cfg.password = password;
  const username = firstNonEmpty(
    process.env.redisUsername,
    process.env.REDIS_USERNAME,
    process.env.REDISUSER
  );
  if (username) cfg.username = username;
  return cfg;
}

/**
 * Parse a redis:// or rediss:// URL into ioredis / Bull-compatible options.
 */
function parseRedisUrl(urlString) {
  let u;
  try {
    u = new URL(urlString);
  } catch (err) {
    throw new Error(`Invalid REDIS_URL: ${err.message}`);
  }

  const protocol = String(u.protocol || "redis:").replace(/:$/, "").toLowerCase();
  const cfg = {
    host: u.hostname || "127.0.0.1",
    port: Number(u.port || (protocol === "rediss" ? 6380 : 6379)),
  };

  if (u.password) {
    try {
      cfg.password = decodeURIComponent(u.password);
    } catch {
      cfg.password = u.password;
    }
  }

  if (u.username) {
    try {
      cfg.username = decodeURIComponent(u.username);
    } catch {
      cfg.username = u.username;
    }
  }

  if (u.pathname && u.pathname !== "/") {
    const db = Number(u.pathname.replace(/^\//, ""));
    if (Number.isFinite(db) && db >= 0) cfg.db = db;
  }

  if (protocol === "rediss") {
    cfg.tls = {};
  }

  // Railway / dual-stack DNS: prefer happy eyeballs (IPv4+IPv6)
  if (
    cfg.host &&
    (cfg.host.includes("railway") || cfg.host.endsWith(".internal"))
  ) {
    cfg.family = 0;
  }

  return cfg;
}

function getBullRedisConfig() {
  const url = getRedisUrlFromEnv() || buildRedisUrlFromPieces();
  if (url) {
    return applyDbAndPasswordOverrides(parseRedisUrl(url));
  }

  const host = String(
    firstNonEmpty(
      process.env.REDISHOST,
      process.env.REDIS_HOST,
      process.env.redisHost,
      "127.0.0.1"
    )
  ).trim();
  const port = Number(
    firstNonEmpty(
      process.env.REDISPORT,
      process.env.REDIS_PORT,
      process.env.redisPort,
      "6379"
    )
  );
  const cfg = { host, port };
  return applyDbAndPasswordOverrides(cfg);
}

/** Safe label for logs (never includes password). */
function getRedisConnectionLabel(cfg = getBullRedisConfig()) {
  const db = cfg.db ?? 0;
  const tls = cfg.tls ? " tls" : "";
  return `${cfg.host}:${cfg.port} db=${db}${tls}`;
}

function isLocalRedisHost(host) {
  const h = String(host || "").toLowerCase();
  return h === "127.0.0.1" || h === "localhost" || h === "::1";
}

/**
 * Options for node-redis v4 `createClient()`.
 * Uses REDIS_URL when set; otherwise builds socket options from host/port.
 */
function getNodeRedisClientOptions() {
  const url = getRedisUrlFromEnv() || buildRedisUrlFromPieces();
  if (url) return { url };

  const cfg = getBullRedisConfig();
  const opts = {
    socket: {
      host: cfg.host,
      port: cfg.port,
    },
  };
  if (cfg.tls) opts.socket.tls = true;
  if (cfg.password) opts.password = cfg.password;
  if (cfg.username) opts.username = cfg.username;
  if (cfg.db !== undefined) opts.database = cfg.db;
  return opts;
}

/** One-time startup diagnostic (safe — no secrets). */
function logRedisConfigSource() {
  const url = getRedisUrlFromEnv();
  const built = !url ? buildRedisUrlFromPieces() : null;
  const cfg = getBullRedisConfig();
  const source = url
    ? "REDIS_URL"
    : built
      ? "REDISHOST/REDISPORT"
      : "fallback (127.0.0.1)";

  console.log(
    `[redis-config] source=${source} target=${getRedisConnectionLabel(cfg)}`
  );

  if (isLocalRedisHost(cfg.host) && (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID)) {
    console.error(
      "[redis-config] CRITICAL: On Railway but Redis host is localhost. " +
        "In your backend service Variables, set REDIS_URL=${{Redis.REDIS_URL}} " +
        "(or paste the Redis service REDIS_URL), then redeploy."
    );
  }
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
  getRedisUrlFromEnv,
  getRedisConnectionLabel,
  getNodeRedisClientOptions,
  parseRedisUrl,
  logRedisConfigSource,
  bullQueueName,
};
