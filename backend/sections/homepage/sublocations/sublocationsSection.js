/**
 * Sub-locations grid — GenieBuild `sublocations`. Children from BusinessLocation (DB).
 */

module.exports = {
  id: "sublocations",
  source: "business_locations",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    items: [{ name: "string", meta: "string", link: "string" }],
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "badgeText": "", "title": "", "subtitle": "", "items": [] }

NOTE: Items are hydrated from child BusinessLocation rows.
`;
  },
};
