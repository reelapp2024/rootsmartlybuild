const axios = require("axios");
const https = require("https");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const sharp = require("sharp");
const helper = require("../additional/addon.js");
const { trackCreditsUsage, ensureSufficientCredits } = require("./openaiHelpers");

const FREEPIK_HOSTS_ALLOW = new Set(["img.freepik.com", "images.freepik.com"]);

const UPLOAD_FOLDER = "public/files/generated-images";
const MAX_RETRIES = 2;

/** Admin / legacy API: fixed 16:9 or 9:16 frame (still higher quality than before). */
const GENERATED_IMAGE_TARGETS = {
  landscape: { width: 2560, height: 1440 },
  portrait: { width: 1440, height: 2560 },
};

/** WebP when a fixed aspect box is required (e.g. admin generateImage). */
const WEBP_PREMIUM = {
  quality: 97,
  alphaQuality: 100,
  effort: 6,
  smartSubsample: false,
};

/** Stock / AI: cap longest side before crop to frame (keeps memory sane on huge Freepik originals). */
const PHOTO_MAX_LONG_EDGE_FREEPIK = Math.min(
  8192,
  Math.max(2048, parseInt(process.env.IMAGE_MAX_LONG_EDGE_FREEPIK || "4096", 10) || 4096)
);
const PHOTO_MAX_LONG_EDGE_GEMINI = Math.min(
  4096,
  Math.max(1536, parseInt(process.env.IMAGE_MAX_LONG_EDGE_GEMINI || "2560", 10) || 2560)
);

// orientation: 1 = landscape, 2 = portrait
const ORIENTATION_LABEL = { 1: "landscape", 2: "portrait" };
const USAGE_TYPE = {
  OPENAI: 0,
  FREEPIK: 1,
  IMAGES: 2,
  OTHER: 3,
};

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
    ? (process.env.BASE_URL || "https://apis.smartlybuild.dev")
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

/**
 * Fixed aspect WebP (legacy admin tool / strict layouts).
 */
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

/**
 * Stock / AI: EXIF rotate, optional fit-inside downscale, then fixed 16:9 or 9:16 cover + high-quality WebP.
 */
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

// =========================
// FREEPIK PROVIDER (stock search — not AI text-to-image)
// =========================

function normalizeFreepikUrl(raw) {
  try {
    const u = new URL(raw);
    if (!FREEPIK_HOSTS_ALLOW.has(u.hostname)) u.hostname = "img.freepik.com";
    u.protocol = "https:";
    u.port = "";
    return u.toString();
  } catch {
    return raw;
  }
}

async function fetchFreepikImageBuffer(url) {
  const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
    Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
    Referer: "https://www.freepik.com/",
  };
  const opts = {
    responseType: "arraybuffer",
    timeout: 120000,
    maxRedirects: 8,
    httpsAgent,
    headers,
    validateStatus: (s) => s >= 200 && s < 400,
  };
  try {
    const res = await axios.get(url, opts);
    return Buffer.from(res.data);
  } catch (e) {
    const nurl = normalizeFreepikUrl(url);
    if (nurl !== url) {
      const res = await axios.get(nurl, opts);
      return Buffer.from(res.data);
    }
    throw e;
  }
}

/**
 * Official download URL (full / high-res). Search `image.source.url` is only a small preview (~100–300KB).
 * @see https://docs.freepik.com/api-reference/resources/download-a-resource
 */
async function freepikGetAuthorizedDownloadUrl(resourceId) {
  const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
  if (!FREEPIK_API_KEY || resourceId == null || resourceId === "") return null;

  const id = String(resourceId).trim();
  const sizes = ["original", "2000px", "large", "medium"];

  for (const image_size of sizes) {
    try {
      const res = await axios.get(
        `https://api.freepik.com/v1/resources/${encodeURIComponent(id)}/download`,
        {
          headers: { "x-freepik-api-key": FREEPIK_API_KEY },
          params: { image_size },
          timeout: 45000,
          validateStatus: (s) => s === 200 || s === 403 || s === 404,
        }
      );
      if (res.status !== 200) continue;
      const d = res.data?.data;
      const link = (d && (d.signed_url || d.url)) || null;
      if (link && typeof link === "string" && link.startsWith("http")) {
        return link.trim();
      }
    } catch (err) {
      console.warn(
        `[Freepik] download meta ${id} ${image_size}:`,
        err?.message || err
      );
    }
  }
  return null;
}

async function freepikFetchAssetBufferFromItem(item) {
  const rid = item?.id;
  if (rid != null && rid !== "") {
    const authorized = await freepikGetAuthorizedDownloadUrl(rid);
    if (authorized) {
      try {
        return await fetchFreepikImageBuffer(authorized);
      } catch (e) {
        console.warn(
          `[Freepik] fetch authorized URL failed for resource ${rid}:`,
          e.message
        );
      }
    }
  }
  const rawUrl = item?.image?.source?.url;
  if (!rawUrl) return null;
  const safeUrl = normalizeFreepikUrl(rawUrl);
  try {
    if (!FREEPIK_HOSTS_ALLOW.has(new URL(safeUrl).hostname)) return null;
  } catch {
    return null;
  }
  return fetchFreepikImageBuffer(safeUrl);
}

function freepikOrientationParams(orientation) {
  if (orientation === 2) {
    return { "filters[orientation][portrait]": 1 };
  }
  return { "filters[orientation][landscape]": 1 };
}

async function freepikSearchResources(term, limit, page, orientation) {
  const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;
  if (!FREEPIK_API_KEY) throw new Error("FREEPIK_API_KEY not configured");

  const res = await axios.get("https://api.freepik.com/v1/resources", {
    headers: { "x-freepik-api-key": FREEPIK_API_KEY },
    params: {
      order: "relevance",
      page,
      limit,
      term: term.trim(),
      ...freepikOrientationParams(orientation),
    },
  });

  return res?.data?.data || [];
}

async function freepikStockOneFromItem(item, orientation, uploadFolder) {
  const buffer = await freepikFetchAssetBufferFromItem(item);
  if (!buffer || buffer.length < 500) {
    throw new Error("Empty or invalid image buffer");
  }
  const url = await saveBufferWebOptimizedWebp(
    buffer,
    "freepik",
    uploadFolder,
    orientation,
    PHOTO_MAX_LONG_EDGE_FREEPIK
  );
  return { url, source: "freepik", orientation };
}

async function tryFreepikStockOneItem(item, orientation, uploadFolder) {
  for (let retry = 0; retry <= MAX_RETRIES; retry++) {
    try {
      return await freepikStockOneFromItem(item, orientation, uploadFolder);
    } catch (e) {
      console.error(
        `Freepik stock download attempt ${retry + 1} failed:`,
        e.message
      );
    }
  }
  return null;
}

async function freepikProvider(prompt, total, orientation, uploadFolder = null) {
  if (!process.env.FREEPIK_API_KEY) {
    console.error("FREEPIK_API_KEY not configured");
    return [];
  }

  const want = Math.min(10, Math.max(1, total));
  const fetchLimit = Math.min(100, Math.max(want * 3, want + 4));
  const results = [];
  const seenResourceKeys = new Set();
  const CONCURRENCY = 3;

  try {
    for (let page = 1; page <= 3 && results.length < want; page++) {
      const items = await freepikSearchResources(
        prompt,
        fetchLimit,
        page,
        orientation
      );
      if (!items.length) break;

      const rowItems = [];
      for (const item of items) {
        const rid = item?.id;
        const key =
          rid != null && rid !== ""
            ? `id:${rid}`
            : (() => {
                try {
                  const u = item?.image?.source?.url;
                  return u ? `u:${normalizeFreepikUrl(u)}` : "";
                } catch {
                  return "";
                }
              })();
        if (!key || seenResourceKeys.has(key)) continue;
        seenResourceKeys.add(key);
        rowItems.push(item);
      }

      for (let i = 0; i < rowItems.length && results.length < want; i += CONCURRENCY) {
        const chunk = rowItems.slice(i, i + CONCURRENCY);
        for (const item of chunk) {
          if (results.length >= want) break;
          const img = await tryFreepikStockOneItem(item, orientation, uploadFolder);
          if (img) results.push(img);
        }
      }
    }
  } catch (e) {
    console.error("Freepik stock search failed:", e.message);
  }

  if (results.length < want) {
    console.warn(
      `Freepik: got ${results.length}/${want} images from stock search`
    );
  }
  return results;
}

// =========================
// GEMINI PROVIDER
// =========================

async function geminiGenerateOne(prompt, orientation, uploadFolder = null) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

  const orientationInstruction = orientation === 1
    ? "Generate a LANDSCAPE wide image with 16:9 aspect ratio. The width MUST be significantly greater than the height."
    : "Generate a PORTRAIT vertical image with 9:16 aspect ratio. The height MUST be significantly greater than the width.";

  const enhancedPrompt = `${orientationInstruction}\n\n${prompt}\n\nHigh quality, realistic, professional photography style. Do NOT generate text or watermarks.`;

  const result = await model.generateContent(enhancedPrompt);
  const response = await result.response;

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);
  if (!imagePart?.inlineData?.data) {
    throw new Error("Gemini returned no image data");
  }

  let base64 = imagePart.inlineData.data;
  if (base64.includes("base64,")) base64 = base64.split("base64,")[1];

  const buffer = Buffer.from(base64, "base64");
  const url = await saveBufferWebOptimizedWebp(
    buffer,
    "gemini",
    uploadFolder,
    orientation,
    PHOTO_MAX_LONG_EDGE_GEMINI
  );
  return { url, source: "gemini", orientation };
}

async function geminiProvider(prompt, total, orientation, uploadFolder = null) {
  const results = [];
  let failures = 0;

  for (let i = 0; i < total; i++) {
    let success = false;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        const img = await geminiGenerateOne(prompt, orientation, uploadFolder);
        results.push(img);
        success = true;
        break;
      } catch (e) {
        console.error(`Gemini image ${i + 1} attempt ${retry + 1} failed:`, e.message);
      }
    }
    if (!success) failures++;
  }

  if (failures > 0) {
    console.warn(`Gemini: ${failures}/${total} images failed after retries`);
  }
  return results;
}

// =========================
// MAIN HELPER
// =========================

async function generateImages(prompt, total = 1, orientation = 1, origin = 1, options = {}) {
  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    throw new Error("prompt is required");
  }
  if (!options?.projectId || !String(options.projectId).trim()) {
    throw new Error("projectId is required for image generation");
  }

  const projectId = String(options?.projectId || "").trim();
  const uploadFolder =
    options && typeof options.uploadFolder === "string" && options.uploadFolder.trim()
      ? options.uploadFolder.trim()
      : `public/images/${projectId}`;
  const tracking = {
    userId: options?.userId || "system",
    projectId,
    pageId: options?.pageId || options?.projectId || null,
    promptFrom: options?.promptFrom || "imageProviderHelper",
    promptFor: options?.promptFor || "image_generation",
  };

  if (tracking.userId && tracking.userId !== "system") {
    if (Number(origin) === 1) {
      await ensureSufficientCredits({
        userId: tracking.userId,
        usageType: USAGE_TYPE.FREEPIK,
        imagesCount: total,
        minCredits: 1,
        reason: "Freepik image generation",
      });
    } else if (Number(origin) === 2) {
      await ensureSufficientCredits({
        userId: tracking.userId,
        usageType: USAGE_TYPE.IMAGES,
        imagesCount: total,
        minCredits: 1,
        reason: "NanoBanana/Gemini image generation",
      });
    } else if (Number(origin) === 3) {
      const freepikCount = Math.ceil(total / 2);
      const aiCount = total - freepikCount;
      await Promise.all([
        ensureSufficientCredits({
          userId: tracking.userId,
          usageType: USAGE_TYPE.FREEPIK,
          imagesCount: freepikCount,
          minCredits: 1,
          reason: "Freepik image generation",
        }),
        ensureSufficientCredits({
          userId: tracking.userId,
          usageType: USAGE_TYPE.IMAGES,
          imagesCount: aiCount,
          minCredits: 1,
          reason: "NanoBanana/Gemini image generation",
        }),
      ]);
    }
  }

  const trackImageUsage = async (usageType, generatedCount, status = 1) => {
    if (!tracking.projectId) return;
    await trackCreditsUsage({
      userId: tracking.userId,
      projectId: tracking.projectId,
      usageType,
      promptFrom: tracking.promptFrom,
      promptFor: tracking.promptFor,
      pageId: tracking.pageId,
      inputTokens: 1,
      outputTokens: Math.max(0, Number(generatedCount) || 0),
      imagesCount: Math.max(0, Number(generatedCount) || 0),
      pricing: 0,
      status,
      is_retried: 0,
    });
  };

  origin = Number(origin) || 1;
  total = Math.max(1, Math.min(10, Number(total) || 1));
  orientation = parseOrientation(orientation);

  let images = [];

  try {
    if (origin === 1) {
      images = await freepikProvider(prompt, total, orientation, uploadFolder);
      await trackImageUsage(USAGE_TYPE.FREEPIK, images.length, images.length > 0 ? 1 : 0);
    } else if (origin === 2) {
      images = await geminiProvider(prompt, total, orientation, uploadFolder);
      await trackImageUsage(USAGE_TYPE.IMAGES, images.length, images.length > 0 ? 1 : 0);
    } else if (origin === 3) {
      const freepikCount = Math.ceil(total / 2);
      const geminiCount = total - freepikCount;

      let freepikImages = [];
      let geminiImages = [];
      [freepikImages, geminiImages] = await Promise.all([
        freepikProvider(prompt, freepikCount, orientation, uploadFolder),
        geminiProvider(prompt, geminiCount, orientation, uploadFolder),
      ]);

      images = [...freepikImages, ...geminiImages];

      if (images.length < total) {
        const shortfall = total - images.length;
        const backfill = await freepikProvider(prompt, shortfall, orientation, uploadFolder);
        freepikImages = [...freepikImages, ...backfill];
        images = [...images, ...backfill];
      }

      await Promise.all([
        trackImageUsage(USAGE_TYPE.FREEPIK, freepikImages.length, freepikImages.length > 0 ? 1 : 0),
        trackImageUsage(USAGE_TYPE.IMAGES, geminiImages.length, geminiImages.length > 0 ? 1 : 0),
      ]);
    }
  } catch (error) {
    if (origin === 1) await trackImageUsage(USAGE_TYPE.FREEPIK, 0, 0);
    if (origin === 2) await trackImageUsage(USAGE_TYPE.IMAGES, 0, 0);
    if (origin === 3) {
      await Promise.all([
        trackImageUsage(USAGE_TYPE.FREEPIK, 0, 0),
        trackImageUsage(USAGE_TYPE.IMAGES, 0, 0),
      ]);
    }
    throw error;
  }

  return {
    requested: total,
    generated: images.length,
    orientation,
    orientationLabel: ORIENTATION_LABEL[orientation],
    images: images.slice(0, total),
  };
}

generateImages.saveBufferAsWebp = saveBufferAsWebp;
generateImages.saveBufferWebOptimizedWebp = saveBufferWebOptimizedWebp;
generateImages.parseOrientation = parseOrientation;
module.exports = generateImages;
