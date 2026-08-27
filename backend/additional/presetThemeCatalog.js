/** Shared with apps/schema/presetThemeCatalog.json — keep in sync. */
const PRESET_THEME_CATALOG = require("../../apps/schema/presetThemeCatalog.json");

function normalizeThemeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isNumericPresetIndex(value) {
  if (value === null || value === undefined) return false;
  const raw = String(value).trim();
  if (!raw || Number.isNaN(Number(raw))) return false;
  const idx = Number(raw);
  return (
    Number.isInteger(idx) &&
    idx >= 0 &&
    idx < PRESET_THEME_CATALOG.length &&
    String(idx) === raw
  );
}

function findPresetIndexFromThemeSlug(slug) {
  const normalized = normalizeThemeSlug(slug);
  if (!normalized || normalized === "custom") return -1;

  for (const entry of PRESET_THEME_CATALOG) {
    if (entry.id === normalized) return entry.index;
    if (normalizeThemeSlug(entry.name) === normalized) return entry.index;
    if ((entry.aliases || []).some((alias) => normalizeThemeSlug(alias) === normalized)) {
      return entry.index;
    }
  }

  const compact = normalized.replace(/-/g, "");
  for (const entry of PRESET_THEME_CATALOG) {
    if (entry.id.replace(/-/g, "") === compact) return entry.index;
    if (normalizeThemeSlug(entry.name).replace(/-/g, "") === compact) return entry.index;
  }

  return -1;
}

function resolveNumericPresetIdFromPayload({ theme, presetId }) {
  if (isNumericPresetIndex(presetId)) {
    return String(presetId);
  }
  const idx = findPresetIndexFromThemeSlug(theme);
  return idx >= 0 ? String(idx) : null;
}

module.exports = {
  PRESET_THEME_CATALOG,
  normalizeThemeSlug,
  findPresetIndexFromThemeSlug,
  resolveNumericPresetIdFromPayload,
};
