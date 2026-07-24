/**
 * Cloudflare Workers AI — shared client for text-to-image models.
 * Env: CF_ACCOUNT_ID + CF_API_TOKEN
 * (also accepts CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN)
 */
const axios = require("axios");

const MODELS = {
  LEONARDO_LUCID: "@cf/leonardo/lucid-origin",
  FLUX_SCHNELL: "@cf/black-forest-labs/flux-1-schnell",
};

function getCfCredentials() {
  const accountId = String(
    process.env.CF_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID || ""
  ).trim();
  const token = String(
    process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN || ""
  ).trim();
  return { accountId, token };
}

function isCloudflareConfigured() {
  const { accountId, token } = getCfCredentials();
  return Boolean(accountId && token);
}

function stripDataUri(b64) {
  const s = String(b64 || "").trim();
  const m = s.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/i);
  return m ? m[1] : s;
}

function extractBase64Image(payload) {
  if (!payload) return null;
  if (typeof payload === "string") return stripDataUri(payload);

  const candidates = [
    payload.image,
    payload.result?.image,
    payload.result?.images?.[0],
    payload.result?.images?.[0]?.image,
    payload.data?.image,
    Array.isArray(payload.images) ? payload.images[0] : null,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return stripDataUri(c);
    if (c && typeof c === "object" && typeof c.image === "string") {
      return stripDataUri(c.image);
    }
    if (c && typeof c === "object" && typeof c.url === "string" && c.url.startsWith("data:")) {
      return stripDataUri(c.url);
    }
  }
  return null;
}

function errorMessageFromBuffer(buf, status) {
  try {
    const text = Buffer.from(buf || []).toString("utf8");
    const json = JSON.parse(text);
    const err =
      json?.errors?.[0]?.message ||
      json?.error?.message ||
      json?.error ||
      json?.message ||
      text;
    return typeof err === "string" ? err.slice(0, 400) : JSON.stringify(err).slice(0, 400);
  } catch {
    return `HTTP ${status}`;
  }
}

/**
 * Run a Cloudflare Workers AI text-to-image model.
 * @returns {Promise<Buffer>} raw image bytes
 */
async function runTextToImage(model, body = {}, options = {}) {
  const { accountId, token } = getCfCredentials();
  if (!accountId || !token) {
    throw new Error("CF_ACCOUNT_ID and CF_API_TOKEN are required for Cloudflare Workers AI");
  }

  const modelId = String(model || "").trim();
  if (!modelId) throw new Error("Cloudflare AI model id is required");

  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelId}`;
  const timeout = Number(options.timeout) || 180000;

  const res = await axios.post(url, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json, image/*",
    },
    timeout,
    responseType: "arraybuffer",
    validateStatus: () => true,
    maxContentLength: 50 * 1024 * 1024,
    maxBodyLength: 50 * 1024 * 1024,
  });

  const raw = Buffer.from(res.data || []);
  const contentType = String(res.headers["content-type"] || "").toLowerCase();

  if (res.status >= 400) {
    throw new Error(
      `Cloudflare AI ${modelId} failed (${res.status}): ${errorMessageFromBuffer(raw, res.status)}`
    );
  }

  // Binary image response
  if (
    contentType.startsWith("image/") ||
    (raw.length > 8 &&
      (raw[0] === 0xff || raw[0] === 0x89 || raw.slice(0, 4).toString() === "RIFF"))
  ) {
    if (raw.length < 500) {
      throw new Error(`Cloudflare AI ${modelId}: empty image binary`);
    }
    return raw;
  }

  // JSON envelope with base64 image
  let json;
  try {
    json = JSON.parse(raw.toString("utf8"));
  } catch {
    throw new Error(
      `Cloudflare AI ${modelId}: unexpected response (${contentType || "unknown"})`
    );
  }

  if (json && json.success === false) {
    throw new Error(
      `Cloudflare AI ${modelId}: ${errorMessageFromBuffer(raw, res.status)}`
    );
  }

  const b64 = extractBase64Image(json);
  if (!b64) {
    throw new Error(
      `Cloudflare AI ${modelId}: no image in response — ${JSON.stringify(json).slice(0, 300)}`
    );
  }

  const buffer = Buffer.from(b64, "base64");
  if (!buffer.length || buffer.length < 500) {
    throw new Error(`Cloudflare AI ${modelId}: decoded image too small`);
  }
  return buffer;
}

module.exports = {
  MODELS,
  getCfCredentials,
  isCloudflareConfigured,
  runTextToImage,
};
