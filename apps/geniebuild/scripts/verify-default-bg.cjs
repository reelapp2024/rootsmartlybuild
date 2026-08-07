const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('Default.tsx') || e.name.endsWith('Consistent.tsx')) acc.push(p);
  }
  return acc;
}

const root = path.join(__dirname, '../components/sections');
const bad = [];
for (const f of walk(root)) {
  const s = fs.readFileSync(f, 'utf8');
  if (!s.includes('resolveSectionBackground')) continue;
  const m = s.match(/from ['"]([^'"]*sectionBackground)['"]/);
  if (!m) {
    bad.push(path.relative(root, f) + ' NO IMPORT');
    continue;
  }
  if (!s.includes('...bgStyle')) bad.push(path.relative(root, f) + ' missing ...bgStyle');
}
console.log(bad.length ? bad.join('\n') : 'ALL OK');
