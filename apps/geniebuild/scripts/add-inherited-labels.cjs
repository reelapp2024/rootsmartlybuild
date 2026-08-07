/**
 * Add "(Inherited)" ColorInput labels across Wave B–D StylesBlocks.
 * Uses onUpdate('key', ...) to know which style key gates the Inherited label.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../components/builder/style-editor');
const skip = new Set([
  'HeadingStylesBlock.tsx',
  'TextStylesBlock.tsx',
  'ButtonStylesBlock.tsx',
  'BadgeStylesBlock.tsx',
  'FeatureBoxStylesBlock.tsx',
  'NavMenuStylesBlock.tsx',
]);

function transformFile(filePath) {
  let src = fs.readFileSync(filePath, 'utf8');
  let changed = 0;

  // Match ColorInput elements (self-closing, possibly multiline)
  src = src.replace(/<ColorInput\b([\s\S]*?)\/>/g, (full, attrs) => {
    if (attrs.includes('(Inherited)')) return full;
    if (/label=\{/.test(attrs) && !/label="/.test(attrs) && !/label='/.test(attrs)) {
      // already dynamic label — leave alone unless static string inside
      return full;
    }

    const labelMatch = attrs.match(/\blabel=(["'])([^"']+)\1/);
    if (!labelMatch) return full;
    const quote = labelMatch[1];
    const labelText = labelMatch[2];
    if (labelText.includes('(Inherited)')) return full;

    // Prefer onUpdate('key' — most reliable for which style field is written
    const updateMatch =
      attrs.match(/onUpdate\(\s*['"]([a-zA-Z0-9_]+)['"]/) ||
      attrs.match(/onChange=\{\(v\)\s*=>\s*onUpdate\(\s*['"]([a-zA-Z0-9_]+)['"]/);

    // Fallback: styles.key in value=
    const stylesMatch = attrs.match(/value=\{styles\.([a-zA-Z0-9_]+)/);

    const key = (updateMatch && updateMatch[1]) || (stylesMatch && stylesMatch[1]);
    if (!key) return full;

    const newLabel = `label={styles.${key} ? ${quote}${labelText}${quote} : ${quote}${labelText} (Inherited)${quote}}`;
    const nextAttrs = attrs.replace(labelMatch[0], newLabel);
    changed += 1;
    return `<ColorInput${nextAttrs}/>`;
  });

  if (changed) fs.writeFileSync(filePath, src, 'utf8');
  return changed;
}

let total = 0;
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('StylesBlock.tsx') || skip.has(f)) continue;
  const n = transformFile(path.join(dir, f));
  if (n) {
    console.log(`${f}: ${n}`);
    total += n;
  }
}
console.log(JSON.stringify({ total }));
