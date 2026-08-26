/**
 * Canonical backend origin for all frontends.
 *
 * Set one of (prefer the framework-prefixed form for client bundles):
 *   BackendUrl=https://apis.example.com
 *   VITE_BackendUrl=https://apis.example.com          (Vite / GenieBuild / Admin)
 *   NEXT_PUBLIC_BackendUrl=https://apis.example.com   (Next / SiteNextJS)
 *
 * Value must be the origin only (no /admin/v1). Paths are derived below.
 * Legacy VITE_API_URL / NEXT_PUBLIC_*_API_URL still work (origin is extracted).
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

function readRawBackendUrl(): string {
  const candidates: string[] = [];

  try {
    if (typeof process !== "undefined" && process.env) {
      candidates.push(
        process.env.NEXT_PUBLIC_BackendUrl || "",
        process.env.NEXT_PUBLIC_BACKEND_URL || "",
        process.env.BackendUrl || "",
        process.env.BACKEND_URL || "",
        process.env.VITE_BackendUrl || "",
        process.env.VITE_BACKEND_URL || "",
        // legacy full API URLs — origin extracted below
        process.env.NEXT_PUBLIC_SITENEXTJS_API_URL || "",
        process.env.NEXT_PUBLIC_API_URL || "",
        process.env.VITE_API_URL || "",
        process.env.VITE_IMAGES_BASE_URL || ""
      );
    }
  } catch {
    /* ignore */
  }

  try {
    const viteEnv = (import.meta as any)?.env || {};
    candidates.push(
      viteEnv.VITE_BackendUrl || "",
      viteEnv.VITE_BACKEND_URL || "",
      viteEnv.BackendUrl || "",
      viteEnv.VITE_API_URL || "",
      viteEnv.VITE_IMAGES_BASE_URL || ""
    );
  } catch {
    /* ignore */
  }

  for (const c of candidates) {
    const origin = toOrigin(c);
    if (origin) return origin;
  }
  return "";
}

/** Backend origin, e.g. http://localhost:1111 — never a path suffix. */
export function resolveBackendUrl(): string {
  const origin = readRawBackendUrl();
  if (origin) return origin;

  // Local-only safety net so `pnpm dev` works before .env is filled.
  try {
    const isDev =
      (typeof process !== "undefined" && process.env?.NODE_ENV === "development") ||
      Boolean((import.meta as any)?.env?.DEV);
    if (isDev) return "http://localhost:1111";
  } catch {
    /* ignore */
  }

  if (typeof console !== "undefined") {
    console.error(
      "[backendUrl] BackendUrl is not set. Add VITE_BackendUrl or NEXT_PUBLIC_BackendUrl (origin only)."
    );
  }
  return "";
}

export function resolveAdminApiUrl(): string {
  const origin = resolveBackendUrl();
  return origin ? `${origin}/admin/v1` : "";
}

export function resolveSiteNextApiUrl(): string {
  const origin = resolveBackendUrl();
  return origin ? `${origin}/sitenextjs/v1` : "";
}

export function resolveWebappApiUrl(): string {
  const origin = resolveBackendUrl();
  return origin ? `${origin}/webapp/v1` : "";
}

/** Absolute media/upload base = backend origin. */
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
