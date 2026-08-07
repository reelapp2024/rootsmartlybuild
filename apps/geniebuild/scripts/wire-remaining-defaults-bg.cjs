/**
 * Wire remaining Default/Consistent section variants to resolveSectionBackground.
 */
const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (/(Default|Consistent)\.tsx$/.test(ent.name)) acc.push(p);
  }
  return acc;
}

const sectionsRoot = path.join(__dirname, '..', 'components', 'sections');
const utilAbs = path.join(__dirname, '..', 'utils', 'sectionBackground');
const files = walk(sectionsRoot);
let changed = 0;
let skipped = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  if (src.includes('resolveSectionBackground')) {
    skipped++;
    continue;
  }

  // Must have a section bg variable named bg used as wrapper backgroundColor
  if (!/\bbackgroundColor:\s*bg\b/.test(src) && !/const bg\s*=/.test(src)) {
    skipped++;
    continue;
  }
  if (!/const bg\s*=/.test(src)) {
    skipped++;
    continue;
  }

  const stylesVar = /\bconst s = styles\b/.test(src)
    ? 's'
    : /\bconst \{[^}]*styles[^}]*\}/.test(src) || /\bstyles\b/.test(src)
      ? (/const s = /.test(src) ? 's' : 'styles')
      : 'styles';

  // Prefer `s` when present (most Defaults)
  const stylesExpr = /\bconst s = (styles|section\.styles)/.test(src) ? 's' : 'styles';

  let importPath = path.relative(path.dirname(file), utilAbs).replace(/\\/g, '/');
  if (!importPath.startsWith('.')) importPath = './' + importPath;

  // Insert import after last import
  const importLine = `import { resolveSectionBackground } from '${importPath}';`;
  const imports = [...src.matchAll(/^import .+;$/gm)];
  if (!imports.length) {
    skipped++;
    continue;
  }
  const last = imports[imports.length - 1];
  src =
    src.slice(0, last.index + last[0].length) +
    '\n' +
    importLine +
    src.slice(last.index + last[0].length);

  // Insert bgStyle after first `const bg = ...;`
  if (!src.includes('const bgStyle = resolveSectionBackground')) {
    src = src.replace(
      /const bg(\s*)=([^;]+);/,
      (m, sp, expr) =>
        `const bg${sp}=${expr};\n  const bgStyle = resolveSectionBackground(${stylesExpr}, { defaultSurface: bg });`
    );
  }

  // Outer wrappers: style={{ backgroundColor: bg }} → spread bgStyle
  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*\}\}/g,
    'style={{ ...bgStyle }}'
  );
  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*,/g,
    'style={{ ...bgStyle, backgroundColor: bgStyle.backgroundColor || bg,'
  );
  // object style blocks: backgroundColor: bg, (inside larger style objects used as section root)
  // Only replace when it's clearly the section surface (risky for cards). Limit to lines that
  // already got bgStyle and still have `backgroundColor: bg` on a div with w-full / relative w-full
  // Already handled main patterns above.

  if (!src.includes('bgStyle')) {
    skipped++;
    continue;
  }

  fs.writeFileSync(file, src);
  changed++;
  console.log('updated', path.relative(sectionsRoot, file).replace(/\\/g, '/'));
}

console.log(JSON.stringify({ changed, skipped, total: files.length }));
