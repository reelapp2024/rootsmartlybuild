import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filePath = path.join(__dirname, '../components/sections/ElementsSection.tsx');
let s = fs.readFileSync(filePath, 'utf8');

const arrayItemPattern =
  /(\s+)contentEditable=\{!readOnly\}\s+suppressContentEditableWarning=\{!readOnly\}\s+onBlur=\{!readOnly \? \(e: any\) => handleArrayContentUpdate\(id, '([^']+)', i, '([^']+)', e\.currentTarget\.innerHTML\) : undefined\}\s+dangerouslySetInnerHTML=\{\{ __html: ([^}]+(?:\}[^}])?) \}\}/g;

let arrayCount = 0;
s = s.replace(arrayItemPattern, (match, indent, arrayKey, itemKey, htmlExpr) => {
  arrayCount++;
  return (
    `${indent}ref={bindHtml(\`\${id}-item-\${i}\`, ${htmlExpr})}` +
    `${indent}contentEditable={!readOnly}` +
    `${indent}{...editHandlers(\`\${id}-item-\${i}\`, (html) => handleArrayContentUpdate(id, '${arrayKey}', i, '${itemKey}', html))}`
  );
});

const patterns = [
  [
    /(\s+)contentEditable=\{!readOnly\}\s+suppressContentEditableWarning=\{!readOnly\}\s+onBlur=\{!readOnly \? \(e: any\) => handleContentUpdate\(id, '([^']+)', e\.currentTarget\.innerHTML\) : undefined\}\s+dangerouslySetInnerHTML=\{\{ __html: ([^}]+(?:\}[^}])?) \}\}/g,
    (indent, key, htmlExpr) =>
      `${indent}ref={bindHtml(id, ${htmlExpr})}${indent}contentEditable={!readOnly}${indent}{...editHandlers(id, (html) => handleContentUpdate(id, '${key}', html))}`,
  ],
  [
    /(\s+)contentEditable=\{!readOnly\}\s+suppressContentEditableWarning=\{!readOnly\}\s+onBlur=\{!readOnly \? \(e\) => handleContentUpdate\(id, '([^']+)', e\.currentTarget\.innerHTML\) : undefined\}\s+dangerouslySetInnerHTML=\{\{ __html: ([^}]+(?:\}[^}])?) \}\}/g,
    (indent, key, htmlExpr) =>
      `${indent}ref={bindHtml(id, ${htmlExpr})}${indent}contentEditable={!readOnly}${indent}{...editHandlers(id, (html) => handleContentUpdate(id, '${key}', html))}`,
  ],
  [
    / contentEditable=\{!readOnly\} suppressContentEditableWarning=\{!readOnly\} onBlur=\{!readOnly \? \(e\) => handleContentUpdate\(id, '([^']+)', e\.currentTarget\.innerHTML\) : undefined\} dangerouslySetInnerHTML=\{\{ __html: ([^}]+(?:\}[^}])?) \}\}/g,
    (key, htmlExpr) =>
      ` ref={bindHtml(id, ${htmlExpr})} contentEditable={!readOnly} {...editHandlers(id, (html) => handleContentUpdate(id, '${key}', html))}`,
  ],
  [
    / contentEditable=\{!readOnly\} suppressContentEditableWarning=\{!readOnly\} onBlur=\{!readOnly \? \(e: any\) => handleContentUpdate\(id, '([^']+)', e\.currentTarget\.textContent \|\| ''\) : undefined\}/g,
    (key) =>
      ` ref={bindHtml(id, String((content as any).buttonText || ibBtnText || ''))} contentEditable={!readOnly} {...editHandlers(id, (html) => handleContentUpdate(id, '${key}', html))}`,
  ],
];

let total = 0;
for (const [re, replacer] of patterns) {
  s = s.replace(re, (...args) => {
    total++;
    const groups = args.slice(1, -2);
    return typeof replacer === 'function' ? replacer(...groups) : replacer;
  });
}

fs.writeFileSync(filePath, s);
const remaining = (s.match(/dangerouslySetInnerHTML/g) || []).length;
console.log('patched blocks:', total, 'array items:', arrayCount, 'remaining dangerouslySetInnerHTML:', remaining);
