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
 *
 * This module is shared with SiteNext (Next.js). Under webpack, `import.meta.env`
 * may be undefined — never dereference it without a guard. Keep `import.meta.env.VITE_*`
 * as static member access so Vite can still replace them in GenieBuild builds.
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

/** Catch missing `import.meta.env` when this file is bundled by Next.js. */
function viteEnvString(read: () => unknown): string {
  try {
    return String(read() ?? "");
  } catch {
    return "";
  }
}

function isViteDev(): boolean {
  try {
    return Boolean(import.meta.env.DEV);
  } catch {
    return false;
  }
}

function isNextDev(): boolean {
  try {
    return (
      typeof process !== "undefined" &&
      !!process.env &&
      process.env.NODE_ENV === "development"
    );
  } catch {
    return false;
  }
}

function isDevRuntime(): boolean {
  return isViteDev() || isNextDev();
}

/** Static Vite env reads — required for production replacement. */
function readRawBackendUrl(): string {
  const viteCandidates = [
    // Keep these as direct import.meta.env.VITE_* property access (static).
    viteEnvString(() => import.meta.env.VITE_BackendUrl),
    viteEnvString(() => import.meta.env.VITE_BACKEND_URL),
    viteEnvString(() => import.meta.env.VITE_API_URL),
    viteEnvString(() => import.meta.env.VITE_IMAGES_BASE_URL),
  ];

  const isDev = isDevRuntime();

  for (const c of viteCandidates) {
    const origin = toOrigin(c);
    if (origin && !/localhost|127\.0\.0\.1/i.test(origin)) return origin;
    if (origin && isDev) return origin;
  }

  try {
    if (typeof process !== "undefined" && process.env) {
      const nextCandidates = [
        process.env.NEXT_PUBLIC_BackendUrl || "",
        process.env.NEXT_PUBLIC_BACKEND_URL || "",
        process.env.BackendUrl || "",
        process.env.BACKEND_URL || "",
        process.env.NEXT_PUBLIC_SITENEXTJS_API_URL || "",
        process.env.NEXT_PUBLIC_API_URL || "",
      ];
      for (const c of nextCandidates) {
        const origin = toOrigin(c);
        if (origin) return origin;
      }
    }
  } catch {
    /* ignore */
  }

  // Dev localhost fallback only
  for (const c of viteCandidates) {
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
  if (isDevRuntime()) return "http://localhost:1111";

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
