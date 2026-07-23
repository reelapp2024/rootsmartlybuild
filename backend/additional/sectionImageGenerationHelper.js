/**
 * Section pipeline: generate images from prompts and attach to SectionContent.data.images
 * - images_mode env: "1" = run generation, anything else = skip
 * - project.sectionImageOrigin: 1 Freepik · 2 Gemini · 4 Leonardo · 5 Flux
 * - Files land under public/images/{sanitizedProjectName}_{projectId}/
 */

const generateImages = require("./imageProviderHelper");
const {
  isValidSectionOrigin,
  usesAiPrompt,
  normalizeOrigin,
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

/**
 * @param {object} params
 * @param {object} [params.project] - optional cached project (merged with DB flags)
 * @param {string} params.projectId
 * @param {string} params.sectionId
 * @param {object} params.sectionModule - resolved section module
 * @param {object} params.data - section JSON (copy with images[])
 * @returns {Promise<object>}
 */
async function attachGeneratedImagesToSectionData({
  project,
  projectId,
  sectionId,
  sectionModule,
  data,
}) {
  if (!data || typeof data !== "object" || Array.isArray(data)) return data;
  if (getImagesMode() !== 1) return data;
  if (typeof sectionModule?.imageCount !== "number") return data;

  const pid = projectId || project?._id || project?.id;
  if (!pid) return data;

  const lean = await UserProject.findById(pid)
    .select("wantImages sectionImageOrigin projectName userId")
    .lean();
  if (!lean) return data;
  if (Number(lean.wantImages) === 0) return data;

  const origin = isValidSectionOrigin(lean.sectionImageOrigin)
    ? normalizeOrigin(lean.sectionImageOrigin)
    : 1;

  const prompt = usesAiPrompt(origin)
    ? String(data.ai_image_prompt || "").trim()
    : String(data.non_ai_image_prompt || data.ai_image_prompt || "").trim();

  if (!prompt) {
    return { ...data, images: [] };
  }

  const count = Math.min(
    10,
    Math.max(1, Number(data.image_count) || sectionModule.imageCount)
  );

  const uploadFolder = buildProjectImageUploadFolder(lean.projectName, pid);

  const orientation = generateImages.parseOrientation(
    data.image_orientation != null && data.image_orientation !== ""
      ? data.image_orientation
      : 1
  );

  try {
    const pack = await generateImages(
      prompt,
      count,
      orientation,
      origin,
      {
        uploadFolder,
        userId: lean.userId ? String(lean.userId) : null,
        projectId: String(pid),
        pageId: String(sectionId || pid),
        promptFrom: "sectionGenerationQueue",
        promptFor: `${String(sectionId || "section").trim()}_image_generation`,
      }
    );
    const images = (pack.images || []).map((img, index) => {
      let publicPath = "";
      try {
        const u = new URL(img.url);
        publicPath = u.pathname || "";
      } catch {
        publicPath = "";
      }
      return {
        index,
        url: img.url,
        publicPath,
        source: img.source,
        orientation: img.orientation,
      };
    });
    return { ...data, images };
  } catch (e) {
    console.error(
      `[attachGeneratedImagesToSectionData] ${sectionId}:`,
      e?.message || e
    );
    return { ...data, images: [] };
  }
}

module.exports = {
  getImagesMode,
  sanitizeFolderPart,
  buildProjectImageUploadFolder,
  attachGeneratedImagesToSectionData,
};
