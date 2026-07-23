/**
 * Flux 1 Schnell (origin 5) via fal.ai
 * Endpoint: https://fal.run/fal-ai/flux/schnell
 * Env: FAL_KEY (preferred) or FLUX_API_KEY
 */
const axios = require("axios");
const {
  MAX_RETRIES,
  sleep,
  parseOrientation,
  downloadImageBuffer,
  saveBufferWebOptimizedWebp,
} = require("./shared");

const SOURCE = "flux";
const FAL_ENDPOINT = "https://fal.run/fal-ai/flux/schnell";
const FAL_QUEUE_BASE = "https://queue.fal.run/fal-ai/flux/schnell";

const PHOTO_MAX_LONG_EDGE = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_FLUX || "2560", 10) || 2560)
);

function getApiKey() {
  return String(
    process.env.FAL_KEY || process.env.FLUX_API_KEY || ""
  ).trim();
}

function authHeaders() {
  const key = getApiKey();
  if (!key) throw new Error("FAL_KEY (or FLUX_API_KEY) not configured");
  return {
    Authorization: `Key ${key}`,
    "Content-Type": "application/json",
  };
}

function imageSizeForOrientation(orientation) {
  return parseOrientation(orientation) === 2
    ? "portrait_16_9"
    : "landscape_16_9";
}

function extractImageUrls(data) {
  const images = data?.images || data?.data?.images || [];
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter((u) => typeof u === "string" && u.startsWith("http"));
}

async function falRunSync(prompt, numImages, orientation) {
  const body = {
    prompt: String(prompt),
    num_images: Math.max(1, Math.min(4, numImages)),
    num_inference_steps: Number(process.env.FLUX_STEPS || 4) || 4,
    image_size: imageSizeForOrientation(orientation),
    enable_safety_checker: true,
    output_format: "jpeg",
  };

  const res = await axios.post(FAL_ENDPOINT, body, {
    headers: authHeaders(),
    timeout: 180000,
    validateStatus: () => true,
  });

  // Queue response (async) — poll until ready
  if (res.status === 200 && extractImageUrls(res.data).length) {
    return extractImageUrls(res.data);
  }

  const requestId =
    res.data?.request_id ||
    res.data?.requestId ||
    res.headers?.["x-fal-request-id"];

  if (requestId || res.status === 202) {
    return pollFalQueue(requestId || res.data?.request_id, prompt, numImages, orientation);
  }

  if (res.status >= 400) {
    const msg =
      res.data?.detail ||
      res.data?.error ||
      res.data?.message ||
      JSON.stringify(res.data || {}).slice(0, 300);
    throw new Error(`Flux (fal) failed (${res.status}): ${msg}`);
  }

  const urls = extractImageUrls(res.data);
  if (!urls.length) {
    throw new Error(
      `Flux (fal): no images in response — ${JSON.stringify(res.data).slice(0, 400)}`
    );
  }
  return urls;
}

async function pollFalQueue(requestId, prompt, numImages, orientation) {
  if (!requestId) {
    // Fallback: submit via queue explicitly
    const submit = await axios.post(
      FAL_QUEUE_BASE,
      {
        prompt: String(prompt),
        num_images: Math.max(1, Math.min(4, numImages)),
        num_inference_steps: Number(process.env.FLUX_STEPS || 4) || 4,
        image_size: imageSizeForOrientation(orientation),
        enable_safety_checker: true,
        output_format: "jpeg",
      },
      { headers: authHeaders(), timeout: 60000, validateStatus: () => true }
    );
    requestId = submit.data?.request_id;
    if (!requestId) {
      throw new Error(
        `Flux queue submit failed: ${JSON.stringify(submit.data).slice(0, 300)}`
      );
    }
  }

  for (let i = 0; i < 60; i++) {
    const statusRes = await axios.get(
      `${FAL_QUEUE_BASE}/requests/${requestId}/status`,
      { headers: authHeaders(), timeout: 30000, validateStatus: () => true }
    );
    const st = String(statusRes.data?.status || "").toUpperCase();

    if (st === "COMPLETED" || st === "OK") {
      const resultRes = await axios.get(
        `${FAL_QUEUE_BASE}/requests/${requestId}`,
        { headers: authHeaders(), timeout: 60000, validateStatus: () => true }
      );
      const urls = extractImageUrls(resultRes.data);
      if (!urls.length) {
        throw new Error("Flux queue COMPLETED but no image URLs");
      }
      return urls;
    }

    if (st === "FAILED" || st === "ERROR" || statusRes.status >= 400) {
      throw new Error(
        `Flux queue failed: ${JSON.stringify(statusRes.data || {}).slice(0, 300)}`
      );
    }

    await sleep(1500);
  }
  throw new Error(`Flux queue timed out (${requestId})`);
}

async function saveUrl(url, orientation, uploadFolder) {
  const buffer = await downloadImageBuffer(url);
  if (!buffer || buffer.length < 500) {
    throw new Error("Empty Flux image buffer");
  }
  const saved = await saveBufferWebOptimizedWebp(
    buffer,
    "flux",
    uploadFolder,
    orientation,
    PHOTO_MAX_LONG_EDGE
  );
  return { url: saved, source: SOURCE, orientation };
}

/**
 * Generate up to `total` images (fal max 4 per call; batches if needed).
 */
async function generate(prompt, total, orientation, uploadFolder = null) {
  if (!getApiKey()) {
    console.error("FAL_KEY (or FLUX_API_KEY) not configured");
    return [];
  }

  const want = Math.min(10, Math.max(1, Number(total) || 1));
  const results = [];
  let remaining = want;

  while (remaining > 0 && results.length < want) {
    const batch = Math.min(4, remaining);
    let urls = [];

    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        urls = await falRunSync(prompt, batch, orientation);
        break;
      } catch (e) {
        console.error(`Flux batch attempt ${retry + 1} failed:`, e.message);
        if (retry === MAX_RETRIES) urls = [];
      }
    }

    for (const imageUrl of urls) {
      if (results.length >= want) break;
      try {
        const img = await saveUrl(imageUrl, orientation, uploadFolder);
        results.push(img);
      } catch (e) {
        console.error("Flux save failed:", e.message);
      }
    }

    if (!urls.length) break;
    remaining = want - results.length;
  }

  if (results.length < want) {
    console.warn(`Flux: got ${results.length}/${want} images`);
  }
  return results;
}

module.exports = { generate, SOURCE };
