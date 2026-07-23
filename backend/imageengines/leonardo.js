/**
 * Leonardo Lucid Origin (origin 4)
 * API: https://cloud.leonardo.ai — model lucid-origin
 * Env: LEONARDO_API_KEY
 */
const axios = require("axios");
const {
  MAX_RETRIES,
  sleep,
  dimsForOrientation,
  downloadImageBuffer,
  saveBufferWebOptimizedWebp,
} = require("./shared");

const SOURCE = "leonardo";
const API_BASE = "https://cloud.leonardo.ai/api/rest";
const MODEL = "lucid-origin";
/** Lucid Origin model UUID (v1 API) */
const MODEL_ID_V1 = "7b592283-e8a7-4c5a-9ba6-d18c31f258b9";
/** Stock Photo style — good default for business website imagery */
const STYLE_STOCK = "5bdc3f2a-1be6-4d1c-8e77-992a30824a2c";
const PHOTO_MAX_LONG_EDGE = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_LEONARDO || "2560", 10) || 2560)
);
const POLL_MS = 2500;
const POLL_MAX = 48; // ~2 min

function getApiKey() {
  return String(process.env.LEONARDO_API_KEY || "").trim();
}

function authHeaders() {
  const key = getApiKey();
  if (!key) throw new Error("LEONARDO_API_KEY not configured");
  return {
    accept: "application/json",
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

function extractGenerationId(data) {
  return (
    data?.generationId ||
    data?.generation_id ||
    data?.sdGenerationJob?.generationId ||
    data?.generate?.generationId ||
    data?.generations?.[0]?.id ||
    data?.id ||
    null
  );
}

function extractStatusPayload(data) {
  return (
    data?.generations_by_pk ||
    data?.generation ||
    data?.generationsByPk ||
    data ||
    {}
  );
}

function extractImageUrls(payload) {
  const images =
    payload?.generated_images ||
    payload?.generatedImages ||
    payload?.images ||
    [];
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => img?.url || img?.imageUrl || img?.src || null)
    .filter((u) => typeof u === "string" && u.startsWith("http"));
}

async function createGeneration(prompt, quantity, orientation) {
  const dims = dimsForOrientation(orientation);
  const qty = Math.max(1, Math.min(8, quantity));
  const mode = String(process.env.LEONARDO_MODE || "FAST").toUpperCase() === "ULTRA"
    ? "ULTRA"
    : "FAST";

  // Prefer v2 Lucid Origin API
  const v2Body = {
    model: MODEL,
    parameters: {
      mode,
      width: dims.width,
      height: dims.height,
      prompt: String(prompt).slice(0, 2000),
      quantity: qty,
      style_ids: [STYLE_STOCK],
      prompt_enhance: "AUTO",
    },
    public: false,
  };

  const v2 = await axios.post(`${API_BASE}/v2/generations`, v2Body, {
    headers: authHeaders(),
    timeout: 60000,
    validateStatus: () => true,
  });

  if (v2.status < 400) {
    const generationId = extractGenerationId(v2.data);
    if (generationId) return String(generationId);
  }

  // Fallback: v1 create with Lucid Origin modelId
  console.warn(
    `[Leonardo] v2 create ${v2.status} — falling back to v1:`,
    JSON.stringify(v2.data || {}).slice(0, 200)
  );

  const v1Body = {
    modelId: MODEL_ID_V1,
    prompt: String(prompt).slice(0, 1500),
    width: dims.width,
    height: dims.height,
    num_images: qty,
    contrast: 3.5,
    styleUUID: STYLE_STOCK,
    alchemy: false,
    ultra: mode === "ULTRA",
  };

  const v1 = await axios.post(`${API_BASE}/v1/generations`, v1Body, {
    headers: authHeaders(),
    timeout: 60000,
    validateStatus: () => true,
  });

  if (v1.status >= 400) {
    const msg =
      v1.data?.error ||
      v1.data?.message ||
      JSON.stringify(v1.data || {}).slice(0, 300);
    throw new Error(`Leonardo create failed (${v1.status}): ${msg}`);
  }

  const generationId = extractGenerationId(v1.data);
  if (!generationId) {
    throw new Error(
      `Leonardo create: missing generationId — ${JSON.stringify(v1.data).slice(0, 400)}`
    );
  }
  return String(generationId);
}

async function pollGeneration(generationId) {
  for (let i = 0; i < POLL_MAX; i++) {
    const res = await axios.get(`${API_BASE}/v1/generations/${generationId}`, {
      headers: authHeaders(),
      timeout: 45000,
      validateStatus: () => true,
    });

    if (res.status >= 400) {
      throw new Error(
        `Leonardo poll failed (${res.status}): ${JSON.stringify(res.data || {}).slice(0, 300)}`
      );
    }

    const payload = extractStatusPayload(res.data);
    const status = String(payload?.status || res.data?.status || "").toUpperCase();

    if (status === "COMPLETE" || status === "COMPLETED" || status === "SUCCESS") {
      const urls = extractImageUrls(payload);
      if (!urls.length) {
        throw new Error("Leonardo COMPLETE but no image URLs");
      }
      return urls;
    }

    if (status === "FAILED" || status === "ERROR") {
      throw new Error(
        `Leonardo generation failed: ${payload?.message || status}`
      );
    }

    await sleep(POLL_MS);
  }
  throw new Error(`Leonardo generation timed out (${generationId})`);
}

async function saveUrl(url, orientation, uploadFolder) {
  const buffer = await downloadImageBuffer(url);
  if (!buffer || buffer.length < 500) {
    throw new Error("Empty Leonardo image buffer");
  }
  const saved = await saveBufferWebOptimizedWebp(
    buffer,
    "leonardo",
    uploadFolder,
    orientation,
    PHOTO_MAX_LONG_EDGE
  );
  return { url: saved, source: SOURCE, orientation };
}

/**
 * Generate up to `total` images (Leonardo max 8 per request; batches if needed).
 */
async function generate(prompt, total, orientation, uploadFolder = null) {
  if (!getApiKey()) {
    console.error("LEONARDO_API_KEY not configured");
    return [];
  }

  const want = Math.min(10, Math.max(1, Number(total) || 1));
  const results = [];
  let remaining = want;

  while (remaining > 0 && results.length < want) {
    const batch = Math.min(8, remaining);
    let urls = [];

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const generationId = await createGeneration(prompt, batch, orientation);
        urls = await pollGeneration(generationId);
        break;
      } catch (e) {
        console.error(
          `Leonardo batch attempt ${retry + 1} failed:`,
          e.message
        );
        if (retry === MAX_RETRIES) urls = [];
      }
    }

    for (const imageUrl of urls) {
      if (results.length >= want) break;
      try {
        const img = await saveUrl(imageUrl, orientation, uploadFolder);
        results.push(img);
      } catch (e) {
        console.error("Leonardo save failed:", e.message);
      }
    }

    if (!urls.length) break;
    remaining = want - results.length;
  }

  if (results.length < want) {
    console.warn(`Leonardo: got ${results.length}/${want} images`);
  }
  return results;
}

module.exports = { generate, SOURCE };
