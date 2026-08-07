/**
 * Strip theme-owned color keys from DNA `style: { ... }` bags only.
 * Does NOT touch JSX chrome `style={{ ... }}`.
 */
const fs = require('fs');
const path = require('path');

const ROOTS = [
  path.join(__dirname, '../components/sections'),
  path.join(__dirname, '../components/contentwebsitesSections'),
];

const SKIP = new Set([
  'ElementsSection.tsx',
  'ElementsSection.ts',
  'editableHtmlHelpers.ts',
  'flushEditableForSave.ts',
  'StatCardValue.tsx',
  'SectionRouter.tsx',
  'sectionDiscovery.ts',
  'CanvasFreeform.tsx',
]);

const COLOR_KEYS = new Set([
  'color',
  'backgroundColor',
  'borderColor',
  'titleColor',
  'descriptionColor',
  'textColor',
  'subheadingColor',
  'secondaryHeadingColor',
  'iconColor',
  'iconBackgroundColor',
  'iconBgColor',
  'linkColor',
  'markerColor',
  'hoverColor',
  'activeColor',
  'accentColor',
  'highlightColor',
  'highlightTextColor',
  'quoteColor',
  'verifiedColor',
  'replyAuthorColor',
  'labelColor',
  'inactiveColor',
  'activeTextColor',
  'activeBackgroundColor',
  'activeBorderColor',
  'activeTitleColor',
  'hoverBackgroundColor',
  'dividerColor',
  'gradientFrom',
  'gradientTo',
  'dropCapColor',
  'kickerColor',
  'overlayColor',
]);

const THEME_VAL_RE = /^(?:titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBorder|cardBg|f\.[A-Za-z0-9_]+|tc\?\.[A-Za-z0-9_.?]+|lc\.[A-Za-z0-9_]+|`\$\{[^}]+\}[^`]*`|'transparent'|"transparent")$/;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name) && !e.name.endsWith('.d.ts') && !SKIP.has(e.name)) acc.push(p);
  }
  return acc;
}

/** Find matching `}` for `{` at openIdx (exclusive of nested braces/strings). */
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

/**
 * Split a style object body into top-level `key: value` props.
 * Returns array of { key, full, start, end } relative to body.
 */
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

    let valueStart = i;
    let depth = 0;
    let inStr = null;
    let escaped = false;
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
      if (ch === '/' && next === '/') {
        i += 2;
        while (i < body.length && body[i] !== '\n') i++;
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
      if (depth === 0 && (ch === ',' || ch === '\n')) {
        break;
      }
    }
    const valueEnd = i;
    const rawVal = body.slice(valueStart, valueEnd).trim().replace(/,\s*$/, '').trim();
    props.push({ key, value: rawVal, start: keyStart, end: valueEnd });
  }
  return props;
}

function isThemeValue(val) {
  const v = val.trim().replace(/ as any$/, '').trim();
  return THEME_VAL_RE.test(v);
}

function cleanStyleBody(body) {
  const props = splitProps(body);
  const keep = props.filter((p) => !(COLOR_KEYS.has(p.key) && isThemeValue(p.value)));
  if (keep.length === props.length) return null;

  // Rebuild from original body by removing unwanted prop spans (from end)
  const remove = props.filter((p) => COLOR_KEYS.has(p.key) && isThemeValue(p.value));
  let out = body;
  for (const p of remove.sort((a, b) => b.start - a.start)) {
    let start = p.start;
    let end = p.end;
    // include trailing comma
    while (end < out.length && /\s/.test(out[end])) end++;
    if (out[end] === ',') end++;
    // or leading comma if no trailing
    if (out[p.end] !== ',' && start > 0) {
      let s = start - 1;
      while (s >= 0 && /\s/.test(out[s])) s--;
      if (out[s] === ',') start = s;
    }
    out = out.slice(0, start) + out.slice(end);
  }
  out = out.replace(/,\s*,/g, ',').replace(/^\s*,/, '').replace(/,\s*$/, '');
  return out;
}

function stripDnaStyles(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    // Match `style:` then optional whitespace then `{` — but NOT `style={{`
    const rest = src.slice(i);
    const m = rest.match(/\bstyle\s*:\s*\{/);
    if (!m || m.index == null) {
      out += src.slice(i);
      break;
    }
    const abs = i + m.index;
    // If this is actually JSX style={{ — the match would be style: { of style={{
    // Check char before match isn't `{` of `{{` — look at pattern: style={{ means
    // after `style:` we have `{{`. Our regex is `style\s*:\s*\{` which matches the
    // first `{` of `{{`. Detect by peeking next char after matched `{`.
    const openBrace = abs + m[0].length - 1;
    if (src[openBrace + 1] === '{') {
      // JSX style={{ — skip past this occurrence without cleaning
      out += src.slice(i, openBrace + 1);
      i = openBrace + 1;
      continue;
    }

    const close = matchingBrace(src, openBrace);
    if (close < 0) {
      out += src.slice(i);
      break;
    }
    out += src.slice(i, openBrace + 1);
    const body = src.slice(openBrace + 1, close);
    const cleaned = cleanStyleBody(body);
    out += cleaned != null ? cleaned : body;
    out += '}';
    i = close + 1;
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(r));
let n = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  if (!/\bstyle\s*:\s*\{/.test(before)) continue;
  if (!/(?:titleColor|textColor|accent|btnBg|btnText|mutedColor|cardBorder|iconColor)/.test(before)) continue;
  const after = stripDnaStyles(before);
  if (after !== before) {
    fs.writeFileSync(file, after);
    n++;
    console.log('cleaned', path.relative(path.join(__dirname, '..'), file));
  }
}
console.log(`Done. ${n} files cleaned.`);
