const SITENEXTJS_PREVIEW_ORIGIN =
  (import.meta.env.VITE_SITENEXTJS_PREVIEW_URL || "http://localhost:3030").replace(/\/+$/, "");

/** Normalize WebsitePage.slug → URL path segment(s). Home → `/`. */
export function slugToPreviewPath(slug?: string | null): string {
  const raw = String(slug || "")
    .trim()
    .replace(/^\/+|\/+$/g, "");
  if (!raw || raw.toLowerCase() === "home") return "/";
  return `/${raw}`;
}

/** Admin SiteNextJS preview: slug path + projectId only. */
export function buildSiteNextJsPreviewUrl(projectId: string, slug?: string | null): string {
  const path = slugToPreviewPath(slug);
  const params = new URLSearchParams();
  params.set("projectId", projectId);
  return `${SITENEXTJS_PREVIEW_ORIGIN}${path}?${params.toString()}`;
}
