/**
 * File-based scan of GenieBuild section variants.
 * Supports:
 * - sections/{section}/{Variant}.tsx
 * - sections/{page}/{section}/{Variant}.tsx
 * Variant uniqueId = lowercase file basename.
 */
const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set(["utils", "node_modules", ".git"]);
const IGNORED_ROOT_FILES = new Set([
  "SectionRouter.tsx",
  "SectionRouterGenerator.tsx",
]);

/**
 * @param {string} sectionsRoot absolute path to apps/geniebuild/components/sections
 * @returns {{ componentsByName: Record<string, { uniqueId: string, fileBase: string }[]>, logLines: string[] }}
 */
function scanGenieSections(sectionsRoot) {
  const logLines = [];
  const componentsByName = {};

  if (!fs.existsSync(sectionsRoot)) {
    logLines.push(`[scanGenieSections] Missing path: ${sectionsRoot}`);
    return { componentsByName, logLines };
  }

  const allItems = fs.readdirSync(sectionsRoot, { withFileTypes: true });

  function pushVariant(sectionName, fileBase) {
    if (!sectionName || !fileBase) return;
    const normalizedSection = sectionName.toLowerCase().trim();
    if (IGNORED_DIRS.has(normalizedSection)) return;
    const uniqueId = fileBase.toLowerCase();
    if (!componentsByName[normalizedSection]) componentsByName[normalizedSection] = [];
    const exists = componentsByName[normalizedSection].some((v) => v.uniqueId === uniqueId);
    if (!exists) componentsByName[normalizedSection].push({ uniqueId, fileBase });
  }

  function scanDirRecursive(absDir, relFromRoot = "") {
    let items = [];
    try {
      items = fs.readdirSync(absDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of items) {
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        scanDirRecursive(path.join(absDir, entry.name), path.join(relFromRoot, entry.name));
        continue;
      }

      if (!entry.isFile() || !entry.name.endsWith(".tsx")) continue;
      if (entry.name.includes("Section.tsx")) continue;

      const fileBase = entry.name.replace(/\.tsx$/i, "");
      const relParts = relFromRoot.split(path.sep).filter(Boolean);

      // /{section}/{variant}.tsx => section = first folder
      // /{page}/{section}/{variant}.tsx => section = second folder
      let sectionName = "";
      if (relParts.length >= 2) sectionName = relParts[1];
      else if (relParts.length === 1) sectionName = relParts[0];
      else sectionName = fileBase.replace(/Section$/i, "");

      pushVariant(sectionName, fileBase);
    }
  }

  scanDirRecursive(sectionsRoot);

  for (const dirent of allItems) {
    if (!dirent.isDirectory() || IGNORED_DIRS.has(dirent.name)) continue;
    const sectionName = dirent.name.toLowerCase().trim();
    if (componentsByName[sectionName]?.length) {
      logLines.push(`Synced section: ${sectionName} (${componentsByName[sectionName].length} variants)`);
    }
  }

  for (const dirent of allItems) {
    if (!dirent.isFile() || !dirent.name.endsWith(".tsx")) continue;
    if (IGNORED_ROOT_FILES.has(dirent.name)) continue;

    const fileBase = dirent.name.replace(/\.tsx$/i, "");
    let sectionName = fileBase.replace(/Section$/i, "").toLowerCase();
    if (!sectionName) sectionName = fileBase.toLowerCase();
    const before = componentsByName[sectionName]?.length || 0;
    pushVariant(sectionName, fileBase);
    const after = componentsByName[sectionName]?.length || 0;
    if (after > before) {
      logLines.push(`Synced root section module: ${sectionName} (${fileBase})`);
    }
  }

  return { componentsByName, logLines };
}

module.exports = { scanGenieSections };
