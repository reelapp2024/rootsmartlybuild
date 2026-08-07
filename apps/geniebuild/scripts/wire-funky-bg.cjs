const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (ent.name.endsWith('Funky.tsx')) acc.push(p);
  }
  return acc;
}

const root = path.join(__dirname, '..', 'components', 'contentwebsitesSections');
const files = walk(root);
let changed = 0;

for (const file of files) {
  let src = fs.readFileSync(file, 'utf8');
  const orig = src;
  const rel = path.relative(root, file).replace(/\\/g, '/');
  if (rel === 'homepage/hero/HeroFunky.tsx') continue;

  const usesSurface =
    src.includes('funkySurfaceColors') || /backgroundColor:\s*bg\b/.test(src);
  if (!usesSurface) continue;

  if (!src.includes('resolveFunkySectionChrome')) {
    src = src.replace(
      /import\s*\{([^}]+)\}\s*from\s*(['"][^'"]*funkyTheme['"])/m,
      (m, inner, q) => {
        if (inner.includes('resolveFunkySectionChrome')) return m;
        const trimmed = inner.replace(/\s+$/, '');
        return `import {${trimmed}, resolveFunkySectionChrome } from ${q}`;
      }
    );
  }

  if (!src.includes('resolveFunkySectionChrome(styles')) {
    if (/const bg = surface\.bg;/.test(src)) {
      src = src.replace(
        /const bg = surface\.bg;/,
        `const bg = surface.bg;\n  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);`
      );
    } else if (/const bg = /.test(src) && src.includes('isLight')) {
      src = src.replace(
        /const bg = ([^;]+);/,
        `const bg = $1;\n  const { wrapperStyle, overlayStyle } = resolveFunkySectionChrome(styles, isLight);`
      );
    }
  }

  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*,/g,
    'style={{ ...wrapperStyle,'
  );
  src = src.replace(
    /style=\{\{\s*backgroundColor:\s*bg\s*\}\}/g,
    'style={{ ...wrapperStyle }}'
  );

  if (
    src.includes('overlayStyle') &&
    !src.includes('overlayStyle ?') &&
    src.includes('FUNKY.fontsHref')
  ) {
    src = src.replace(
      /(<link rel="stylesheet" href=\{FUNKY\.fontsHref\} \/>)/,
      `$1\n      {overlayStyle ? (\n        <div className="absolute inset-0 pointer-events-none z-[1]" style={overlayStyle} />\n      ) : null}`
    );
  }

  if (src !== orig) {
    fs.writeFileSync(file, src);
    changed++;
    console.log('updated', rel);
  }
}

console.log('changed', changed, 'of', files.length);
