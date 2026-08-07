/** Light cosmetic tidy after DNA theme-color strip. */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.join(__dirname, '../components/sections'),
  path.join(__dirname, '../components/contentwebsitesSections'),
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.tsx') && e.name !== 'ElementsSection.tsx') acc.push(p);
  }
  return acc;
}

let n = 0;
for (const f of ROOTS.flatMap((r) => walk(r))) {
  const before = fs.readFileSync(f, 'utf8');
  let after = before.replace(/style:\s*\{\s{2,}/g, 'style: { ');
  after = after.replace(/\n[ \t]*\n[ \t]*\n/g, '\n\n');
  if (after !== before) {
    fs.writeFileSync(f, after);
    n++;
  }
}
console.log('cosmetic files', n);
