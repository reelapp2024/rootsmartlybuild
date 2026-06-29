/**
 * Post-generation validation for section AI copy.
 * Ensures fields meet minimum word counts before saving as "generated".
 */

function countWords(text = "") {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function pickText(...values) {
  for (const v of values) {
    const s = String(v || "").trim();
    if (s) return s;
  }
  return "";
}

function pushError(errors, field, actual, min, message) {
  errors.push({
    field,
    actual,
    min,
    message: message || `${field}: ${actual} words (need >= ${min})`,
  });
}

const ABOUT_SERVICE_MIN_WORDS = 75;
const ABOUT_SERVICE_TARGET_WORDS = 120;

function pickAboutServiceBody(data = {}) {
  return pickText(data.about_service, data.description, data.content);
}

function validateFaqItems(items = [], errors, minAnswerWords = 50) {
  if (!Array.isArray(items) || items.length < 4) {
    pushError(errors, "faq.items", items?.length || 0, 4, "FAQ must have at least 4 items");
    return;
  }
  const mapped = items
    .map((item) => {
      const answer = pickText(item?.answer, item?.description, item?.content);
      return { answer, words: countWords(answer) };
    })
    .filter((item) => item.answer);

  const strictPass = mapped.filter((item) => item.words >= minAnswerWords);
  if (strictPass.length >= 4) return;

  const relaxedPass = mapped.filter((item) => item.words >= 40);
  if (relaxedPass.length >= 4) return;

  mapped.forEach((item, idx) => {
    if (item.words < 40) {
      pushError(errors, `faq.items[${idx}].answer`, item.words, 40);
    }
  });
}

function validateItemDescriptions(items = [], fieldPrefix, minWords, errors, minItems = 3) {
  if (!Array.isArray(items) || items.length < minItems) {
    pushError(errors, fieldPrefix, items?.length || 0, minItems, `${fieldPrefix} needs at least ${minItems} items`);
    return;
  }
  items.forEach((item, idx) => {
    const text = pickText(item?.description, item?.line, item?.subtitle, item?.content);
    const words = countWords(text);
    if (words < minWords) {
      pushError(errors, `${fieldPrefix}[${idx}].description`, words, minWords);
    }
  });
}

/**
 * @param {string} sectionId
 * @param {object} data
 * @returns {{ ok: boolean, errors: Array<{field:string,actual:number,min:number,message:string}> }}
 */
function validateSectionContent(sectionId = "", data = {}) {
  const id = String(sectionId || "").toLowerCase().trim();
  const errors = [];

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { ok: false, errors: [{ field: "root", actual: 0, min: 1, message: "Invalid section payload" }] };
  }

  switch (id) {
    case "hero": {
      const title = pickText(data.title, data.heading);
      const subtitle = pickText(data.subtitle, data.description);
      if (countWords(title) < 4) pushError(errors, "title", countWords(title), 4);
      if (countWords(subtitle) < 18) pushError(errors, "subtitle", countWords(subtitle), 18);
      break;
    }
    case "about": {
      const subtitle = pickText(data.subtitle, data.description);
      if (countWords(subtitle) < 40) pushError(errors, "subtitle", countWords(subtitle), 40);
      const boxes = Array.isArray(data.featureBoxes) ? data.featureBoxes : [];
      boxes.forEach((box, idx) => {
        const words = countWords(box?.description);
        if (words < 12) pushError(errors, `featureBoxes[${idx}].description`, words, 12);
      });
      break;
    }
    case "features":
      validateItemDescriptions(data.items, "items", 20, errors, 4);
      break;
    case "testimonials":
      validateItemDescriptions(data.items, "items", 25, errors, 3);
      break;
    case "process": {
      const intro = pickText(data.description, data.subtitle);
      if (countWords(intro) < 12) pushError(errors, "description", countWords(intro), 12);
      const steps = Array.isArray(data.data) ? data.data : (Array.isArray(data.items) ? data.items : []);
      validateItemDescriptions(steps, "data", 18, errors, 5);
      break;
    }
    case "whychooseus":
    case "why-choose-us": {
      const boxes = Array.isArray(data.featureBoxes)
        ? data.featureBoxes
        : (Array.isArray(data.items) ? data.items : []);
      validateItemDescriptions(boxes, "featureBoxes", 18, errors, 5);
      break;
    }
    case "guarantee": {
      const list = Array.isArray(data.guaranteeList)
        ? data.guaranteeList
        : (Array.isArray(data.items) ? data.items : []);
      validateItemDescriptions(list, "guaranteeList", 8, errors, 4);
      break;
    }
    case "cta": {
      const title = pickText(data.title, data.heading);
      const subtitle = pickText(data.subtitle, data.description);
      if (countWords(title) < 4) pushError(errors, "title", countWords(title), 4);
      if (countWords(subtitle) < 12) pushError(errors, "subtitle", countWords(subtitle), 12);
      break;
    }
    case "services":
    case "servicesgrid": {
      const subtitle = pickText(data.subtitle, data.description, data.descriptionText);
      if (countWords(subtitle) < 18) pushError(errors, "subtitle", countWords(subtitle), 18);
      if (Array.isArray(data.items) && data.items.length) {
        data.items.forEach((item, idx) => {
          const words = countWords(item?.description);
          if (words < 12) pushError(errors, `items[${idx}].description`, words, 12);
        });
      }
      break;
    }
    case "serviceshero": {
      const desc = pickText(data.servicesPageDescription, data.subtitle, data.description);
      if (countWords(desc) < 70) pushError(errors, "servicesPageDescription", countWords(desc), 70);
      break;
    }
    case "servicehero": {
      const subtitle = pickText(data.serviceHeroSubtitle, data.subtitle);
      if (countWords(subtitle) < 22) pushError(errors, "serviceHeroSubtitle", countWords(subtitle), 22);
      break;
    }
    case "aboutservice": {
      const words = countWords(pickAboutServiceBody(data));
      if (words < ABOUT_SERVICE_MIN_WORDS) {
        pushError(errors, "about_service", words, ABOUT_SERVICE_MIN_WORDS);
      }
      break;
    }
    case "servicecopy": {
      const body = pickText(data.service_copy, data.copy, data.description, data.content);
      if (countWords(body) < 80) pushError(errors, "service_copy", countWords(body), 80);
      break;
    }
    case "faq":
      validateFaqItems(
        Array.isArray(data.items) ? data.items : [],
        errors,
        50
      );
      break;
    case "descriptions": {
      const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [];
      const total = paragraphs.reduce((sum, p) => sum + countWords(p), 0);
      if (total < 120) pushError(errors, "paragraphs", total, 120, "descriptions paragraphs total too short");
      break;
    }
    default:
      break;
  }

  return { ok: errors.length === 0, errors };
}

function buildLengthFixPrompt(sectionId, data, errors = []) {
  const id = String(sectionId || "").toLowerCase().trim();
  const errorLines = (errors || [])
    .map((e) => `- ${e.message || e.field}`)
    .join("\n");

  let sectionExtra = "";
  if (id === "aboutservice") {
    const currentWords = countWords(pickAboutServiceBody(data));
    const deficit = Math.max(ABOUT_SERVICE_TARGET_WORDS - currentWords, ABOUT_SERVICE_MIN_WORDS - currentWords);
    sectionExtra = `
ABOUT_SERVICE EXPANSION (mandatory):
- about_service is currently ${currentWords} words; you MUST reach at least ${ABOUT_SERVICE_TARGET_WORDS} words (hard minimum ${ABOUT_SERVICE_MIN_WORDS}).
- Add roughly ${deficit}+ new words by expanding paragraph 2 and paragraph 3 with concrete local and service-specific detail.
- Keep EXACTLY 3 paragraphs separated by two newline characters (\\n\\n).
- Do NOT remove or shorten existing good sentences.
`;
  }

  return `
You previously returned JSON for section "${id}" but several fields were TOO SHORT.

Validation failures:
${errorLines || "- unspecified length failures"}
${sectionExtra}
Current JSON (expand weak fields; keep strong fields):
${JSON.stringify(data || {}, null, 2)}

TASK:
- Return STRICT JSON ONLY with the SAME top-level keys and array lengths.
- Expand every flagged field to meet or exceed the minimum word counts.
- Add concrete, business-specific detail — no generic filler.
- Do NOT shorten any field that already passes validation.
- Do NOT add phone, email, street address, or URLs unless already present.
- Output valid JSON only.
`;
}

function isMeaningfulSectionData(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number" || typeof value === "boolean") return true;
  if (Array.isArray(value)) return value.some((item) => isMeaningfulSectionData(item));
  if (typeof value === "object") {
    const keys = Object.keys(value);
    if (!keys.length) return false;
    return keys.some((k) => isMeaningfulSectionData(value[k]));
  }
  return false;
}

module.exports = {
  ABOUT_SERVICE_MIN_WORDS,
  ABOUT_SERVICE_TARGET_WORDS,
  countWords,
  pickAboutServiceBody,
  validateSectionContent,
  buildLengthFixPrompt,
  isMeaningfulSectionData,
};
