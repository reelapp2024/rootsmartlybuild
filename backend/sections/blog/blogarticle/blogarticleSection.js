/**
 * @deprecated Full articles are created by aiblogsQueue into the Blog collection.
 * GenieBuild article sections use blogarticlehero + blogcontent (DB hydrate).
 * This module remains only so old jobs resolve without inventing live page content.
 */
module.exports = {
  id: "blogarticle",
  source: "aiblogs_queue",

  schema: {
    _notice: "string",
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{
  "_notice": "Article bodies are generated into the Blog collection via aiblogsQueue, not this section."
}

Do not write a full article here.
`;
  },
};
