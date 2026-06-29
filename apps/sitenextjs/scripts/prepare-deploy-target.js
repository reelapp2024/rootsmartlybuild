/**
 * Toggles middleware for static export (Next disallows middleware with output: 'export').
 * Usage: node scripts/prepare-deploy-target.js static|node
 */
const fs = require('fs');
const path = require('path');

const target = (process.argv[2] || 'node').trim().toLowerCase();
const srcDir = path.join(__dirname, '..', 'src');
const active = path.join(srcDir, 'middleware.ts');
const disabled = path.join(srcDir, 'middleware.dynamic.ts');

function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

if (target === 'static') {
  if (exists(active) && !exists(disabled)) {
    fs.renameSync(active, disabled);
    console.log('[prepare-deploy-target] middleware disabled for static export');
  }
} else {
  if (exists(disabled) && !exists(active)) {
    fs.renameSync(disabled, active);
    console.log('[prepare-deploy-target] middleware restored for node build');
  }
}
