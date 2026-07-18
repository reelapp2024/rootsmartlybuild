/**
 * Blog article hero — GenieBuild `blogarticlehero`.
 * Hydrated from Blog (+ Author) in the generation queue — not OpenAI-drafted.
 */

module.exports = {
  id: "blogarticlehero",
  source: "blog_document",

  schema: {
    category: "string",
    title: "string",
    authorName: "string",
    date: "string",
    readTime: "string",
    coverImage: { url: "string", alt: "string" },
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "category": "", "title": "", "authorName": "", "date": "", "readTime": "", "coverImage": { "url": "", "alt": "" } }

NOTE: Content is loaded from the Blog document — do not invent articles.
`;
  },
};
