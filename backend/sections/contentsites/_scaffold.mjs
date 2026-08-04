/**
 * One-shot scaffold: backend/sections/contentsites/{page}/{section}/{section}Section.js
 * Run: node backend/sections/contentsites/_scaffold.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = __dirname;

const pages = {
  homepage: [
    'hero',
    'featuredposts',
    'categoriesgrid',
    'trendingpins',
    'aboutteaser',
    'authors',
    'seasonalspotlight',
    'pinboardcta',
    'newsletter',
    'faq',
  ],
  blog: ['bloghero', 'categoryfilter', 'postgrid', 'popularposts', 'newsletter'],
  category: ['categoryhero', 'postgrid', 'relatedcategories'],
  article: [
    'articlehero',
    'articlebody',
    'shopthelook',
    'authorbox',
    'relatedposts',
    'pincta',
    'faq',
  ],
  about: ['abouthero', 'brandstory', 'brandvoice', 'authors', 'aboutcta'],
  contact: ['contacthero', 'contactform', 'contactinfo'],
  author: ['authorhero', 'authorbio', 'authorposts'],
  legal: ['privacybody', 'termsbody', 'disclaimerbody'],
  headerfooter: ['header', 'footer'],
};

function promptTemplate(page, sectionId) {
  return `/**
 * Content-site section prompt — ${page} / ${sectionId}
 * projectType = 2. Live article body/author prefer Blog + Author collections.
 */

const { IMAGE_PROMPT_JSON_RULES } = require("../../../sectionImagePrompts");

module.exports = {
  id: "${sectionId}",
  pageScope: "contentsites/${page}",
  imageCount: 0,
  schema: {
    title: "string",
    subtitle: "string",
    body: "string",
    items: [{ title: "string", description: "string", link: "string" }],
  },
  prompt(ctx) {
    const { project, extraData = {} } = ctx;
    const projectName = project.projectName || "";
    const niche = project.focusKeyword || project.serviceType || extraData.nicheName || "";
    const category = project.serviceType || extraData.categoryName || "";
    return \`
Create CONTENT for a niche CONTENT WEBSITE section.

Section: ${sectionId}
Page: ${page}
Site: \${projectName}
Niche: \${niche}
Catalog category: \${category}
Goal: \${project.contentGoal || "Pinterest Traffic"}

Extra:
\${JSON.stringify(extraData)}

Return STRICT JSON ONLY:
{
  "title": "short punchy heading",
  "subtitle": "1 supporting sentence",
  "body": "optional short paragraph",
  "items": [
    { "title": "card title", "description": "1 line", "link": "#" }
  ]
}

RULES:
- Match the niche voice (visual, pin-worthy, helpful).
- No phone/email. No invented URLs (use "#").
- JSON only.
\${IMAGE_PROMPT_JSON_RULES}
\`;
  },
};
`;
}

let created = 0;
for (const [page, sections] of Object.entries(pages)) {
  for (const sectionId of sections) {
    const dir = path.join(root, page, sectionId);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${sectionId}Section.js`);
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, promptTemplate(page, sectionId), 'utf8');
      created += 1;
    }
  }
}
console.log(`scaffolded ${created} files under ${root}`);
