/**
 * Shared image upload helpers used by all engines.
 */
const sharp = require("sharp");
const helper = require("../additional/addon.js");

const UPLOAD_FOLDER = "public/files/generated-images";

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

/** Generation size before WebP cover (multiples of 8 for Leonardo). */
const ENGINE_DIMS = {
  1: { width: 1344, height: 768 }, // landscape 16:9
  2: { width: 768, height: 1344 }, // portrait 9:16
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dimsForOrientation(orientation) {
  return ENGINE_DIMS[parseOrientation(orientation)] || ENGINE_DIMS[1];
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

function parseOrientation(val) {
  const n = Number(val);
  if (n === 1 || n === 2) return n;
  if (val === "landscape") return 1;
  if (val === "portrait") return 2;
  return 1;
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
async function saveBufferAsWebp(buffer, prefix, orientation, uploadFolder = null) {
  const dims =
    orientation === 1
      ? GENERATED_IMAGE_TARGETS.landscape
      : GENERATED_IMAGE_TARGETS.portrait;

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

/** EXIF rotate, optional downscale, then 16:9 / 9:16 cover + WebP. */
async function saveBufferWebOptimizedWebp(
  buffer,
  prefix,
  uploadFolder,
  orientation,
  maxLongEdge
) {
  const o = parseOrientation(orientation);
  const dims =
    o === 1
      ? GENERATED_IMAGE_TARGETS.landscape
      : GENERATED_IMAGE_TARGETS.portrait;

  const meta = await sharp(buffer, { failOnError: false }).rotate().metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  let chain = sharp(buffer, { failOnError: false }).rotate();
  if (w > maxLongEdge || h > maxLongEdge) {
    chain = chain.resize({
      width: maxLongEdge,
      height: maxLongEdge,
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

module.exports = {
  UPLOAD_FOLDER,
  GENERATED_IMAGE_TARGETS,
  ORIENTATION_LABEL,
  MAX_RETRIES,
  parseOrientation,
  saveBufferAsWebp,
  saveBufferWebOptimizedWebp,
};
