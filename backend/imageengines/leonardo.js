/**
 * Leonardo Lucid Origin (origin 4) via Cloudflare Workers AI
 * Model: @cf/leonardo/lucid-origin
 * Env: CF_ACCOUNT_ID + CF_API_TOKEN
 * Honors per-section sizeSpec (engineWidth/Height + final WebP cover).
 */
const {
  MAX_RETRIES,
  dimsForOrientation,
  saveBufferWebOptimizedWebp,
  resultMeta,
  maxLongEdgeForSpec,
} = require("./shared");
const {
  MODELS,
  isCloudflareConfigured,
  runTextToImage,
} = require("./cloudflareAi");

const SOURCE = "leonardo";
const MODEL = process.env.CF_LEONARDO_MODEL || MODELS.LEONARDO_LUCID;

const PHOTO_MAX_LONG_EDGE = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_LEONARDO || "2560", 10) || 2560)
);

function clampDim(n, fallback) {
  const v = Number(n) || fallback;
  const clamped = Math.max(512, Math.min(2500, Math.round(v)));
  return Math.round(clamped / 8) * 8;
}

function stepsForLeonardo() {
  const n = parseInt(process.env.CF_LEONARDO_STEPS || process.env.LEONARDO_STEPS || "20", 10);
  return Math.max(1, Math.min(40, Number.isFinite(n) ? n : 20));
}

function guidanceForLeonardo() {
  const n = parseFloat(process.env.CF_LEONARDO_GUIDANCE || "4.5");
  return Math.max(0, Math.min(10, Number.isFinite(n) ? n : 4.5));
}

async function generateOne(prompt, orientation, sizeSpec) {
  const dims = dimsForOrientation(orientation, sizeSpec);
  const width = clampDim(dims.width, 1344);
  const height = clampDim(dims.height, 768);
  const seed = Math.floor(Math.random() * 2_147_483_647);

  return runTextToImage(MODEL, {
    prompt: String(prompt).slice(0, 2000),
    width,
    height,
    steps: stepsForLeonardo(),
    num_steps: stepsForLeonardo(),
    guidance: guidanceForLeonardo(),
    seed,
  });
}

async function saveBuffer(buffer, orientation, uploadFolder, sizeSpec) {
  const edge = maxLongEdgeForSpec(sizeSpec, PHOTO_MAX_LONG_EDGE);
  const url = await saveBufferWebOptimizedWebp(
    buffer,
    "leonardo",
    uploadFolder,
    orientation,
    edge,
    sizeSpec
  );
  return resultMeta(url, SOURCE, orientation, sizeSpec);
}

async function generate(prompt, total, orientation, uploadFolder = null, sizeSpec = null) {
  if (!isCloudflareConfigured()) {
    console.error("CF_ACCOUNT_ID / CF_API_TOKEN not configured (Leonardo via Cloudflare)");
    return [];
  }

  const want = Math.min(10, Math.max(1, Number(total) || 1));
  const results = [];

  for (let i = 0; i < want; i++) {
    let buffer = null;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        buffer = await generateOne(prompt, orientation, sizeSpec);
        break;
      } catch (e) {
        console.error(`Leonardo (CF) attempt ${i + 1}/${want} try ${retry + 1}:`, e.message);
        if (retry === MAX_RETRIES) buffer = null;
      }
    }
    if (!buffer) continue;
    try {
      results.push(await saveBuffer(buffer, orientation, uploadFolder, sizeSpec));
    } catch (e) {
      console.error("Leonardo (CF) save failed:", e.message);
    }
  }

  if (results.length < want) {
    console.warn(`Leonardo (CF): got ${results.length}/${want} images`);
  }
  return results;
}

module.exports = { generate, SOURCE, MODEL };
