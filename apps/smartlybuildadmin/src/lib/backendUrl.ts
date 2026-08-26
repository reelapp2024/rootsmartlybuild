/**
 * Canonical backend origin for Admin (Vite).
 * Prefer VITE_BackendUrl=https://host (origin only, no /admin/v1).
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

function readRaw(): string {
  const env = (import.meta as any)?.env || {};
  const candidates = [
    env.VITE_BackendUrl,
    env.VITE_BACKEND_URL,
    env.BackendUrl,
    env.VITE_API_URL,
    env.VITE_IMAGES_BASE_URL,
    env.VITE_API_BASE_URL,
  ];
  for (const c of candidates) {
    const origin = toOrigin(String(c || ""));
    if (origin) return origin;
  }
  return "";
}

export function resolveBackendUrl(): string {
  const origin = readRaw();
  if (origin) return origin;
  if ((import.meta as any)?.env?.DEV) return "http://localhost:1111";
  console.error(
    "[backendUrl] Set VITE_BackendUrl (origin only), e.g. http://localhost:1111"
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
