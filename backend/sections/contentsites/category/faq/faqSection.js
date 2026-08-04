/**
 * Content-site section prompt — category (+ subcategory pages clone this) / faq
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");
const { buildContentFaqPrompt } = require("../../_contentFaqPrompt");

module.exports = {
  id: "faq",
  pageScope: "contentsites/category",
  imageCount: 0,
  schema: {
    title: "string",
    subtitle: "string",
    body: "string",
    items: [
      {
        title: "string",
        description: "string",
        question: "string",
        answer: "string",
        link: "string",
      },
    ],
  },
  prompt(ctx) {
    return `${buildContentFaqPrompt({
      pageLabel: "category",
      project: ctx.project || {},
      extraData: ctx.extraData || {},
    })}
${IMAGE_PROMPT_JSON_RULES}
`;
  },
};
