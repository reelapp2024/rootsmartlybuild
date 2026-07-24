/**
 * Image generation orchestrator — credits + routes to imageengines/.
 *
 * Origins: 1 Freepik · 2 Gemini · 3 Mixed · 4 Leonardo Lucid · 5 Flux 1 Schnell
 */
const {
  ORIGIN,
  normalizeOrigin,
  generateByOrigin,
  parseOrientation,
  saveBufferAsWebp,
  saveBufferWebOptimizedWebp,
  ORIENTATION_LABEL,
} = require("../imageengines");
const { trackCreditsUsage, ensureSufficientCredits } = require("./openaiHelpers");

const USAGE_TYPE = {
  OPENAI: 0,
  FREEPIK: 1,
  IMAGES: 2,
  OTHER: 3,
};

async function generateImages(prompt, total = 1, orientation = 1, origin = 1, options = {}) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("prompt is required");
  }
  if (!options?.projectId || !String(options.projectId).trim()) {
    throw new Error("projectId is required for image generation");
  }

  const projectId = String(options.projectId).trim();
  const uploadFolder =
    options && typeof options.uploadFolder === "string" && options.uploadFolder.trim()
      ? options.uploadFolder.trim()
      : `public/images/${projectId}`;

  const tracking = {
    userId: options?.userId || "system",
    projectId,
    pageId: options?.pageId || options?.projectId || null,
    promptFrom: options?.promptFrom || "imageProviderHelper",
    promptFor: options?.promptFor || "image_generation",
  };

  origin = normalizeOrigin(origin);
  total = Math.max(1, Math.min(10, Number(total) || 1));
  orientation = parseOrientation(orientation);

  if (tracking.userId && tracking.userId !== "system") {
    if (origin === ORIGIN.FREEPIK) {
      await ensureSufficientCredits({
        userId: tracking.userId,
        usageType: USAGE_TYPE.FREEPIK,
        imagesCount: total,
        minCredits: 1,
        reason: "Freepik image generation",
      });
    } else if (origin === ORIGIN.GEMINI || origin === ORIGIN.LEONARDO || origin === ORIGIN.FLUX) {
      await ensureSufficientCredits({
        userId: tracking.userId,
        usageType: USAGE_TYPE.IMAGES,
        imagesCount: total,
        minCredits: 1,
        reason: "AI image generation",
      });
    } else if (origin === ORIGIN.MIXED) {
      const freepikCount = Math.ceil(total / 2);
      const aiCount = total - freepikCount;
      await Promise.all([
        ensureSufficientCredits({
          userId: tracking.userId,
          usageType: USAGE_TYPE.FREEPIK,
          imagesCount: freepikCount,
          minCredits: 1,
          reason: "Freepik image generation",
        }),
        ensureSufficientCredits({
          userId: tracking.userId,
          usageType: USAGE_TYPE.IMAGES,
          imagesCount: aiCount,
          minCredits: 1,
          reason: "AI image generation",
        }),
      ]);
    }
  }

  const trackImageUsage = async (usageType, generatedCount, status = 1) => {
    if (!tracking.projectId) return;
    await trackCreditsUsage({
      userId: tracking.userId,
      projectId: tracking.projectId,
      usageType,
      promptFrom: tracking.promptFrom,
      promptFor: tracking.promptFor,
      pageId: tracking.pageId,
      inputTokens: 1,
      outputTokens: Math.max(0, Number(generatedCount) || 0),
      imagesCount: Math.max(0, Number(generatedCount) || 0),
      pricing: 0,
      status,
      is_retried: 0,
    });
  };

  let images = [];

  try {
    const pack = await generateByOrigin(
      origin,
      prompt,
      total,
      orientation,
      uploadFolder,
      options?.sizeSpec || null
    );
    images = pack.images || [];

    if (origin === ORIGIN.FREEPIK) {
      await trackImageUsage(USAGE_TYPE.FREEPIK, images.length, images.length > 0 ? 1 : 0);
    } else if (origin === ORIGIN.MIXED) {
      await Promise.all([
        trackImageUsage(
          USAGE_TYPE.FREEPIK,
          (pack.freepikImages || []).length,
          (pack.freepikImages || []).length > 0 ? 1 : 0
        ),
        trackImageUsage(
          USAGE_TYPE.IMAGES,
          (pack.geminiImages || []).length,
          (pack.geminiImages || []).length > 0 ? 1 : 0
        ),
      ]);
    } else {
      await trackImageUsage(USAGE_TYPE.IMAGES, images.length, images.length > 0 ? 1 : 0);
    }
  } catch (error) {
    if (origin === ORIGIN.FREEPIK) await trackImageUsage(USAGE_TYPE.FREEPIK, 0, 0);
    else if (origin === ORIGIN.MIXED) {
      await Promise.all([
        trackImageUsage(USAGE_TYPE.FREEPIK, 0, 0),
        trackImageUsage(USAGE_TYPE.IMAGES, 0, 0),
      ]);
    } else await trackImageUsage(USAGE_TYPE.IMAGES, 0, 0);
    throw error;
  }

  const sizeSpec = options?.sizeSpec || null;
  return {
    requested: total,
    generated: images.length,
    orientation,
    orientationLabel: ORIENTATION_LABEL[orientation],
    origin,
    sizeSpec: sizeSpec
      ? {
          role: sizeSpec.role,
          width: sizeSpec.width,
          height: sizeSpec.height,
          aspect: sizeSpec.aspect,
        }
      : null,
    images: images.slice(0, total),
  };
}

generateImages.saveBufferAsWebp = saveBufferAsWebp;
generateImages.saveBufferWebOptimizedWebp = saveBufferWebOptimizedWebp;
generateImages.parseOrientation = parseOrientation;
module.exports = generateImages;
