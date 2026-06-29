const fs = require('fs-extra');
const path = require('path');
const WebsitePage = require('../models/WebsitePage');
const UserProject = require('../models/userProjects');
const mongoose = require('mongoose');

function normalizeHostname(input) {
  let v = String(input || '').trim().toLowerCase();
  if (!v) return null;
  v = v.replace(/(^\w+:|^)\/\//, '').replace(/\/+$/, '');
  v = v.replace(/^www\./, '');
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(v)) {
    return null;
  }
  return v;
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** WebsitePage.slug → URL path for sitemap */
function slugToSitemapPath(slug, name) {
  const raw = String(slug ?? name ?? '').trim().toLowerCase();
  if (!raw || raw === 'home') return '/';
  return `/${raw.replace(/^\/+/, '')}`;
}

/**
 * Collect unique paths from WebsitePage for a project.
 */
async function collectWebsitePagePaths(projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error('Invalid projectId');
  }
  const pid = new mongoose.Types.ObjectId(projectId);
  const pages = await WebsitePage.find({ projectId: pid })
    .select('slug name')
    .lean();

  const paths = new Set(['/']);
  for (const page of pages) {
    paths.add(slugToSitemapPath(page.slug, page.name));
  }
  return Array.from(paths).sort((a, b) => a.localeCompare(b));
}

function buildSitemapXml(domain, paths) {
  const host = normalizeHostname(domain);
  if (!host) throw new Error('Invalid domain for sitemap');
  const baseUrl = `https://${host}`;
  const now = new Date().toISOString();

  const urlsXml = paths
    .map((route) => {
      const loc = route === '/' ? baseUrl : `${baseUrl}${route}`;
      const priority = route === '/' ? '1.0' : '0.8';
      return (
        `<url>` +
        `<loc>${escapeXml(loc)}</loc>` +
        `<lastmod>${escapeXml(now)}</lastmod>` +
        `<changefreq>weekly</changefreq>` +
        `<priority>${escapeXml(priority)}</priority>` +
        `</url>`
      );
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urlsXml +
    `</urlset>`
  );
}

function buildRobotsTxt(domain) {
  const host = normalizeHostname(domain);
  const baseUrl = `https://${host}`;
  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${baseUrl}/sitemap.xml`,
    '',
  ].join('\n');
}

function buildLlmsTxt(domain, projectName, paths) {
  const host = normalizeHostname(domain);
  const baseUrl = `https://${host}`;
  const title = projectName || host;
  const lines = [
    `# ${title}`,
    '',
    `> Public website: ${baseUrl}`,
    '',
    '## Sitemap',
    `${baseUrl}/sitemap.xml`,
    '',
    '## Pages',
    ...paths.slice(0, 200).map((p) => (p === '/' ? baseUrl : `${baseUrl}${p}`)),
    '',
    '## Contact',
    'This file helps AI systems discover public pages on this site.',
    '',
  ];
  return lines.join('\n');
}

const HTACCESS_SPA = `# SiteNextJS static export — SPA fallback (Apache/cPanel)
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/.well-known/
  RewriteRule ^ - [L]

  RewriteCond %{REQUEST_URI} \\.(js|mjs|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|json|xml|txt|map|html)$ [NC]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ - [R=404,L]

  RewriteRule ^ index.html [QSA,L]
</IfModule>

<FilesMatch "\\.(html|htm)$">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate"
  </IfModule>
</FilesMatch>
`;

/**
 * Write sitemap.xml, robots.txt, llms.txt, .htaccess into artifact dir + backend public store.
 */
async function writeSeoArtifactsForDeploy({ outDir, projectId, domainName }) {
  const host = normalizeHostname(domainName);
  if (!host) throw new Error('A valid domain is required for sitemap generation');

  const paths = await collectWebsitePagePaths(projectId);
  const xml = buildSitemapXml(host, paths);

  const project = await UserProject.findById(projectId).select('projectName').lean();
  const projectName = project?.projectName || host;

  await fs.ensureDir(outDir);
  await fs.writeFile(path.join(outDir, 'sitemap.xml'), xml, 'utf8');
  await fs.writeFile(path.join(outDir, 'robots.txt'), buildRobotsTxt(host), 'utf8');
  await fs.writeFile(path.join(outDir, 'llms.txt'), buildLlmsTxt(host, projectName, paths), 'utf8');
  await fs.writeFile(path.join(outDir, '.htaccess'), HTACCESS_SPA, 'utf8');

  const publicDir = path.join(__dirname, '..', 'public', 'sitemaps', String(projectId));
  await fs.ensureDir(publicDir);
  await fs.writeFile(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');

  await UserProject.findByIdAndUpdate(projectId, {
    domainName: host,
    siteMapFilePath: `/sitemaps/${projectId}/sitemap.xml`,
  });

  return { paths, host, outDir };
}

module.exports = {
  normalizeHostname,
  collectWebsitePagePaths,
  buildSitemapXml,
  writeSeoArtifactsForDeploy,
};
