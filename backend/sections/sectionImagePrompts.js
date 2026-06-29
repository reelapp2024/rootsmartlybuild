/**
 * Shared copy for LLM section JSON that powers AI vs stock (Freepik) image pipelines.
 * image_count is NOT model-generated — each section module sets `imageCount` (number).
 */

const LEGACY_IMAGE_KEYS = [
  "singleImagePrompt",
  "multipleImagesPrompt",
  "coverImagePrompt",
  "otherImagesPrompt",
];

function stripLegacyImagePromptFields(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  const out = { ...data };
  for (const k of LEGACY_IMAGE_KEYS) delete out[k];
  return out;
}

const IMAGE_PROMPT_JSON_RULES = `
IMAGE PROMPTS (required keys — exact snake_case names):
- "ai_image_prompt": ONE string, 28–55 words. Rich, specific description for AI image generation: subject(s), action, setting, lighting, camera feel, mood. Tied to this business category and page context. No watermarks, no overlaid text, no readable logos.
- "non_ai_image_prompt": ONE string, 3–12 words ONLY — short keywords for stock search (not a full sentence). Lowercase or natural Title Case is fine. Example good: "electrician panel wiring commercial"; example bad: "This image shows an electrician working on a panel because…"

Do NOT output: singleImagePrompt, multipleImagesPrompt, coverImagePrompt, or otherImagesPrompt.
Do NOT output "image_count" (the server sets it from section config).
`;

module.exports = {
  LEGACY_IMAGE_KEYS,
  stripLegacyImagePromptFields,
  IMAGE_PROMPT_JSON_RULES,
};
