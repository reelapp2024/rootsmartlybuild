// Clear Vite cache before starting dev server
// This ensures HMR works properly for workspace packages

import { rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cachePaths = [
  resolve(__dirname, 'node_modules/.vite'),
  resolve(__dirname, '../../node_modules/.vite'),
];

console.log('🧹 Clearing Vite cache for better HMR...\n');

cachePaths.forEach((cachePath) => {
  try {
    rmSync(cachePath, { recursive: true, force: true });
    console.log(`✅ Cleared: ${cachePath}`);
  } catch (error) {
    // Cache doesn't exist, that's fine
    if (error.code !== 'ENOENT') {
      console.warn(`⚠️  Could not clear: ${cachePath}`);
    }
  }
});

console.log('\n🚀 Starting Vite dev server...\n');
