/**
 * Second pass: strip theme color keys from:
 * - `const fooStyle = { ... }` bags used as element.style DNA
 * - mergeDynamicElement 5th-arg style objects
 * Does not touch themeColors = { ... } or JSX style={{ }}.
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.join(__dirname, '../components/sections'),
  path.join(__dirname, '../components/contentwebsitesSections'),
];

const SKIP = new Set(['ElementsSection.tsx', 'CanvasFreeform.tsx']);

const COLOR_KEYS = new Set([
  'color', 'backgroundColor', 'borderColor', 'titleColor', 'descriptionColor',
  'textColor', 'subheadingColor', 'secondaryHeadingColor', 'iconColor',
  'iconBackgroundColor', 'iconBgColor', 'linkColor', 'markerColor', 'hoverColor',
  'activeColor', 'accentColor', 'highlightColor', 'highlightTextColor',
  'quoteColor', 'verifiedColor', 'replyAuthorColor', 'labelColor', 'inactiveColor',
  'activeTextColor', 'activeBackgroundColor', 'activeBorderColor', 'activeTitleColor',
  'hoverBackgroundColor', 'dividerColor', 'gradientFrom', 'gradientTo',
  'dropCapColor', 'kickerColor', 'overlayColor',
]);

const THEME_VAL_RE =
  /^(?:titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBorder|cardBg|titleColorOverride|f\.[A-Za-z0-9_]+|tc\?\.[A-Za-z0-9_.?]+|lc\.[A-Za-z0-9_]+|`\$\{[^}]+\}[^`]*`|'transparent'|"transparent")$/;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name) && !SKIP.has(e.name)) acc.push(p);
  }
  return acc;
}

function matchingBrace(src, openIdx) {
  let depth = 0;
  let inStr = null;
  let escaped = false;
  for (let i = openIdx; i < src.length; i++) {
    const ch = src[i];
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
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function splitProps(body) {
  const props = [];
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /[\s,]/.test(body[i])) i++;
    if (i >= body.length) break;
    const keyMatch = body.slice(i).match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:/);
    if (!keyMatch) {
      i++;
      continue;
    }
    const key = keyMatch[1];
    const keyStart = i;
    i += keyMatch[0].length;
    while (i < body.length && /\s/.test(body[i])) i++;
    let depth = 0;
    let inStr = null;
    let escaped = false;
    const valueStart = i;
    for (; i < body.length; i++) {
      const ch = body[i];
      const next = body[i + 1];
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
      if (ch === '{' || ch === '(' || ch === '[') {
        depth++;
        continue;
      }
      if (ch === '}' || ch === ')' || ch === ']') {
        if (depth > 0) depth--;
        continue;
      }
      if (depth === 0 && (ch === ',' || ch === '\n')) break;
    }
    const rawVal = body.slice(valueStart, i).trim().replace(/,\s*$/, '').trim();
    props.push({ key, value: rawVal, start: keyStart, end: i });
  }
  return props;
}

function isThemeValue(val) {
  const v = val.trim().replace(/ as any$/, '').trim();
  // Object shorthand `titleColor` (meaning titleColor: titleColor)
  if (/^(?:titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBorder|cardBg)$/.test(v)) return true;
  return THEME_VAL_RE.test(v);
}

function cleanBody(body) {
  const props = splitProps(body);
  const remove = props.filter((p) => COLOR_KEYS.has(p.key) && isThemeValue(p.value));
  if (!remove.length) return null;
  let out = body;
  for (const p of remove.sort((a, b) => b.start - a.start)) {
    let start = p.start;
    let end = p.end;
    while (end < out.length && /\s/.test(out[end])) end++;
    if (out[end] === ',') end++;
    else {
      let s = start - 1;
      while (s >= 0 && /\s/.test(out[s])) s--;
      if (out[s] === ',') start = s;
    }
    out = out.slice(0, start) + out.slice(end);
  }
  return out.replace(/,\s*,/g, ',').replace(/^\s*,/, '').replace(/,\s*$/, '');
}

function processNamedStyleConsts(src) {
  let out = '';
  let i = 0;
  const re = /\bconst\s+(\w*[Ss]tyle\w*)\s*(?::[^=]+)?=\s*\{/g;
  while (true) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) {
      out += src.slice(i);
      break;
    }
    // Skip themeColors-like names
    if (/themeColors/i.test(m[1])) {
      out += src.slice(i, m.index + m[0].length);
      i = m.index + m[0].length;
      continue;
    }
    const openBrace = m.index + m[0].length - 1;
    const close = matchingBrace(src, openBrace);
    if (close < 0) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, openBrace + 1);
    const body = src.slice(openBrace + 1, close);
    const cleaned = cleanBody(body);
    out += cleaned != null ? cleaned : body;
    out += '}';
    i = close + 1;
  }
  return out;
}

/**
 * mergeDynamicElement(..., { color: titleColor, fontSize: '...' })
 * 5th arg is often a bare object — strip theme color keys inside call.
 */
function processMergeDynamicFifthArgs(src) {
  // Heuristic: after mergeDynamicElement( ... find style-like trailing objects with color: titleColor
  // Safer: strip from any `,\n    { color: titleColor` patterns that aren't themeColors
  return src.replace(
    /mergeDynamicElement\(([\s\S]*?)\)/g,
    (full, inner) => {
      // Find last top-level `{...}` in args (the style arg when present)
      // Simple approach: clean all `{ color: titleColor` theme props inside the call
      let cleaned = inner;
      const propsRe =
        /\b(color|backgroundColor|borderColor|titleColor|iconColor|hoverColor|activeColor|iconBackgroundColor)\s*:\s*(titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBorder|`\$\{[^}]+\}[^`]*`)\s*,?\s*/g;
      cleaned = cleaned.replace(propsRe, '');
      cleaned = cleaned.replace(/,\s*,/g, ',').replace(/\{\s*,/g, '{ ').replace(/,\s*\}/g, ' }');
      return `mergeDynamicElement(${cleaned})`;
    }
  );
}

const files = ROOTS.flatMap((r) => walk(r));
let n = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  if (!/iconColor:\s*accent|titleColor,|color:\s*titleColor|Style\s*=\s*\{/.test(before)) continue;
  let after = processNamedStyleConsts(before);
  after = processMergeDynamicFifthArgs(after);
  if (after !== before) {
    fs.writeFileSync(file, after);
    n++;
    console.log('cleaned', path.relative(path.join(__dirname, '..'), file));
  }
}
console.log(`Done. ${n} files cleaned (pass 2).`);
