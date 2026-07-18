/**
 * Location map — GenieBuild `locationmap`. Lat/lng from BusinessLocation (DB).
 */

module.exports = {
  id: "locationmap",
  source: "location_map",

  schema: {
    badgeText: "string",
    title: "string",
    subtitle: "string",
    lat: "number",
    lng: "number",
    mapEmbedUrl: "string",
    formattedAddress: "string",
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "badgeText": "Service Area", "title": "Find Us On The Map", "subtitle": "", "lat": null, "lng": null, "mapEmbedUrl": "", "formattedAddress": "" }

NOTE: Coordinates come from BusinessLocation — do not invent addresses.
`;
  },
};
