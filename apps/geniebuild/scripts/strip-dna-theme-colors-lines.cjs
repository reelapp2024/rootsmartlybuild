/** Line-based cleanup of remaining DNA theme color props (not JSX style={{). */
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

const LINE_RES = [
  /^\s*(color|backgroundColor|borderColor|titleColor|descriptionColor|iconColor|iconBackgroundColor|iconBgColor|hoverColor|activeColor|highlightColor|activeBackgroundColor|activeBorderColor|activeTitleColor|hoverBackgroundColor|dividerColor)\s*:\s*(titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBg|cardBorder|f\.\w+)\s*,?\s*$/,
  /^\s*(color|backgroundColor|borderColor|titleColor|iconColor|iconBackgroundColor|iconBgColor|activeBackgroundColor|activeBorderColor)\s*:\s*`\$\{(?:accent|titleColor|btnBg)[^}]*\}[^`]*`\s*,?\s*$/,
  /^\s*(titleColor|textColor|accent|btnBg|btnText)\s*,\s*$/,
];

let n = 0;
for (const f of ROOTS.flatMap((r) => walk(r))) {
  const lines = fs.readFileSync(f, 'utf8').split(/\n/);
  let changed = false;
  const out = [];
  let themeColorsDepth = 0;
  for (const L of lines) {
    if (/style=\{\{/.test(L)) {
      out.push(L);
      continue;
    }
    // Track crude themeColors = { ... } blocks so we don't strip theme token bags
    if (/\bthemeColors\b/.test(L) && /\{/.test(L)) themeColorsDepth += (L.match(/\{/g) || []).length - (L.match(/\}/g) || []).length;
    else if (themeColorsDepth > 0) {
      themeColorsDepth += (L.match(/\{/g) || []).length - (L.match(/\}/g) || []).length;
      out.push(L);
      continue;
    }

    let drop = false;
    for (const re of LINE_RES) {
      if (re.test(L)) {
        drop = true;
        break;
      }
    }
    if (drop) {
      changed = true;
      continue;
    }
    out.push(L);
  }
  if (changed) {
    fs.writeFileSync(f, out.join('\n'));
    n++;
    console.log('cleaned', path.relative(path.join(__dirname, '..'), f));
  }
}
console.log(`Done. ${n} files (line pass).`);
