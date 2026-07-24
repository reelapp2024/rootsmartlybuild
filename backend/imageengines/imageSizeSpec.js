/**
 * Per-section image size presets.
 *
 * Section modules declare `imageRole` (or legacy `imageSize`).
 * Server resolves exact pixels + orientation and stamps them on SectionContent.data
 * + each images[] entry. Engines crop/generate to these targets.
 */

const ROLES = {
  /** Full-bleed homepage / service / blog / legal heroes */
  hero: {
    role: "hero",
    orientation: 1,
    width: 2560,
    height: 1440,
    aspect: "16:9",
    engineWidth: 1344,
    engineHeight: 768,
    maxLongEdge: 2560,
    freepikSizes: ["original", "2000px", "large", "medium"],
    framingHint:
      "ultra-wide cinematic hero photograph, full-bleed landscape, strong subject, deep depth of field",
  },
  /** Secondary wide bands (CTA strips, promise lines) */
  banner: {
    role: "banner",
    orientation: 1,
    width: 1920,
    height: 1080,
    aspect: "16:9",
    engineWidth: 1280,
    engineHeight: 720,
    maxLongEdge: 1920,
    freepikSizes: ["original", "2000px", "large", "medium"],
    framingHint: "wide banner photograph, landscape, clean composition for overlay text space",
  },
  /** About / feature split layouts — large but not hero */
  feature: {
    role: "feature",
    orientation: 1,
    width: 1600,
    height: 900,
    aspect: "16:9",
    engineWidth: 1280,
    engineHeight: 720,
    maxLongEdge: 1600,
    freepikSizes: ["2000px", "large", "original", "medium"],
    framingHint: "large feature photograph for about/feature section, landscape, editorial quality",
  },
  /** Service cards, grids, process steps, related services */
  card: {
    role: "card",
    orientation: 1,
    width: 1200,
    height: 800,
    aspect: "3:2",
    engineWidth: 1152,
    engineHeight: 768,
    maxLongEdge: 1200,
    freepikSizes: ["large", "2000px", "medium", "original"],
    framingHint: "medium card photograph, clear single subject, not ultra-wide, good for grid tiles",
  },
  /** Blog related, legal side imagery, compact supporting shots */
  thumbnail: {
    role: "thumbnail",
    orientation: 1,
    width: 800,
    height: 600,
    aspect: "4:3",
    engineWidth: 896,
    engineHeight: 672,
    maxLongEdge: 800,
    freepikSizes: ["medium", "large", "2000px"],
    framingHint: "compact thumbnail photograph, simple clear subject, tight framing",
  },
  /** Author / people headshots */
  avatar: {
    role: "avatar",
    orientation: 1,
    width: 800,
    height: 800,
    aspect: "1:1",
    engineWidth: 768,
    engineHeight: 768,
    maxLongEdge: 800,
    freepikSizes: ["large", "medium", "2000px"],
    framingHint: "tight professional headshot, centered face and shoulders, square crop friendly",
  },
  /** Explicit vertical shots when a section needs portrait */
  portrait: {
    role: "portrait",
    orientation: 2,
    width: 1080,
    height: 1440,
    aspect: "3:4",
    engineWidth: 768,
    engineHeight: 1024,
    maxLongEdge: 1440,
    freepikSizes: ["large", "2000px", "original", "medium"],
    framingHint: "vertical portrait photograph, taller than wide",
  },
};

const ROLE_ALIASES = {
  hero: "hero",
  large: "hero",
  fullbleed: "hero",
  banner: "banner",
  feature: "feature",
  about: "feature",
  card: "card",
  grid: "card",
  medium: "card",
  thumbnail: "thumbnail",
  thumb: "thumbnail",
  small: "thumbnail",
  avatar: "avatar",
  headshot: "avatar",
  portrait: "portrait",
  vertical: "portrait",
};

/** Infer role from section id when module omits imageRole */
const SECTION_ID_ROLE_HINTS = [
  { re: /(^|_)hero$/i, role: "hero" },
  { re: /hero/i, role: "hero" },
  { re: /author/i, role: "avatar" },
  { re: /related|comments|legalcontent/i, role: "thumbnail" },
  { re: /legal(terms|privacy|disclaimer)/i, role: "thumbnail" },
  { re: /grid|services|groups|process|whychoose|guarantee|related/i, role: "card" },
  { re: /cta|promise|banner/i, role: "banner" },
  { re: /about|copy|feature/i, role: "feature" },
];

function normalizeRoleKey(raw) {
  const key = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  return ROLE_ALIASES[key] || (ROLES[key] ? key : null);
}

function inferRoleFromSectionId(sectionId) {
  const id = String(sectionId || "").trim();
  if (!id) return null;
  for (const { re, role } of SECTION_ID_ROLE_HINTS) {
    if (re.test(id)) return role;
  }
  return null;
}

function clampDim(n, min, max, fallback) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return fallback;
  return Math.max(min, Math.min(max, Math.round(v)));
}

/**
 * Resolve final image size spec for a section.
 * Priority: explicit data overrides → module imageRole/imageSize → sectionId hint → feature default
 */
function resolveImageSpec(sectionModule = {}, data = {}, sectionId = "") {
  const moduleRole =
    normalizeRoleKey(sectionModule?.imageRole) ||
    normalizeRoleKey(sectionModule?.imageSize) ||
    normalizeRoleKey(data?.image_role) ||
    normalizeRoleKey(data?.image_size) ||
    inferRoleFromSectionId(sectionId || sectionModule?.id) ||
    "feature";

  const base = { ...(ROLES[moduleRole] || ROLES.feature) };

  // Explicit pixel overrides (module or already-stamped data)
  const width = clampDim(
    data?.image_width ?? sectionModule?.imageWidth ?? sectionModule?.image_width,
    256,
    4096,
    base.width
  );
  const height = clampDim(
    data?.image_height ?? sectionModule?.imageHeight ?? sectionModule?.image_height,
    256,
    4096,
    base.height
  );

  let orientation = base.orientation;
  const rawOri =
    data?.image_orientation ??
    sectionModule?.imageOrientation ??
    sectionModule?.image_orientation;
  if (rawOri !== undefined && rawOri !== null && rawOri !== "") {
    const n = Number(rawOri);
    if (n === 1 || n === 2) orientation = n;
    else if (String(rawOri).toLowerCase() === "portrait") orientation = 2;
    else if (String(rawOri).toLowerCase() === "landscape") orientation = 1;
  } else if (height > width * 1.05) {
    orientation = 2;
  } else {
    orientation = 1;
  }

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const g = gcd(width, height) || 1;
  const aspect =
    base.aspect ||
    `${Math.round(width / g)}:${Math.round(height / g)}`;

  // Engine request size: keep aspect, fit under ~1536 long edge for CF/Leonardo stability
  const engineMax = 1536;
  const scale = Math.min(1, engineMax / Math.max(width, height));
  let engineWidth = Math.round((width * scale) / 8) * 8;
  let engineHeight = Math.round((height * scale) / 8) * 8;
  engineWidth = Math.max(512, Math.min(2500, engineWidth));
  engineHeight = Math.max(512, Math.min(2500, engineHeight));

  if (sectionModule?.engineWidth && sectionModule?.engineHeight) {
    engineWidth = clampDim(sectionModule.engineWidth, 512, 2500, engineWidth);
    engineHeight = clampDim(sectionModule.engineHeight, 512, 2500, engineHeight);
  } else if (base.engineWidth && base.engineHeight) {
    // Prefer preset engine dims when final size matches preset
    if (width === base.width && height === base.height) {
      engineWidth = base.engineWidth;
      engineHeight = base.engineHeight;
    }
  }

  const maxLongEdge = Math.max(
    width,
    height,
    Number(sectionModule?.maxLongEdge) || base.maxLongEdge || 1600
  );

  return {
    role: base.role,
    orientation,
    width,
    height,
    aspect,
    engineWidth,
    engineHeight,
    maxLongEdge,
    freepikSizes: Array.isArray(base.freepikSizes)
      ? base.freepikSizes
      : ["large", "2000px", "medium", "original"],
    framingHint: base.framingHint || "",
  };
}

/** Flat fields stamped onto SectionContent.data for DB + GenieBuild */
function stampImageSpecOnData(data, spec) {
  if (!data || typeof data !== "object" || Array.isArray(data) || !spec) {
    return data;
  }
  return {
    ...data,
    image_role: spec.role,
    image_orientation: spec.orientation,
    image_width: spec.width,
    image_height: spec.height,
    image_aspect: spec.aspect,
    image_size: {
      role: spec.role,
      width: spec.width,
      height: spec.height,
      orientation: spec.orientation,
      aspect: spec.aspect,
    },
  };
}

function aspectInstruction(spec) {
  if (!spec) return "Generate a LANDSCAPE wide image with 16:9 aspect ratio.";
  if (spec.aspect === "1:1" || (spec.width === spec.height)) {
    return `Generate a SQUARE image with 1:1 aspect ratio (~${spec.width}x${spec.height}).`;
  }
  if (spec.orientation === 2) {
    return `Generate a PORTRAIT vertical image with ${spec.aspect} aspect ratio (~${spec.width}x${spec.height}). Height MUST be greater than width.`;
  }
  return `Generate a LANDSCAPE image with ${spec.aspect} aspect ratio (~${spec.width}x${spec.height}). Width MUST be greater than height.`;
}

function enrichAiPromptWithSize(prompt, spec) {
  const base = String(prompt || "").trim();
  if (!base || !spec) return base;
  const framing = spec.framingHint ? ` Framing: ${spec.framingHint}.` : "";
  return `${base}\n\n[Image size role=${spec.role} target=${spec.width}x${spec.height} aspect=${spec.aspect}.${framing}]`;
}

module.exports = {
  ROLES,
  IMAGE_SIZE_PRESETS: ROLES,
  resolveImageSpec,
  stampImageSpecOnData,
  aspectInstruction,
  enrichAiPromptWithSize,
  normalizeRoleKey,
  inferRoleFromSectionId,
};
