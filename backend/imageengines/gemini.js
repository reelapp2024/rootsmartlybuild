/**
 * Gemini AI image generation (origin 2) — model: gemini-2.5-flash-image
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const {
  MAX_RETRIES,
  saveBufferWebOptimizedWebp,
} = require("./shared");

const PHOTO_MAX_LONG_EDGE = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_GEMINI || "2560", 10) || 2560)
);

async function geminiGenerateOne(prompt, orientation, uploadFolder = null) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

  const orientationInstruction =
    orientation === 1
      ? "Generate a LANDSCAPE wide image with 16:9 aspect ratio. The width MUST be significantly greater than the height."
      : "Generate a PORTRAIT vertical image with 9:16 aspect ratio. The height MUST be significantly greater than the width.";

  const enhancedPrompt = `${orientationInstruction}\n\n${prompt}\n\nHigh quality, realistic, professional photography style. Do NOT generate text or watermarks.`;

  const result = await model.generateContent(enhancedPrompt);
  const response = await result.response;

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini returned no image data");
  }

  let base64 = imagePart.inlineData.data;
  if (base64.includes("base64,")) base64 = base64.split("base64,")[1];

  const buffer = Buffer.from(base64, "base64");
  const url = await saveBufferWebOptimizedWebp(
    buffer,
    "gemini",
    uploadFolder,
    orientation,
    PHOTO_MAX_LONG_EDGE
  );
  return { url, source: "gemini", orientation };
}

/**
 * @returns {Promise<Array<{ url: string, source: string, orientation: number }>>}
 */
async function generate(prompt, total, orientation, uploadFolder = null) {
  const results = [];
  let failures = 0;

  for (let i = 0; i < total; i++) {
    let success = false;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const img = await geminiGenerateOne(prompt, orientation, uploadFolder);
        results.push(img);
        success = true;
        break;
      } catch (e) {
        console.error(`Gemini image ${i + 1} attempt ${retry + 1} failed:`, e.message);
      }
    }
    if (!success) failures++;
  }

  if (failures > 0) {
    console.warn(`Gemini: ${failures}/${total} images failed after retries`);
  }
  return results;
}

module.exports = { generate, SOURCE: "gemini" };
