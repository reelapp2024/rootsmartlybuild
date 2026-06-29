const fs = require('fs-extra');
const path = require('path');

function buildKeyForProject(projectId) {
  return `static-${String(projectId).trim()}`;
}

function statusFilePath(buildKey) {
  return path.resolve(__dirname, '..', 'deploy-temp', buildKey, 'build-status.json');
}

function artifactDirForBuildKey(buildKey) {
  return path.resolve(__dirname, '..', 'deploy-temp', buildKey, 'out');
}

async function writeStaticBuildStatus(buildKey, patch) {
  const filePath = statusFilePath(buildKey);
  await fs.ensureDir(path.dirname(filePath));
  let prev = {};
  try {
    if (await fs.pathExists(filePath)) {
      prev = await fs.readJson(filePath);
    }
  } catch {
    prev = {};
  }
  const next = {
    ...prev,
    ...patch,
    buildKey,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeJson(filePath, next, { spaces: 2 });
  return next;
}

async function readStaticBuildStatus(projectId) {
  const buildKey = buildKeyForProject(projectId);
  const filePath = statusFilePath(buildKey);
  if (!(await fs.pathExists(filePath))) {
    const outDir = artifactDirForBuildKey(buildKey);
    const hasOut = await fs.pathExists(path.join(outDir, 'index.html'));
    if (hasOut) {
      return {
        status: 'success',
        buildKey,
        artifactPath: outDir,
        message: 'Build output found (status file was missing).',
      };
    }
    return { status: 'idle', buildKey };
  }
  const data = await fs.readJson(filePath);
  const outDir = artifactDirForBuildKey(buildKey);
  if (data.status === 'success' && !data.artifactPath) {
    data.artifactPath = outDir;
  }
  return data;
}

module.exports = {
  buildKeyForProject,
  artifactDirForBuildKey,
  writeStaticBuildStatus,
  readStaticBuildStatus,
};
