/**
 * Flux 1 Schnell (origin 5) via Cloudflare Workers AI
 * Model: @cf/black-forest-labs/flux-1-schnell
 * Env: CF_ACCOUNT_ID + CF_API_TOKEN
 * API has no width/height — final size comes from sizeSpec WebP cover.
 */
const {
  MAX_RETRIES,
  saveBufferWebOptimizedWebp,
  resultMeta,
  maxLongEdgeForSpec,
} = require("./shared");
const {
  MODELS,
  isCloudflareConfigured,
  runTextToImage,
} = require("./cloudflareAi");

const SOURCE = "flux";
const MODEL = process.env.CF_FLUX_MODEL || MODELS.FLUX_SCHNELL;

const PHOTO_MAX_LONG_EDGE = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_FLUX || "2560", 10) || 2560)
);

function stepsForFlux() {
  const n = parseInt(process.env.CF_FLUX_STEPS || process.env.FLUX_STEPS || "4", 10);
  return Math.max(1, Math.min(8, Number.isFinite(n) ? n : 4));
}

async function generateOne(prompt) {
  const seed = Math.floor(Math.random() * 2_147_483_647);
  return runTextToImage(MODEL, {
    prompt: String(prompt).slice(0, 2048),
    steps: stepsForFlux(),
    seed,
  });
}

async function saveBuffer(buffer, orientation, uploadFolder, sizeSpec) {
  const edge = maxLongEdgeForSpec(sizeSpec, PHOTO_MAX_LONG_EDGE);
  const url = await saveBufferWebOptimizedWebp(
    buffer,
    "flux",
    uploadFolder,
    orientation,
    edge,
    sizeSpec
  );
  return resultMeta(url, SOURCE, orientation, sizeSpec);
}

async function generate(prompt, total, orientation, uploadFolder = null, sizeSpec = null) {
  if (!isCloudflareConfigured()) {
    console.error("CF_ACCOUNT_ID / CF_API_TOKEN not configured (Flux via Cloudflare)");
    return [];
  }

  const want = Math.min(10, Math.max(1, Number(total) || 1));
  const results = [];

  for (let i = 0; i < want; i++) {
    let buffer = null;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        buffer = await generateOne(prompt);
        break;
      } catch (e) {
        console.error(`Flux (CF) attempt ${i + 1}/${want} try ${retry + 1}:`, e.message);
        if (retry === MAX_RETRIES) buffer = null;
      }
    }
    if (!buffer) continue;
    try {
      results.push(await saveBuffer(buffer, orientation, uploadFolder, sizeSpec));
    } catch (e) {
      console.error("Flux (CF) save failed:", e.message);
    }
  }

  if (results.length < want) {
    console.warn(`Flux (CF): got ${results.length}/${want} images`);
  }
  return results;
}

module.exports = { generate, SOURCE, MODEL };
