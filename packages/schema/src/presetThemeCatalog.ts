import catalogJson from "../presetThemeCatalog.json";

export type PresetThemeCatalogEntry = {
  id: string;
  index: number;
  name: string;
  aliases: string[];
};

export const PRESET_THEME_CATALOG = catalogJson as PresetThemeCatalogEntry[];

export const PRESET_THEME_COUNT = PRESET_THEME_CATALOG.length;

export function normalizeThemeSlug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function isNumericPresetIndex(value: unknown): value is number {
  if (value === null || value === undefined) return false;
  const raw = String(value).trim();
  if (!raw || Number.isNaN(Number(raw))) return false;
  const idx = Number(raw);
  return Number.isInteger(idx) && idx >= 0 && idx < PRESET_THEME_COUNT && String(idx) === raw;
}

/** Match saved theme slug / alias / display name to GenieBuild PRESET_THEMES index. */
export function findPresetIndexFromThemeSlug(slug: string): number {
  const normalized = normalizeThemeSlug(slug);
  if (!normalized || normalized === "custom") return -1;

  for (const entry of PRESET_THEME_CATALOG) {
    if (entry.id === normalized) return entry.index;
    if (normalizeThemeSlug(entry.name) === normalized) return entry.index;
    if (entry.aliases.some((alias) => normalizeThemeSlug(alias) === normalized)) return entry.index;
  }

  const compact = normalized.replace(/-/g, "");
  for (const entry of PRESET_THEME_CATALOG) {
    if (entry.id.replace(/-/g, "") === compact) return entry.index;
    if (normalizeThemeSlug(entry.name).replace(/-/g, "") === compact) return entry.index;
  }

  return -1;
}

export function findPresetIndexFromSettings(input: {
  theme?: string | null;
  presetId?: string | number | null;
} | null | undefined): number {
  if (!input) return -1;

  if (isNumericPresetIndex(input.presetId)) {
    return Number(input.presetId);
  }

  return findPresetIndexFromThemeSlug(String(input.theme || ""));
}

export function getPresetCatalogEntryByIndex(index: number): PresetThemeCatalogEntry | null {
  return PRESET_THEME_CATALOG.find((entry) => entry.index === index) || null;
}

export function getPresetCatalogEntryById(id: string): PresetThemeCatalogEntry | null {
  const normalized = normalizeThemeSlug(id);
  return (
    PRESET_THEME_CATALOG.find(
      (entry) =>
        entry.id === normalized ||
        normalizeThemeSlug(entry.name) === normalized ||
        entry.aliases.some((alias) => normalizeThemeSlug(alias) === normalized)
    ) || null
  );
}

/** Canonical admin id for UI + API (e.g. royal-plum). */
export function resolveAdminThemeIdFromSettings(input: {
  theme?: string | null;
  presetId?: string | number | null;
} | null | undefined): string {
  const idx = findPresetIndexFromSettings(input);
  if (idx >= 0) {
    return getPresetCatalogEntryByIndex(idx)?.id || "crimson-jet";
  }
  const slug = normalizeThemeSlug(String(input?.theme || ""));
  if (slug && slug !== "custom") return slug;
  return "crimson-jet";
}

export function getPresetIndexByAdminId(themeId: string): number {
  return findPresetIndexFromThemeSlug(themeId);
}

export function getThemeSlugForApiFromIndex(index: number): string {
  const entry = getPresetCatalogEntryByIndex(index);
  return entry?.id || "crimson-jet";
}
