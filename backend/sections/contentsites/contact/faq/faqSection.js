/**
 * Content-site section prompt — contact / faq
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");
const { buildContentFaqPrompt } = require("../../_contentFaqPrompt");

module.exports = {
  id: "faq",
  pageScope: "contentsites/contact",
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
      pageLabel: "contact",
      project: ctx.project || {},
      extraData: {
        ...(ctx.extraData || {}),
        // Bias toward contact/support questions on this page
        faqKeywords: [
          ...((ctx.extraData && ctx.extraData.faqKeywords) || []),
          "How do I get in touch?",
          "How long until I hear back?",
          "Can I suggest a topic?",
          "Do you accept guest posts or collaborations?",
        ],
      },
    })}
${IMAGE_PROMPT_JSON_RULES}
`;
  },
};
