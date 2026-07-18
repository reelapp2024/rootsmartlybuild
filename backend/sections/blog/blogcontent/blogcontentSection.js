/**
 * Blog article body — GenieBuild `blogcontent`.
 * HTML body comes from Blog.content (aiblogsQueue / CMS).
 */

module.exports = {
  id: "blogcontent",
  source: "blog_document",

  schema: {
    content: "string",
    body: "string",
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "content": "", "body": "" }

NOTE: Article HTML is loaded from the Blog collection — do not invent body copy here.
`;
  },
};
