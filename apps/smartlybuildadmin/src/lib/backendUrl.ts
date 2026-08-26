/**
 * Canonical backend origin for Admin (Vite).
 *
 * IMPORTANT: Vite only statically replaces `import.meta.env.VITE_*`.
 * Never read env via `import.meta.env[key]` or a dynamic object — it breaks in production.
 *
 * Set on Railway (origin only, no /admin/v1):
 *   VITE_BackendUrl=https://backend-xxxxx.up.railway.app
 */

function stripSlash(s: string): string {
  return String(s || "").trim().replace(/\/+$/, "");
}

function toOrigin(raw: string): string {
  const cleaned = stripSlash(raw);
  if (!cleaned) return "";
  try {
    const withProto = cleaned.includes("://") ? cleaned : `http://${cleaned}`;
    return new URL(withProto).origin;
  } catch {
    return cleaned;
  }
}

/** Static Vite env reads (required for production bundle replacement). */
const BAKED_BACKEND_URL = toOrigin(
  String(import.meta.env.VITE_BackendUrl || "")
);
const BAKED_BACKEND_URL_ALT = toOrigin(
  String(import.meta.env.VITE_BACKEND_URL || "")
);
const BAKED_API_URL = toOrigin(String(import.meta.env.VITE_API_URL || ""));
const BAKED_IMAGES = toOrigin(
  String(import.meta.env.VITE_IMAGES_BASE_URL || "")
);

export function resolveBackendUrl(): string {
  // Prefer dedicated BackendUrl; ignore localhost image base when a real backend is set
  if (BAKED_BACKEND_URL) return BAKED_BACKEND_URL;
  if (BAKED_BACKEND_URL_ALT) return BAKED_BACKEND_URL_ALT;
  if (BAKED_API_URL) return BAKED_API_URL;
  if (
    BAKED_IMAGES &&
    !/localhost|127\.0\.0\.1/i.test(BAKED_IMAGES)
  ) {
    return BAKED_IMAGES;
  }

  if (import.meta.env.DEV) return "http://localhost:1111";

  console.error(
    "[backendUrl] VITE_BackendUrl missing in production bundle. Set it on Railway and redeploy."
  );
  return "";
}

export function resolveAdminApiUrl(): string {
  const origin = resolveBackendUrl();
  return origin ? `${origin}/admin/v1` : "";
}

export function resolveMediaBaseUrl(): string {
  return resolveBackendUrl();
}

export function joinBackendPath(path: string): string {
  const origin = resolveBackendUrl();
  if (!origin) return path || "";
  if (!path) return origin;
  if (/^https?:\/\//i.test(path)) return path;
  return `${origin}${path.startsWith("/") ? "" : "/"}${path}`;
}
