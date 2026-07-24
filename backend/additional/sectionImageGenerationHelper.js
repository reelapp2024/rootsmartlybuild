/**
 * Section pipeline: attach images onto SectionContent.data.images
 *
 * Gates:
 *   - images_mode=1 (env)
 *   - project.wantImages !== 0
 *   - section has imageCount (module) and/or data.image_count
 *
 * Size:
 *   - section module `imageRole` (hero|banner|feature|card|thumbnail|avatar|portrait)
 *   - stamped on data as image_role / image_width / image_height / image_orientation
 *   - all engines crop/generate to that target
 *
 * Prompt rules:
 *   - Freepik (1)           → non_ai_image_prompt (stock keywords)
 *   - Gemini/Leonardo/Flux  → ai_image_prompt (+ size framing hint)
 *
 * Always writes data.images as an array of objects (even length 1).
 * Keeps `url` for GenieBuild; also sets `src` alias + metadata.
 */

const generateImages = require("./imageProviderHelper");
const {
  ORIGIN,
  LABELS,
  isValidSectionOrigin,
  usesAiPrompt,
  normalizeOrigin,
  resolveImageSpec,
  stampImageSpecOnData,
  enrichAiPromptWithSize,
} = require("../imageengines");
const UserProject = require("../models/userProjects");

function getImagesMode() {
  const raw = String(
    process.env.images_mode ?? process.env.IMAGES_MODE ?? "1"
  ).trim();
  return parseInt(raw, 10) === 1 ? 1 : 0;
}

function sanitizeFolderPart(name) {
  const s = String(name || "project")
    .replace(/[/\\?%*:|"<>]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 50);
  return s || "project";
}

function buildProjectImageUploadFolder(projectName, projectId) {
  const id = String(projectId);
  const slug = sanitizeFolderPart(projectName);
  return `public/images/${slug}_${id}`;
}

function resolveWantedCount(data, sectionModule) {
  const fromData = Number(data?.image_count);
  const fromModule = Number(sectionModule?.imageCount);
  const raw = Number.isFinite(fromData) && fromData > 0
    ? fromData
    : Number.isFinite(fromModule) && fromModule > 0
      ? fromModule
      : 0;
  if (!raw) return 0;
  return Math.min(10, Math.max(1, Math.floor(raw)));
}

function buildAltTag(data, sectionId, index) {
  const base = String(
    data?.title ||
      data?.serviceHeroTitle ||
      data?.heading ||
      sectionId ||
      "Section"
  )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return index > 0 ? `${base} — image ${index + 1}` : base;
}

function toPublicPath(url) {
  try {
    return new URL(url).pathname || "";
  } catch {
    return "";
  }
}

/**
 * Canonical image object stored on SectionContent.data.images[]
 * Frontend reads `url` (and now `src` as fallback).
 */
function buildImageEntry({ img, index, data, sectionId, origin, promptType, sizeSpec }) {
  const url = String(img?.url || "").trim();
  const orientation =
    Number(img?.orientation) === 2
      ? 2
      : Number(sizeSpec?.orientation) === 2
        ? 2
        : 1;
  const width = Number(img?.width) || Number(sizeSpec?.width) || 0;
  const height = Number(img?.height) || Number(sizeSpec?.height) || 0;
  const role = String(img?.role || sizeSpec?.role || data?.image_role || "").trim() || null;
  const engineKey = String(img?.source || LABELS[origin] || "unknown").toLowerCase();
  const alt = buildAltTag(data, sectionId, index);

  return {
    index,
    url,
    src: url,
    alt,
    altTag: alt,
    publicPath: toPublicPath(url),
    width,
    height,
    resolution: width && height ? `${width}x${height}` : "",
    orientation,
    role,
    source: engineKey,
    metadata: {
      engine: engineKey,
      engineLabel: LABELS[origin] || engineKey,
      origin: Number(origin),
      promptType, // "stock" | "ai"
      role,
      aspect: sizeSpec?.aspect || data?.image_aspect || null,
      generatedAt: new Date().toISOString(),
    },
  };
}

/**
 * @returns {Promise<object>} data with images[] when generation runs / is attempted
 */
async function attachGeneratedImagesToSectionData({
  project,
  projectId,
  sectionId,
  sectionModule,
  data,
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;

  if (getImagesMode() !== 1) {
    console.log(
      `[section-images] ${sectionId || "?"}: images_mode!=1 — skip (set images_mode=1 in .env)`
    );
    return data;
  }

  const wanted = resolveWantedCount(data, sectionModule);
  if (!wanted) {
    // Section is text-only (no imageCount) — do not invent images
    return data;
  }

  const sizeSpec = resolveImageSpec(sectionModule || {}, data, sectionId);
  let nextBase = stampImageSpecOnData(
    { ...data, image_count: wanted },
    sizeSpec
  );

  const pid = projectId || project?._id || project?.id;
  if (!pid) {
    console.warn(`[section-images] ${sectionId}: missing projectId — skip`);
    return {
      ...nextBase,
      images: Array.isArray(data.images) ? data.images : [],
    };
  }

  const lean = await UserProject.findById(pid)
    .select("wantImages sectionImageOrigin projectName userId")
    .lean();

  if (!lean) {
    console.warn(`[section-images] ${sectionId}: project ${pid} not found — skip`);
    return { ...nextBase, images: [] };
  }

  if (Number(lean.wantImages) === 0) {
    console.log(`[section-images] ${sectionId}: wantImages=0 — skip`);
    return { ...nextBase, images: [] };
  }

  const origin = isValidSectionOrigin(lean.sectionImageOrigin)
    ? normalizeOrigin(lean.sectionImageOrigin)
    : ORIGIN.FREEPIK;

  const promptType = usesAiPrompt(origin) ? "ai" : "stock";
  const rawPrompt =
    promptType === "ai"
      ? String(data.ai_image_prompt || "").trim()
      : String(data.non_ai_image_prompt || "").trim() ||
        String(data.ai_image_prompt || "").trim();

  if (!rawPrompt) {
    console.warn(
      `[section-images] ${sectionId}: missing ${
        promptType === "ai" ? "ai_image_prompt" : "non_ai_image_prompt"
      } (origin=${origin}) — images=[]`
    );
    return { ...nextBase, images: [] };
  }

  const prompt =
    promptType === "ai" ? enrichAiPromptWithSize(rawPrompt, sizeSpec) : rawPrompt;

  const uploadFolder = buildProjectImageUploadFolder(lean.projectName, pid);
  const orientation = generateImages.parseOrientation(sizeSpec.orientation);

  console.log(
    `[section-images] ${sectionId}: generating count=${wanted} role=${sizeSpec.role} ` +
      `${sizeSpec.width}x${sizeSpec.height} (${sizeSpec.aspect}) ` +
      `origin=${origin}(${LABELS[origin] || "?"}) promptType=${promptType}`
  );

  try {
    const pack = await generateImages(prompt, wanted, orientation, origin, {
      uploadFolder,
      userId: lean.userId ? String(lean.userId) : null,
      projectId: String(pid),
      pageId: String(sectionId || pid),
      promptFrom: "sectionGenerationQueue",
      promptFor: `${String(sectionId || "section").trim()}_image_generation`,
      sizeSpec,
    });

    const images = (pack.images || [])
      .filter((img) => img && img.url)
      .map((img, index) =>
        buildImageEntry({
          img,
          index,
          data: nextBase,
          sectionId,
          origin,
          promptType,
          sizeSpec,
        })
      );

    if (images.length < wanted) {
      console.warn(
        `[section-images] ${sectionId}: got ${images.length}/${wanted} from ${LABELS[origin] || origin}`
      );
    } else {
      console.log(
        `[section-images] ${sectionId}: saved ${images.length} image(s) ` +
          `${sizeSpec.width}x${sizeSpec.height} via ${LABELS[origin] || origin}`
      );
    }

    return { ...nextBase, images };
  } catch (e) {
    console.error(`[section-images] ${sectionId} FAILED:`, e?.message || e);
    return { ...nextBase, images: [] };
  }
}

module.exports = {
  getImagesMode,
  sanitizeFolderPart,
  buildProjectImageUploadFolder,
  attachGeneratedImagesToSectionData,
  buildImageEntry,
  resolveWantedCount,
};
