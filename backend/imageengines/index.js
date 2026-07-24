/**
 * Image engines registry.
 *
 * Origins:
 *   1 = Freepik (stock)
 *   2 = Gemini AI
 *   3 = Mixed (Freepik + Gemini)
 *   4 = Leonardo Lucid
 *   5 = Flux 1 Schnell
 */

const freepik = require("./freepik");
const gemini = require("./gemini");
const leonardo = require("./leonardo");
const flux = require("./flux");
const {
  parseOrientation,
  saveBufferAsWebp,
  saveBufferWebOptimizedWebp,
  ORIENTATION_LABEL,
  dimsForOrientation,
  GENERATED_IMAGE_TARGETS,
  targetDimsForSave,
} = require("./shared");
const {
  resolveImageSpec,
  stampImageSpecOnData,
  enrichAiPromptWithSize,
  IMAGE_SIZE_PRESETS,
} = require("./imageSizeSpec");

const ORIGIN = {
  FREEPIK: 1,
  GEMINI: 2,
  MIXED: 3,
  LEONARDO: 4,
  FLUX: 5,
};

const LABELS = {
  [ORIGIN.FREEPIK]: "Freepik",
  [ORIGIN.GEMINI]: "Gemini",
  [ORIGIN.MIXED]: "Mixed (Freepik + Gemini)",
  [ORIGIN.LEONARDO]: "Leonardo Lucid (CF)",
  [ORIGIN.FLUX]: "Flux 1 Schnell (CF)",
};

/** Origins allowed on UserProject.sectionImageOrigin */
const SECTION_ORIGINS = [
  ORIGIN.FREEPIK,
  ORIGIN.GEMINI,
  ORIGIN.LEONARDO,
  ORIGIN.FLUX,
];

/** Origins that use AI image prompts (vs Freepik keyword/stock prompts). */
const AI_PROMPT_ORIGINS = new Set([
  ORIGIN.GEMINI,
  ORIGIN.LEONARDO,
  ORIGIN.FLUX,
]);

function normalizeOrigin(origin) {
  const n = Number(origin);
  if ([1, 2, 3, 4, 5].includes(n)) return n;
  return ORIGIN.FREEPIK;
}

function isValidSectionOrigin(origin) {
  return SECTION_ORIGINS.includes(Number(origin));
}

/** Parse sectionImageOrigin from request body; fallback if missing/invalid. */
function parseSectionOrigin(value, fallback = ORIGIN.FREEPIK) {
  const n = parseInt(value, 10);
  return isValidSectionOrigin(n) ? n : normalizeOrigin(fallback);
}

function usesAiPrompt(origin) {
  return AI_PROMPT_ORIGINS.has(normalizeOrigin(origin));
}

/**
 * Run a single engine by origin (not mixed).
 */
async function runEngine(origin, prompt, total, orientation, uploadFolder, sizeSpec = null) {
  const o = normalizeOrigin(origin);
  if (o === ORIGIN.FREEPIK) {
    return freepik.generate(prompt, total, orientation, uploadFolder, sizeSpec);
  }
  if (o === ORIGIN.GEMINI) {
    return gemini.generate(prompt, total, orientation, uploadFolder, sizeSpec);
  }
  if (o === ORIGIN.LEONARDO) {
    return leonardo.generate(prompt, total, orientation, uploadFolder, sizeSpec);
  }
  if (o === ORIGIN.FLUX) {
    return flux.generate(prompt, total, orientation, uploadFolder, sizeSpec);
  }
  throw new Error(`Unknown image origin: ${origin}`);
}

/**
 * Generate images for any origin including mixed (3).
 * @returns {Promise<{ images: Array, freepikImages?: Array, geminiImages?: Array }>}
 */
async function generateByOrigin(
  origin,
  prompt,
  total,
  orientation,
  uploadFolder,
  sizeSpec = null
) {
  const o = normalizeOrigin(origin);
  const want = Math.max(1, Math.min(10, Number(total) || 1));

  if (o === ORIGIN.MIXED) {
    const freepikCount = Math.ceil(want / 2);
    const geminiCount = want - freepikCount;
    let freepikImages = [];
    let geminiImages = [];
    [freepikImages, geminiImages] = await Promise.all([
      freepik.generate(prompt, freepikCount, orientation, uploadFolder, sizeSpec),
      gemini.generate(prompt, geminiCount, orientation, uploadFolder, sizeSpec),
    ]);
    let images = [...freepikImages, ...geminiImages];
    if (images.length < want) {
      const backfill = await freepik.generate(
        prompt,
        want - images.length,
        orientation,
        uploadFolder,
        sizeSpec
      );
      freepikImages = [...freepikImages, ...backfill];
      images = [...images, ...backfill];
    }
    return {
      images: images.slice(0, want),
      freepikImages,
      geminiImages,
    };
  }

  const images = await runEngine(o, prompt, want, orientation, uploadFolder, sizeSpec);
  return { images: images.slice(0, want) };
}

module.exports = {
  ORIGIN,
  LABELS,
  SECTION_ORIGINS,
  normalizeOrigin,
  isValidSectionOrigin,
  parseSectionOrigin,
  usesAiPrompt,
  generateByOrigin,
  runEngine,
  parseOrientation,
  saveBufferAsWebp,
  saveBufferWebOptimizedWebp,
  ORIENTATION_LABEL,
  dimsForOrientation,
  GENERATED_IMAGE_TARGETS,
  targetDimsForSave,
  resolveImageSpec,
  stampImageSpecOnData,
  enrichAiPromptWithSize,
  IMAGE_SIZE_PRESETS,
};
