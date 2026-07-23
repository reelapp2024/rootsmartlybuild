/**
 * Location map — GenieBuild `locationmap`.
 * Single pin from BusinessLocation lat/lng, or multi markers on homepage / all-areas.
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
