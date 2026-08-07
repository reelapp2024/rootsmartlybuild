/**
 * Migrate: section.elements?.find(e => e.id === ...) || DNA
 *       →  resolveSectionElement(section, DNA)
 *
 * Adds the closing `)` for the function call. Strips theme colors at runtime
 * via resolveSectionElement even if DNA literals still mention color keys.
 */
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
    else if (/\.(tsx|ts)$/.test(e.name) && !e.name.endsWith('.d.ts')) acc.push(p);
  }
  return acc;
}

function relImport(fromFile) {
  const elementsDir = path.join(__dirname, '../elements');
  let rel = path.relative(path.dirname(fromFile), elementsDir).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = './' + rel;
  return rel;
}

/** Find end index (exclusive) of a JS expression starting at `start`. */
function expressionEnd(src, start) {
  let i = start;
  while (i < src.length && /\s/.test(src[i])) i++;

  // Optional leading '(' for `({ ... } as Type)`
  const stack = [];
  let inStr = null;
  let escaped = false;

  for (; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];

    if (inStr) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        escaped = true;
        continue;
      }
      if (ch === inStr) inStr = null;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch;
      continue;
    }
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 1;
      continue;
    }

    if (ch === '{' || ch === '(' || ch === '[') {
      stack.push(ch);
      continue;
    }
    if (ch === '}' || ch === ')' || ch === ']') {
      const open = stack.pop();
      const ok =
        (ch === '}' && open === '{') ||
        (ch === ')' && open === '(') ||
        (ch === ']' && open === '[');
      if (!ok && !open) {
        // Extra closer — expression ended before this
        return i;
      }
      if (stack.length === 0) {
        // Consumed outer object/paren — check for ` as Type` cast
        let j = i + 1;
        while (j < src.length && /\s/.test(src[j])) j++;
        if (src.slice(j, j + 2) === 'as' && /\s/.test(src[j + 2] || ' ')) {
          j += 2;
          while (j < src.length && /\s/.test(src[j])) j++;
          // type name / expression until delimiter
          while (j < src.length && /[A-Za-z0-9_$.<>|]/.test(src[j])) j++;
          // optional trailing ) if we started with (
          while (j < src.length && /\s/.test(src[j])) j++;
          if (src[j] === ')') j++;
          return j;
        }
        return i + 1;
      }
      continue;
    }

    // Expression terminator when stack empty and we already started
    if (stack.length === 0 && i > start) {
      // We haven't opened anything yet — shouldn't happen if DNA starts with { or (
      if (ch === ';' || ch === ',' || ch === ')' || ch === ']' || ch === '}') {
        return i;
      }
    }
  }
  return src.length;
}

function transformFile(src, filePath) {
  const findRe =
    /section\.elements\??\.find\(\s*\(?\s*e\s*\)?\s*=>\s*e\.id\s*===\s*[^)]+\)\s*\|\|\s*/g;

  let out = '';
  let last = 0;
  let hits = 0;
  let m;

  while ((m = findRe.exec(src))) {
    hits += 1;
    out += src.slice(last, m.index);
    out += 'resolveSectionElement(section, ';
    const dnaStart = m.index + m[0].length;
    const dnaEnd = expressionEnd(src, dnaStart);
    out += src.slice(dnaStart, dnaEnd);
    out += ')';
    last = dnaEnd;
    findRe.lastIndex = dnaEnd;
  }
  out += src.slice(last);

  if (!hits) return { out: src, hits: 0 };

  const importPath = relImport(filePath);
  const importLine = `import { resolveSectionElement } from '${importPath}';`;

  if (!/import\s*\{[^}]*resolveSectionElement[^}]*\}\s*from/.test(out)) {
    // Insert after import block
    const lines = out.split('\n');
    let lastImportLine = -1;
    for (let i = 0; i < Math.min(lines.length, 120); i++) {
      if (/^import\s/.test(lines[i])) {
        let j = i;
        while (j < lines.length && !/from\s+['"][^'"]+['"]/.test(lines[j])) j++;
        lastImportLine = j;
        i = j;
      }
    }
    if (lastImportLine >= 0) {
      lines.splice(lastImportLine + 1, 0, importLine);
      out = lines.join('\n');
    } else {
      out = importLine + '\n' + out;
    }
  }

  return { out, hits };
}

let filesChanged = 0;
let totalHits = 0;
const changed = [];

for (const root of ROOTS) {
  for (const file of walk(root)) {
    if (file.includes(`${path.sep}ElementsSection.tsx`)) continue;
    if (file.includes(`${path.sep}canvas${path.sep}`)) continue;
    if (file.includes('sectionBackground')) continue;
    if (file.includes(`${path.sep}elements${path.sep}`)) continue;

    const src = fs.readFileSync(file, 'utf8');
    if (!/section\.elements\??\.find\(/.test(src)) continue;

    const { out, hits } = transformFile(src, file);
    if (!hits || out === src) continue;

    fs.writeFileSync(file, out, 'utf8');
    filesChanged += 1;
    totalHits += hits;
    changed.push(path.relative(path.join(__dirname, '..'), file) + ` (${hits})`);
  }
}

console.log(JSON.stringify({ filesChanged, totalHits, changed }, null, 2));
