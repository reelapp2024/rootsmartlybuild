/** Shared font presets — GenieBuild, admin wizard, and dashboard Design. */
export type PresetFont = { name: string; value: string };

export const PRESET_FONTS: PresetFont[] = [
  { name: "Poppins", value: '"Poppins", sans-serif' },
  { name: "Inter", value: '"Inter", sans-serif' },
  { name: "Plus Jakarta Sans", value: '"Plus Jakarta Sans", sans-serif' },
  { name: "DM Sans", value: '"DM Sans", sans-serif' },
  { name: "Syne", value: '"Syne", sans-serif' },
  { name: "Outfit", value: '"Outfit", sans-serif' },
  { name: "Space Grotesk", value: '"Space Grotesk", sans-serif' },
  { name: "Montserrat", value: '"Montserrat", sans-serif' },
  { name: "Nunito", value: '"Nunito", sans-serif' },
  { name: "Raleway", value: '"Raleway", sans-serif' },
  { name: "Work Sans", value: '"Work Sans", sans-serif' },
  { name: "Roboto", value: '"Roboto", sans-serif' },
  { name: "Open Sans", value: '"Open Sans", sans-serif' },
  { name: "Lato", value: '"Lato", sans-serif' },
  { name: "Ubuntu", value: '"Ubuntu", sans-serif' },
  { name: "Source Sans Pro", value: '"Source Sans Pro", sans-serif' },
  { name: "Playfair Display", value: '"Playfair Display", serif' },
  { name: "Merriweather", value: '"Merriweather", serif' },
  { name: "Lora", value: '"Lora", serif' },
  { name: "Crimson Text", value: '"Crimson Text", serif' },
  { name: "Caveat", value: '"Caveat", cursive' },
  { name: "Dancing Script", value: '"Dancing Script", cursive' },
  { name: "Pacifico", value: '"Pacifico", cursive' },
  { name: "Great Vibes", value: '"Great Vibes", cursive' },
  { name: "Satisfy", value: '"Satisfy", cursive' },
];

export const DEFAULT_FONT_FAMILY = '"Inter", sans-serif';

const compactFont = (s: string) => s.replace(/"/g, "").replace(/\s+/g, " ").toLowerCase();

/** Map API / legacy font strings to a known preset value when possible. */
export function normalizePresetFontFamily(
  raw: string,
  fallback: string = DEFAULT_FONT_FAMILY
): string {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return fallback;
  const hit = PRESET_FONTS.find(
    (f) => f.value === trimmed || compactFont(f.value) === compactFont(trimmed)
  );
  return hit?.value || trimmed;
}

export function buildGoogleFontsCssUrl(fonts: PresetFont[] = PRESET_FONTS): string {
  const families = fonts.map((f) => `${f.name.replace(/\s+/g, "+")}:wght@300;400;700;900`);
  return `https://fonts.googleapis.com/css2?family=${families.join("&family=")}&display=swap`;
}
