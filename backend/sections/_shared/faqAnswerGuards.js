/** Shared FAQ answer length rules (all page FAQ prompts). */

const FAQ_ANSWER_MIN_WORDS = 50;
const FAQ_ANSWER_MAX_WORDS = 220;
const FAQ_ANSWER_RELAXED_MIN_WORDS = 40;

function countWords(text = "") {
  return String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function trimToMaxWords(text = "", maxWords = FAQ_ANSWER_MAX_WORDS) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ");
}

function mapFaqRow(item = {}) {
  const question = String(item?.question || item?.title || "").trim();
  const answer = String(
    item?.answer || item?.description || item?.content || ""
  ).trim();
  return { question, answer };
}

/**
 * Normalize FAQ items after AI generation.
 * Prefer strict word-count pass; fall back so items[] is never wiped empty.
 */
function normalizeFaqItems(items = [], options = {}) {
  const minWords = Number(options.minWords) || FAQ_ANSWER_MIN_WORDS;
  const maxWords = Number(options.maxWords) || FAQ_ANSWER_MAX_WORDS;
  const minAcceptRatio = Number(options.minAcceptRatio) || 0.85;
  const relaxedMin = Number(options.relaxedMinWords) || FAQ_ANSWER_RELAXED_MIN_WORDS;
  const minKeep = Number(options.minKeep) || 4;

  if (!Array.isArray(items)) return [];

  const mapped = items
    .map((item) => {
      const row = mapFaqRow(item);
      return {
        question: row.question,
        answer: trimToMaxWords(row.answer, maxWords),
      };
    })
    .filter((item) => item.question && item.answer);

  const strict = mapped.filter(
    (item) => countWords(item.answer) >= Math.floor(minWords * minAcceptRatio)
  );
  if (strict.length >= minKeep) return strict.slice(0, 10);

  const relaxed = mapped.filter((item) => countWords(item.answer) >= relaxedMin);
  if (relaxed.length >= minKeep) return relaxed.slice(0, 10);
  if (relaxed.length > 0) return relaxed.slice(0, 10);

  return mapped.slice(0, 10);
}

function faqWordCountRulesPromptBlock(minWords = 90, maxWords = FAQ_ANSWER_MAX_WORDS) {
  return `
FAQ ANSWER LENGTH (mandatory):
- EACH answer MUST be between ${minWords} and ${maxWords} words (count words, not characters)
- Answers shorter than ${minWords} words are INVALID — expand with useful detail before returning JSON
- At minimum every answer needs at least ${FAQ_ANSWER_MIN_WORDS} words or validation fails
- Answers longer than ${maxWords} words are INVALID — shorten while keeping key facts
- Do not use markdown or bullet lists inside answers`;
}

/**
 * Coerce AI FAQ payloads before persisting to SectionContent.
 */
function coerceFaqSectionPayload(resultToSave = {}) {
  if (!resultToSave || typeof resultToSave !== "object" || Array.isArray(resultToSave)) {
    return resultToSave;
  }

  const rawFaqItems = Array.isArray(resultToSave.items)
    ? resultToSave.items
    : Array.isArray(resultToSave.faqs)
      ? resultToSave.faqs
      : Array.isArray(resultToSave.questions)
        ? resultToSave.questions
        : [];

  const mapped = rawFaqItems
    .slice(0, 12)
    .map((item) => mapFaqRow(item))
    .filter((item) => item.question && item.answer);

  let items = normalizeFaqItems(mapped, {
    minWords: FAQ_ANSWER_MIN_WORDS,
    maxWords: FAQ_ANSWER_MAX_WORDS,
  });
  if (items.length < 4 && mapped.length >= 4) {
    items = mapped.slice(0, 10);
  }

  resultToSave.items = items;
  delete resultToSave.faqs;
  delete resultToSave.questions;
  return resultToSave;
}

module.exports = {
  FAQ_ANSWER_MIN_WORDS,
  FAQ_ANSWER_MAX_WORDS,
  FAQ_ANSWER_RELAXED_MIN_WORDS,
  countWords,
  trimToMaxWords,
  mapFaqRow,
  normalizeFaqItems,
  coerceFaqSectionPayload,
  faqWordCountRulesPromptBlock,
};
