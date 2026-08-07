const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('Default.tsx') || ent.name.endsWith('Consistent.tsx')) acc.push(p);
  }
  return acc;
}

const root = path.join(__dirname, '..', 'components', 'sections');
const files = walk(root);
let changed = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const orig = src;
  if (!/const bg = s\.backgroundColor/.test(src)) continue;
  if (src.includes('resolveSectionBackground')) continue;

  // Compute relative import depth from file to utils/sectionBackground
  // file is under components/sections/... → utils is apps/geniebuild/utils
  const relToSections = path.relative(path.dirname(file), path.join(__dirname, '..', 'utils', 'sectionBackground'));
  let importPath = relToSections.replace(/\\/g, '/');
  if (!importPath.startsWith('.')) importPath = './' + importPath;

  if (!src.includes('resolveSectionBackground')) {
    const lastImport = [...src.matchAll(/^import .+;$/gm)].pop();
    if (lastImport) {
      const insertAt = lastImport.index + lastImport[0].length;
      src =
        src.slice(0, insertAt) +
        `\nimport { resolveSectionBackground } from '${importPath}';` +
        src.slice(insertAt);
    }
  }

  src = src.replace(
    /const bg = s\.backgroundColor([^;]*);/,
    (m, rest) =>
      `const bg = s.backgroundColor${rest};\n  const bgStyle = resolveSectionBackground(s, { defaultSurface: bg });`
  );

  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*\}\}/g,
    'style={{ ...bgStyle }}'
  );
  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*,/g,
    'style={{ ...bgStyle, backgroundColor: bgStyle.backgroundColor || bg,'
  );

  if (src !== orig) {
    fs.writeFileSync(file, src);
    changed++;
    console.log('updated', path.relative(root, file).replace(/\\/g, '/'));
  }
}
console.log('changed', changed);
