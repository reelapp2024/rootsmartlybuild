/**
 * Freepik stock search (origin 1) — not AI text-to-image.
 */
const axios = require("axios");
const https = require("https");
const {
  MAX_RETRIES,
  saveBufferWebOptimizedWebp,
} = require("./shared");

const FREEPIK_HOSTS_ALLOW = new Set(["img.freepik.com", "images.freepik.com"]);

const PHOTO_MAX_LONG_EDGE = Math.min(
  8192,
  Math.max(2048, parseInt(process.env.IMAGE_MAX_LONG_EDGE_FREEPIK || "4096", 10) || 4096)
);

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
    PHOTO_MAX_LONG_EDGE
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

/**
 * @returns {Promise<Array<{ url: string, source: string, orientation: number }>>}
 */
async function generate(prompt, total, orientation, uploadFolder = null) {
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

module.exports = { generate, SOURCE: "freepik" };
