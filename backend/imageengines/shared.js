/**
 * Shared image upload helpers used by all engines.
 */
const sharp = require("sharp");
const helper = require("../additional/addon.js");

const UPLOAD_FOLDER = "public/files/generated-images";

/** Default targets when no per-section sizeSpec is provided */
const GENERATED_IMAGE_TARGETS = {
  landscape: { width: 2560, height: 1440 },
  portrait: { width: 1440, height: 2560 },
};

const WEBP_PREMIUM = {
  quality: 97,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: false,
};

const ORIENTATION_LABEL = { 1: "landscape", 2: "portrait" };

const MAX_RETRIES = 2;

/** Fallback generation size before WebP cover (multiples of 8). */
const ENGINE_DIMS = {
  1: { width: 1344, height: 768 },
  2: { width: 768, height: 1344 },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOrientation(val) {
  const n = Number(val);
  if (n === 1 || n === 2) return n;
  if (val === "landscape") return 1;
  if (val === "portrait") return 2;
  return 1;
}

function dimsForOrientation(orientation, sizeSpec = null) {
  if (
    sizeSpec &&
    Number(sizeSpec.engineWidth) > 0 &&
    Number(sizeSpec.engineHeight) > 0
  ) {
    return {
      width: Math.round(Number(sizeSpec.engineWidth)),
      height: Math.round(Number(sizeSpec.engineHeight)),
    };
  }
  return ENGINE_DIMS[parseOrientation(orientation)] || ENGINE_DIMS[1];
}

/** Final WebP cover size from sizeSpec or orientation defaults */
function targetDimsForSave(orientation, sizeSpec = null) {
  if (sizeSpec && Number(sizeSpec.width) > 0 && Number(sizeSpec.height) > 0) {
    return {
      width: Math.round(Number(sizeSpec.width)),
      height: Math.round(Number(sizeSpec.height)),
    };
  }
  const o = parseOrientation(orientation);
  return o === 2
    ? GENERATED_IMAGE_TARGETS.portrait
    : GENERATED_IMAGE_TARGETS.landscape;
}

function maxLongEdgeForSpec(sizeSpec, fallback) {
  if (sizeSpec && Number(sizeSpec.maxLongEdge) > 0) {
    return Math.round(Number(sizeSpec.maxLongEdge));
  }
  const dims = targetDimsForSave(sizeSpec?.orientation || 1, sizeSpec);
  return Math.max(fallback || 1600, dims.width, dims.height);
}

async function downloadImageBuffer(url) {
  const axios = require("axios");
  const res = await axios.get(url, {
    responseType: "arraybuffer",
    timeout: 120000,
    maxRedirects: 8,
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return Buffer.from(res.data);
}

function getBaseUrl() {
  const useLive = process.env.USE_LIVE_IMAGE_URL === "true";
  return useLive
    ? process.env.BASE_URL || "https://apis.smartlybuild.dev"
    : "http://localhost:1111";
}

function publicUrlForUploadFolder(uploadFolder, savedFile) {
  const base = getBaseUrl();
  if (!uploadFolder) {
    return `${base}/files/generated-images/${savedFile}`;
  }
  const rel = String(uploadFolder)
    .replace(/^public\/?/i, "")
    .replace(/\\/g, "/")
    .replace(/\/+$/, "");
  return `${base}/${rel}/${savedFile}`;
}

/** Fixed aspect WebP (admin / strict layouts). */
async function saveBufferAsWebp(
  buffer,
  prefix,
  orientation,
  uploadFolder = null,
  sizeSpec = null
) {
  const dims = targetDimsForSave(orientation, sizeSpec);

  const webpBuffer = await sharp(buffer, { failOnError: false })
    .rotate()
    .resize(dims.width, dims.height, {
      fit: "cover",
      position: "center",
      kernel: sharp.kernel.lanczos3,
    })
    .webp(WEBP_PREMIUM)
    .toBuffer();

  const file = {
    name: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`,
    mimetype: "image/webp",
    buffer: webpBuffer,
  };

  const folderPath = uploadFolder || UPLOAD_FOLDER;
  const savedFile = await helper.uploadFile(file, folderPath, null);
  return publicUrlForUploadFolder(uploadFolder, savedFile);
}

/**
 * EXIF rotate, optional downscale, then cover-crop to section target + WebP.
 * @param {object|null} sizeSpec - from resolveImageSpec (width/height/maxLongEdge)
 */
async function saveBufferWebOptimizedWebp(
  buffer,
  prefix,
  uploadFolder,
  orientation,
  maxLongEdge,
  sizeSpec = null
) {
  const dims = targetDimsForSave(orientation, sizeSpec);
  const edge = Math.max(
    Number(maxLongEdge) || 0,
    maxLongEdgeForSpec(sizeSpec, Math.max(dims.width, dims.height))
  );

  const meta = await sharp(buffer, { failOnError: false }).rotate().metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  let chain = sharp(buffer, { failOnError: false }).rotate();
  if (edge > 0 && (w > edge || h > edge)) {
    chain = chain.resize({
      width: edge,
      height: edge,
      fit: "inside",
      withoutEnlargement: true,
      kernel: sharp.kernel.lanczos3,
    });
  }

  const webpBuffer = await chain
    .resize(dims.width, dims.height, {
      fit: "cover",
      position: "center",
      kernel: sharp.kernel.lanczos3,
    })
    .webp(WEBP_PREMIUM)
    .toBuffer();

  const file = {
    name: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.webp`,
    mimetype: "image/webp",
    buffer: webpBuffer,
  };
  const folderPath = uploadFolder || UPLOAD_FOLDER;
  const savedFile = await helper.uploadFile(file, folderPath, null);
  return publicUrlForUploadFolder(uploadFolder, savedFile);
}

function resultMeta(url, source, orientation, sizeSpec = null) {
  const dims = targetDimsForSave(orientation, sizeSpec);
  return {
    url,
    source,
    orientation: parseOrientation(orientation),
    width: dims.width,
    height: dims.height,
    role: sizeSpec?.role || null,
    resolution: `${dims.width}x${dims.height}`,
  };
}

module.exports = {
  UPLOAD_FOLDER,
  GENERATED_IMAGE_TARGETS,
  ORIENTATION_LABEL,
  MAX_RETRIES,
  ENGINE_DIMS,
  sleep,
  parseOrientation,
  dimsForOrientation,
  targetDimsForSave,
  maxLongEdgeForSpec,
  downloadImageBuffer,
  saveBufferAsWebp,
  saveBufferWebOptimizedWebp,
  resultMeta,
};
