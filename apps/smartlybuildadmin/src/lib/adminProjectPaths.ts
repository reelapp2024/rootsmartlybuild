/**
 * Resolve project-scoped vs global blog admin paths.
 * Project dashboard: /admin/projects/:projectId/dashboard/...
 * Main panel: /admin/...
 */
export function resolveAdminProjectId(opts: {
  paramProjectId?: string | null;
  stateProjectId?: string | null;
  queryProjectId?: string | null;
}): string {
  return String(
    opts.paramProjectId || opts.stateProjectId || opts.queryProjectId || ""
  ).trim();
}

export function blogPostsListPath(projectId?: string | null): string {
  const id = String(projectId || "").trim();
  return id
    ? `/admin/projects/${id}/dashboard/blog-posts`
    : "/admin/blog-posts";
}

export function createBlogPostPath(projectId?: string | null): string {
  const id = String(projectId || "").trim();
  return id
    ? `/admin/projects/${id}/dashboard/create-post`
    : "/admin/create-post";
}

export function createBlogPostAiPath(projectId?: string | null): string {
  const id = String(projectId || "").trim();
  return id
    ? `/admin/projects/${id}/dashboard/create-post-ai`
    : "/admin/create-post-ai";
}

export function editBlogPostPath(projectId?: string | null, blogId?: string): string {
  const id = String(projectId || "").trim();
  const q = blogId ? `?id=${encodeURIComponent(blogId)}` : "";
  return id
    ? `/admin/projects/${id}/dashboard/edit-post${q}`
    : `/admin/edit-post${q}`;
}
