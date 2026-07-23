/**
 * Google Places helpers (server-side). Key stays on the backend.
 * Uses GooglePlacesApiKey / GOOGLE_MAPS_API_KEY.
 */

const axios = require("axios");

function getGoogleMapsKey() {
  return (
    String(process.env.GooglePlacesApiKey || process.env.GOOGLE_MAPS_API_KEY || "").trim() ||
    null
  );
}

function getLocationIqKey() {
  return String(process.env.LOCATIONIQ_API_KEY || "").trim() || null;
}

/**
 * @param {string} input
 * @param {{ sessionToken?: string, types?: string, components?: string }} [opts]
 */
async function placesAutocomplete(input, opts = {}) {
  const key = getGoogleMapsKey();
  if (!key) {
    const err = new Error("Google Places API key is not configured");
    err.status = 503;
    throw err;
  }
  const q = String(input || "").trim();
  if (q.length < 2) return [];

  const params = {
    input: q,
    key,
    types: opts.types || "geocode",
  };
  if (opts.sessionToken) params.sessiontoken = opts.sessionToken;
  if (opts.components) params.components = opts.components;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/autocomplete/json",
    { params, timeout: 12000 }
  );

  if (data.status && data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    const err = new Error(data.error_message || `Places autocomplete failed: ${data.status}`);
    err.status = 502;
    throw err;
  }

  return (data.predictions || []).map((p) => ({
    placeId: p.place_id,
    description: p.description,
    mainText: p.structured_formatting?.main_text || p.description,
    secondaryText: p.structured_formatting?.secondary_text || "",
  }));
}

/**
 * @param {string} placeId
 * @param {{ sessionToken?: string }} [opts]
 */
async function placesDetails(placeId, opts = {}) {
  const key = getGoogleMapsKey();
  if (!key) {
    const err = new Error("Google Places API key is not configured");
    err.status = 503;
    throw err;
  }
  const id = String(placeId || "").trim();
  if (!id) {
    const err = new Error("placeId is required");
    err.status = 400;
    throw err;
  }

  const params = {
    place_id: id,
    key,
    fields: "place_id,name,formatted_address,geometry,address_component",
  };
  if (opts.sessionToken) params.sessiontoken = opts.sessionToken;

  const { data } = await axios.get(
    "https://maps.googleapis.com/maps/api/place/details/json",
    { params, timeout: 12000 }
  );

  if (data.status !== "OK" || !data.result) {
    const err = new Error(data.error_message || `Place details failed: ${data.status}`);
    err.status = 502;
    throw err;
  }

  const r = data.result;
  const loc = r.geometry?.location || {};
  const vp = r.geometry?.viewport || {};
  const lat = typeof loc.lat === "number" ? loc.lat : null;
  const lng = typeof loc.lng === "number" ? loc.lng : null;

  let country = null;
  let state = null;
  let city = null;
  for (const c of r.address_components || []) {
    const types = c.types || [];
    if (types.includes("country")) country = c.long_name;
    if (types.includes("administrative_area_level_1")) state = c.long_name;
    if (types.includes("locality") || types.includes("postal_town")) city = c.long_name;
  }

  return {
    placeId: r.place_id || id,
    name: String(r.name || "").trim(),
    formattedAddress: String(r.formatted_address || r.name || "").trim(),
    lat,
    lng,
    bounds:
      vp.southwest && vp.northeast
        ? {
            southwest: { lat: vp.southwest.lat, lng: vp.southwest.lng },
            northeast: { lat: vp.northeast.lat, lng: vp.northeast.lng },
          }
        : null,
    country,
    state,
    city,
  };
}

/**
 * Fallback geocode when user typed a name without picking a Places suggestion.
 * Prefers Google Geocoding, then LocationIQ.
 */
async function geocodeAddress(address) {
  const q = String(address || "").trim();
  if (!q) return null;

  const googleKey = getGoogleMapsKey();
  if (googleKey) {
    try {
      const { data } = await axios.get(
        "https://maps.googleapis.com/maps/api/geocode/json",
        { params: { address: q, key: googleKey }, timeout: 12000 }
      );
      const first = data.results?.[0];
      if (first?.geometry?.location) {
        const loc = first.geometry.location;
        const vp = first.geometry.viewport || {};
        return {
          placeId: first.place_id || null,
          name: q,
          formattedAddress: first.formatted_address || q,
          lat: loc.lat,
          lng: loc.lng,
          bounds:
            vp.southwest && vp.northeast
              ? {
                  southwest: { lat: vp.southwest.lat, lng: vp.southwest.lng },
                  northeast: { lat: vp.northeast.lat, lng: vp.northeast.lng },
                }
              : null,
        };
      }
    } catch (err) {
      console.warn("[geocodeAddress] Google failed:", err?.message || err);
    }
  }

  const iq = getLocationIqKey();
  if (iq) {
    try {
      const { data } = await axios.get("https://us1.locationiq.com/v1/search", {
        params: { key: iq, q, format: "json", limit: 1 },
        timeout: 12000,
      });
      const first = Array.isArray(data) ? data[0] : null;
      if (first?.lat != null && first?.lon != null) {
        return {
          placeId: null,
          name: q,
          formattedAddress: first.display_name || q,
          lat: Number(first.lat),
          lng: Number(first.lon),
          bounds: null,
        };
      }
    } catch (err) {
      console.warn("[geocodeAddress] LocationIQ failed:", err?.message || err);
    }
  }

  return null;
}

function parseNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Normalize geo fields from a wizard / API payload.
 */
function extractGeoFromPayload(loc = {}) {
  const lat = parseNumberOrNull(loc.lat ?? loc.latitude);
  const lng = parseNumberOrNull(loc.lng ?? loc.longitude);
  return {
    lat,
    lng,
    googlePlaceId: loc.googlePlaceId || loc.placeId || null,
    formattedAddress: String(loc.formattedAddress || loc.address || "").trim() || null,
    bounds: loc.bounds || null,
    country: loc.country || null,
    state: loc.state || null,
    city: loc.city || null,
  };
}

function applyGeoToBusinessLocation(doc, geo = {}) {
  if (!doc || !geo) return doc;
  if (geo.lat != null) doc.lat = geo.lat;
  if (geo.lng != null) doc.lng = geo.lng;
  if (geo.googlePlaceId) doc.googlePlaceId = String(geo.googlePlaceId);
  if (geo.formattedAddress) doc.formattedAddress = String(geo.formattedAddress);
  if (geo.bounds) doc.bounds = geo.bounds;
  if (geo.country) doc.country = String(geo.country);
  if (geo.state) doc.state = String(geo.state);
  if (geo.city) doc.city = String(geo.city);
  return doc;
}

/**
 * Ensure lat/lng exist — use payload first, else geocode the label.
 */
async function resolveGeoForLocation(label, payloadGeo = {}) {
  let geo = { ...extractGeoFromPayload(payloadGeo) };
  if (geo.lat != null && geo.lng != null) {
    if (!geo.formattedAddress) geo.formattedAddress = String(label || "").trim() || null;
    return geo;
  }
  const query = [geo.formattedAddress, label].filter(Boolean).join(", ") || label;
  const found = await geocodeAddress(query);
  if (!found) return geo;
  return {
    ...geo,
    lat: found.lat,
    lng: found.lng,
    googlePlaceId: geo.googlePlaceId || found.placeId,
    formattedAddress: geo.formattedAddress || found.formattedAddress,
    bounds: geo.bounds || found.bounds,
  };
}

module.exports = {
  getGoogleMapsKey,
  placesAutocomplete,
  placesDetails,
  geocodeAddress,
  extractGeoFromPayload,
  applyGeoToBusinessLocation,
  resolveGeoForLocation,
};
