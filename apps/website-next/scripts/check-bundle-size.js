/**
 * Bundle Size Checker Script
 * Run: node scripts/check-bundle-size.js
 * 
 * This script analyzes the Next.js build output to show bundle sizes
 */

const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, '..', '.next');

console.log('📦 Bundle Size Analysis\n');
console.log('='.repeat(60));

// Check if build exists
if (!fs.existsSync(buildDir)) {
  console.log('❌ Build not found! Please run: npm run build');
  process.exit(1);
}

// Read build manifest
const manifestPath = path.join(buildDir, 'build-manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  console.log('\n📊 Main Bundle Files:');
  console.log('-'.repeat(60));
  
  if (manifest.pages) {
    Object.entries(manifest.pages).forEach(([page, files]) => {
      if (files.js && files.js.length > 0) {
        const totalSize = files.js.reduce((sum, file) => {
          const filePath = path.join(buildDir, 'static', file);
          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            return sum + stats.size;
          }
          return sum;
        }, 0);
        
        const sizeKB = (totalSize / 1024).toFixed(2);
        const sizeMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        console.log(`\n${page}:`);
        console.log(`  JS Files: ${files.js.length}`);
        console.log(`  Total Size: ${sizeKB} KB (${sizeMB} MB)`);
      }
    });
  }
}

// Check static chunks
const staticDir = path.join(buildDir, 'static', 'chunks');
if (fs.existsSync(staticDir)) {
  console.log('\n📦 Static Chunks:');
  console.log('-'.repeat(60));
  
  const chunks = fs.readdirSync(staticDir)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(staticDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size
      };
    })
    .sort((a, b) => b.size - a.size)
    .slice(0, 10); // Top 10 largest chunks
  
  let totalSize = 0;
  chunks.forEach(chunk => {
    const sizeKB = (chunk.size / 1024).toFixed(2);
    const sizeMB = (chunk.size / (1024 * 1024)).toFixed(2);
    totalSize += chunk.size;
    console.log(`  ${chunk.name}: ${sizeKB} KB (${sizeMB} MB)`);
  });
  
  const totalKB = (totalSize / 1024).toFixed(2);
  const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
  console.log(`\n  Total Top 10 Chunks: ${totalKB} KB (${totalMB} MB)`);
}

console.log('\n' + '='.repeat(60));
console.log('\n💡 Tip: For detailed analysis, run: npm run analyze');
console.log('   (Requires @next/bundle-analyzer package)');

