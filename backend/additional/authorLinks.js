/**
 * Normalize Author.links from any admin / legacy shape into
 * [{ label, url }] — keep every usable link, never silently drop half the set.
 */

function stripWrappingQuotes(s) {
  const t = String(s || "").trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/**
 * Make a clickable href from almost anything users paste in admin.
 * Rejects only empty / # / javascript: / data:.
 */
function normalizeAuthorHref(raw) {
  let url = stripWrappingQuotes(raw);
  if (!url || url === "#" || /^javascript:/i.test(url) || /^data:/i.test(url)) {
    return "";
  }
  if (/^mailto:/i.test(url) || /^tel:/i.test(url)) return url;
  if (url.startsWith("//")) url = `https:${url}`;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    url = `https://${url.replace(/^\/+/, "")}`;
  }
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
    if (u.protocol === "mailto:" || u.protocol === "tel:") return url;
  } catch {
    /* fall through */
  }
  if (/^https?:\/\//i.test(url)) return url;
  return "";
}

function labelFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("instagram")) return "Instagram";
    if (host.includes("facebook") || host === "fb.me" || host === "fb.com") return "Facebook";
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host === "x.com" || host.includes("twitter")) return "X";
    if (host.includes("tiktok")) return "TikTok";
    if (host.includes("github")) return "GitHub";
    if (host.includes("whatsapp") || host === "wa.me") return "WhatsApp";
    if (host.includes("t.me") || host.includes("telegram")) return "Telegram";
    return host || "Link";
  } catch {
    return "Link";
  }
}

/**
 * Accepts:
 * - [{ label, url }]
 * - [{ name, href }]
 * - ["https://…"]
 * - { LinkedIn: "https://…", … }
 * - JSON string of any of the above
 */
function normalizeAuthorLinks(input) {
  let raw = input;

  if (raw == null || raw === "") return [];

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[]" || trimmed === "null") return [];
    try {
      raw = JSON.parse(trimmed);
    } catch {
      const href = normalizeAuthorHref(trimmed);
      return href ? [{ label: labelFromUrl(href), url: href }] : [];
    }
  }

  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if (typeof raw.length === "number" && raw.length >= 0) {
      raw = Array.from(raw);
    } else if (raw.toObject && typeof raw.toObject === "function") {
      try {
        const obj = raw.toObject();
        if (Array.isArray(obj)) raw = obj;
        else if (obj && typeof obj === "object") {
          raw = Object.entries(obj).map(([label, url]) => ({ label, url }));
        }
      } catch {
        raw = Object.entries(raw)
          .filter(([k]) => !k.startsWith("$") && k !== "_id" && k !== "__v")
          .map(([label, url]) => ({ label, url }));
      }
    } else {
      raw = Object.entries(raw)
        .filter(([k]) => !String(k).startsWith("$") && k !== "_id" && k !== "__v")
        .map(([label, url]) => ({ label, url }));
    }
  }

  if (!Array.isArray(raw)) return [];

  const out = [];
  const seen = new Set();

  for (const item of raw) {
    if (item == null) continue;

    let label = "";
    let url = "";

    if (typeof item === "string") {
      url = normalizeAuthorHref(item);
      label = labelFromUrl(url);
    } else if (typeof item === "object") {
      label = stripWrappingQuotes(
        item.label || item.name || item.title || item.platform || ""
      );
      url = normalizeAuthorHref(
        item.url || item.href || item.link || item.value || ""
      );
      if (!url && item.link && typeof item.link === "object") {
        url = normalizeAuthorHref(item.link.url || item.link.href || "");
      }
      if (!label && url) label = labelFromUrl(url);
    }

    if (!url) continue;
    if (!label) label = "Link";

    const key = `${label.toLowerCase()}|${url.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label, url });
  }

  return out;
}

module.exports = {
  normalizeAuthorLinks,
  normalizeAuthorHref,
  labelFromUrl,
};
