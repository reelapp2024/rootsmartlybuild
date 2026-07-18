/**
 * Blog list cards — GenieBuild `blogslist`.
 * Items come from Blog collection (queue DB builder). Prompt unused in normal flow.
 */

module.exports = {
  id: "blogslist",
  source: "blog_collection",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [
      {
        title: "string",
        excerpt: "string",
        category: "string",
        date: "string",
        read: "string",
        img: "string",
        slug: "string",
      },
    ],
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "badgeText": "", "title": "", "subtitle": "", "items": [] }

NOTE: Real items are hydrated from the Blog collection — do not invent posts.
`;
  },
};
