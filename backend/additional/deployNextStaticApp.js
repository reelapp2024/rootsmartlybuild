const fs = require('fs-extra');
const path = require('path');
const { execPromise } = require('./utils');
const { writeSeoArtifactsForDeploy } = require('../services/siteNextSeoArtifacts');
const { writeStaticBuildStatus } = require('./staticBuildStatus');

function resolveSiteNextJsPublicApiUrl() {
  const explicit = (process.env.SITENEXTJS_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SITENEXTJS_API_URL || '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const baseUrl = (process.env.BASE_URL || '').trim();
  if (baseUrl) {
    try {
      const u = new URL(baseUrl.includes('://') ? baseUrl : `http://${baseUrl}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      /* fall through */
    }
  }

  const admin = (process.env.PUBLIC_API_URL || process.env.API_BASE_URL || '').trim();
  if (admin) {
    try {
      const normalized = admin.replace(/\/+$/, '');
      const u = new URL(normalized.includes('://') ? normalized : `https://${normalized}`);
      return `${u.origin}/sitenextjs/v1`;
    } catch {
      /* fall through */
    }
  }
  return 'https://apis.smartlybuild.dev/sitenextjs/v1';
}

/**
 * Static export of apps/sitenextjs for one project (FTP/cPanel-style hosting).
 * @returns {Promise<string>} Absolute path to deploy artifact directory (contains index.html, etc.)
 */
async function deployNextStaticApp(deploymentId, projectId, domainName) {
  if (!deploymentId || !projectId) {
    throw new Error('deploymentId and projectId are required');
  }
  if (!domainName || !String(domainName).trim()) {
    throw new Error('domainName is required for static SiteNextJS build');
  }

  try {
  const repoRoot = path.resolve(__dirname, '..', '..');
  const sitenextjsDir = path.join(repoRoot, 'apps', 'sitenextjs');
  const sourceOut = path.join(sitenextjsDir, 'out');
  const artifactDir = path.resolve(__dirname, '..', 'deploy-temp', String(deploymentId), 'out');

  if (!fs.existsSync(sitenextjsDir)) {
    throw new Error(`SiteNextJS app not found at ${sitenextjsDir}`);
  }

  const apiUrl = resolveSiteNextJsPublicApiUrl();
  const buildEnv = {
    ...process.env,
    NEXT_DEPLOY_TARGET: 'static',
    NEXT_PUBLIC_PROJECT_ID: String(projectId).trim(),
    NEXT_PUBLIC_SITENEXTJS_API_URL: apiUrl,
  };

  console.log('[deployNextStaticApp] Preparing static build for project', projectId, 'domain', domainName);

  await writeStaticBuildStatus(deploymentId, {
    status: 'building',
    phase: 'preparing',
    projectId: String(projectId),
    domainName: String(domainName).trim(),
    message: 'Preparing Next.js static export…',
  });

  await execPromise('node scripts/prepare-deploy-target.js static', { cwd: sitenextjsDir, env: buildEnv });

  await writeStaticBuildStatus(deploymentId, {
    status: 'building',
    phase: 'compiling',
    message: 'Running npm run build:static (usually 1–3 minutes)…',
  });

  await execPromise('npm run build:static', {
    cwd: sitenextjsDir,
    env: buildEnv,
    maxBuffer: 1024 * 1024 * 50,
    shell: true,
  });

  if (!fs.existsSync(sourceOut)) {
    throw new Error(`Static export failed: missing ${sourceOut}`);
  }

  await writeStaticBuildStatus(deploymentId, {
    status: 'building',
    phase: 'copying',
    message: 'Copying build output…',
  });

  await fs.emptyDir(artifactDir);
  await fs.copy(sourceOut, artifactDir, { overwrite: true });

  await writeStaticBuildStatus(deploymentId, {
    status: 'building',
    phase: 'seo',
    message: 'Writing sitemap, robots.txt, llms.txt…',
  });

  await writeSeoArtifactsForDeploy({
    outDir: artifactDir,
    projectId: String(projectId).trim(),
    domainName: String(domainName).trim(),
  });

  await writeStaticBuildStatus(deploymentId, {
    status: 'success',
    phase: 'done',
    artifactPath: artifactDir,
    message: 'Static build completed.',
  });

  console.log('[deployNextStaticApp] Artifact ready at', artifactDir);
  return artifactDir;
  } catch (err) {
    await writeStaticBuildStatus(deploymentId, {
      status: 'build_failed',
      phase: 'error',
      error: err?.message || String(err),
      message: err?.message || String(err),
    }).catch(() => {});
    throw err;
  }
}

module.exports = { deployNextStaticApp, resolveSiteNextJsPublicApiUrl };
