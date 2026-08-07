/**
 * Funky SSOT cleanup:
 * 1. Remove *ElPainted / withFunkyTextStyle force-paint after resolve
 * 2. Strip theme color keys from DNA style object literals (color: titleColor, etc.)
 * 3. Drop unused withFunkyTextStyle imports
 *
 * Runtime still strips DNA colors via resolveSectionElement / mergeFunkyElement.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../components/contentwebsitesSections');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('Funky.tsx')) acc.push(p);
  }
  return acc;
}

/** Remove `color: <themeExpr>,` / `color: <themeExpr>` from style bags. */
function stripDnaThemeColors(src) {
  // color: titleColor | textColor | f.ink | f.cream | mutedColor | accent (common theme refs)
  return src.replace(
    /,\s*color:\s*(?:titleColor|textColor|mutedColor|f\.(?:ink|cream)|accent)\b/g,
    ''
  ).replace(
    /color:\s*(?:titleColor|textColor|mutedColor|f\.(?:ink|cream)|accent)\s*,\s*/g,
    ''
  );
}

function removePaintedAliases(src) {
  // const fooElPainted: WebsiteElement = { ...fooEl, style: { ...withFunkyTextStyle(...) } };
  let out = src.replace(
    /^\s*const\s+(\w+)Painted(?:\s*:\s*WebsiteElement)?\s*=\s*\{\s*\.\.\.\1\s*,\s*style:\s*\{\s*\.\.\.withFunkyTextStyle\([^)]*\)\s*\}\s*\};?\s*\n/gm,
    ''
  );

  // Replace FooPainted → Foo (after removing declarations)
  out = out.replace(/\b(\w+)Painted\b/g, '$1');

  // Inline: style: { ...withFunkyTextStyle(itemTitle.style as any, titleColor, isLight) },
  // → keep existing element style (already resolved)
  out = out.replace(
    /style:\s*\{\s*\.\.\.withFunkyTextStyle\(\s*(\w+)\.style\s+as\s+any\s*,\s*[^)]+\)\s*\}\s*,?/g,
    ''
  );

  // After removing style line from object literals like:
  // const itemTitlePainted: WebsiteElement = {
  //   ...itemTitle,
  //   style: { ...withFunkyTextStyle(...) },
  // };
  // already handled by painted alias removal.

  // Trailing: , style: { ...withFunkyTextStyle(...) } inside object spreads
  out = out.replace(
    /,\s*style:\s*\{\s*\.\.\.withFunkyTextStyle\([^)]*\)\s*\}/g,
    ''
  );

  return out;
}

function cleanImports(src) {
  if (/\bwithFunkyTextStyle\b/.test(src)) return src;
  // Remove from import lists
  let out = src.replace(/,?\s*withFunkyTextStyle\s*,?/g, (m) => {
    // keep commas sane
    return m.includes(',') ? ',' : '';
  });
  out = out.replace(/import\s*\{[\s,]*\}\s*from\s*['"][^'"]*funkyTheme['"];?\s*\n/g, '');
  // Fix double commas / leading commas in import braces
  out = out.replace(/\{\s*,/g, '{ ').replace(/,\s*,/g, ',').replace(/,\s*\}/g, ' }');
  return out;
}

const files = walk(ROOT);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let after = removePaintedAliases(before);
  after = stripDnaThemeColors(after);
  after = cleanImports(after);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
    console.log('updated', path.relative(ROOT, file));
  }
}
console.log(`Done. ${changed}/${files.length} Funky files updated.`);
