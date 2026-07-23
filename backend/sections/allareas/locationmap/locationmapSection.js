/**
 * Location map — GenieBuild `locationmap` (All Areas listing).
 * Single pin or multi markers from BusinessLocation.
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
    markers: "array",
  },

  prompt() {
    return `
Return STRICT JSON ONLY:
{ "badgeText": "Service Area", "title": "Find Us On The Map", "subtitle": "", "lat": null, "lng": null, "mapEmbedUrl": "", "formattedAddress": "", "markers": [] }

NOTE: Coordinates and markers come from BusinessLocation — do not invent addresses or pins.
`;
  },
};
