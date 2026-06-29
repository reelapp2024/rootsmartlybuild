// queues/addNewServicesQueue.js

const Bull = require('bull');
require('dotenv').config();
const axios = require('axios');

const UserProject = require('../models/userProjects');
const Service = require('../models/service');
const { upsertSeoByPageUrl } = require('../services/pageSeoService');
const slugify = require('../additional/slugify');

const { getSubcategoriesFromOpenAI } = require('../openAi/openAi');
// ✅ use the SAME helper your projectBackgroundQueue uses
const { fetchSeoContentForPage } = require('../additional/openaiHelpers');

const redisServiceDesc = require('./redisServiceDesc'); // adjust path if needed

// Redis connection
const redisHost = process.env.redisHost;
const redisPort = process.env.redisPort;
const addNewServicesQueue = new Bull('addNewServicesQueue', {
  redis: { host: redisHost, port: redisPort }
});

// FontAwesome icons metadata
const FA_ICONS_JSON_URL =
  'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/metadata/icons.json';

async function isValidFAIcon(iconClass) {
  try {
    const { data: icons } = await axios.get(FA_ICONS_JSON_URL);
    const name = iconClass.replace(/^(fas|fa)\s+fa-/, '').trim();
    return icons[name]?.styles?.includes('solid') || false;
  } catch (e) {
    console.error('[FA] icon validation error:', e.message);
    return false;
  }
}

// --- helpers ---
function normalizeKeywordsToString(src) {
  if (Array.isArray(src)) {
    return src.map(x => String(x).trim()).filter(Boolean).join(', ');
  }
  if (typeof src === 'string') {
    return src
      .split(/[,\n]/)
      .map(s => s.replace(/^[\s'"]+|[\s'"]+$/g, '').trim())
      .filter(Boolean)
      .join(', ');
  }
  return '';
}

addNewServicesQueue.process(7, async (job) => {
  const { projectId, wantAiServices = 1, services = [] } = job.data;
  console.log(`\n[addNewServicesQueue] ▶ projectId=${projectId}, wantAiServices=${wantAiServices}`);

  // 1) Load project
  const project = await UserProject.findById(projectId);
  if (!project) throw new Error(`Project ${projectId} not found`);
  const { serviceType, defaultFasFaIcon: defaultIcon, projectName, userId, focusKeyword, projectKeywordsText, categories, subCategories, microCategories } = project;
  console.log(`[addNewServicesQueue] Loaded project "${projectName}" (serviceType="${serviceType}")`);

  // Extract variables similar to projectBackgroundQueue.js
  let mainCategory = categories && categories.length > 0 ? categories[0] : serviceType || '';
  const subcategorieslist = (subCategories || []).join(', ');
  const microcategorieslist = (microCategories || []).join(', ');
  let focusCategory = microcategorieslist || subcategorieslist || '';
  const categorieslist = (categories || []).join(', ');

  // 2) Exclude existing service names
  const existingNames = await Service.find({ projectId }).distinct('name');
  console.log(`[addNewServicesQueue] Existing names count: ${existingNames.length}`);

  // 3) Build prompt
  let prompt;
  if (Number(wantAiServices) === 1) {
    const objCount = process.env.ProductionMode === 'true' ? '2 to 4' : '1 to 2';
    prompt = `
Generate a JSON array containing between ${objCount} objects. Each must follow exactly:
{
  "service_title": <unique, semantically distinct subcategory name>,
  "fas-fa-icon": <solid or brand FontAwesome class>,
  "subcategory_description": <brief description of that subcategory seo frindly around 80-90 words make sure to dont add dot . on last>,
  "contact_phone": <valid phone number>
}
Important:
- ALL service_title values MUST be unique and cover DIFFERENT aspects of "${mainCategory}".
- DO NOT append numeric suffixes (e.g. "X Service 1", "X Service 2").
- Avoid trivial variants; each name must represent a distinct service.
- EXCLUDE any names in [${existingNames.map(n => `"${n}"`).join(', ')}].
Input:
- Parent category is ${mainCategory}. Focused category is ${focusCategory || 'N/A'}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${categorieslist || 'N/A'}. Subcategories: ${subcategorieslist || 'N/A'}.
Output only the JSON array.`;
  } else {
    const manualCount = services.length;
    prompt = `
Generate a JSON array of exactly ${manualCount} objects—one for each of the provided names:
${services.map(n => `- "${n}"`).join('\n')}
Each must follow exactly:
{
  "service_title": <one of the provided names>,
  "fas-fa-icon": <valid FontAwesome class or fallback "${defaultIcon}">,
  "subcategory_description": <brief description of that subcategory seo frindly around 80-90 words make sure to dont add . dot in last>,
  "contact_phone": <valid phone number>
}
Important:
- ALL service_title values MUST be unique and semantically distinct.
- DO NOT append numeric suffixes.
- EXCLUDE any names already in [${existingNames.map(n => `"${n}"`).join(', ')}].
Input:
- Service Type: ${serviceType}
Output only the JSON array.`;
  }

  // 4) Fetch candidates from OpenAI
  let candidates;
  try {
    candidates = await getSubcategoriesFromOpenAI(prompt);
    console.log('[addNewServicesQueue] OpenAI candidates fetched');
  } catch (err) {
    console.error('[addNewServicesQueue] OpenAI error:', err.message);
    throw err;
  }

  if (!Array.isArray(candidates)) {
    console.warn('[addNewServicesQueue] Candidates not an array. Value:', candidates);
    return;
  }

  console.log('[addNewServicesQueue] Raw candidates count:', candidates.length);

  // 5) Deduplicate exact repeats by name
  const seen = new Set();
  candidates = candidates.filter(obj => {
    const name = (obj?.service_title || '').trim();
    if (!name) return false;
    if (seen.has(name.toLowerCase())) return false;
    seen.add(name.toLowerCase());
    return true;
  });

  console.log('[addNewServicesQueue] Deduped candidates count:', candidates.length);

  // 6) Validate icons and prepare inserts + save SEO via fetchSeoContentForPage
  const toInsert = [];
  const maxPerBatch = process.env.ProductionMode === 'true' ? 35 : 10;
  let processed = 0;

  for (const obj of candidates) {
    const name = (obj.service_title || '').trim();
    if (!name) continue;

    if (existingNames.includes(name)) {
      console.log(`[addNewServicesQueue] Skipping existing name: ${name}`);
      continue;
    }

    let icon = obj['fas-fa-icon'];
    if (!(await isValidFAIcon(icon))) {
      console.log(`[addNewServicesQueue] Invalid icon "${icon}" for "${name}", using default "${defaultIcon}"`);
      icon = defaultIcon;
    }

    // Prepare for Service insert
    toInsert.push({
      projectId,
      name: name.toLowerCase(),
      slug: slugify(name)
    });

    // 🔹 SEO: use SAME function as projectBackgroundQueue
    try {
      const page_url = `/services/${slugify(name)}`;
      console.log(`[SEO] Generating SEO for service "${name}" -> page_url="${page_url}"`);

      const seoContent = await fetchSeoContentForPage(
        name,                           // pageName – use the service title
        serviceType,                    // service type
        project.projectName,            // project name
        {
          userId,
          projectId,
          pageId: `service-${slugify(name)}`,
          promptFrom: 'addNewServicesQueue',
          promptFor: 'SERVICE_SEO'
        }
      );

      if (!seoContent || typeof seoContent !== 'object') {
        console.warn(`[SEO] Invalid seoContent for "${name}":`, seoContent);
      } else {
        const meta_title = (seoContent.meta_title || '').toString().trim();
        const meta_description = (seoContent.meta_description || '').toString().trim();
        const meta_keywords = normalizeKeywordsToString(seoContent.meta_keywords) || meta_title;

        console.log('[SEO] Upserting WebsitePage.seoSettings:', { page_url, meta_title, meta_description, meta_keywords });

        const savedSeo = await upsertSeoByPageUrl(projectId, page_url, {
          meta_title,
          meta_description,
          meta_keywords,
          meta_image: '',
          canonical_url: page_url,
          og_title: meta_title,
          og_description: meta_description,
        }, 'ai');

        console.log(`[SEO] ✅ Saved page SEO for "${name}"`, savedSeo ? '(ok)' : '(no matching WebsitePage)');
      }
    } catch (err) {
      console.error(`[SEO] ❌ Failed saving SEO for "${name}":`, err);
    }

    processed += 1;
    if (processed >= maxPerBatch) {
      console.log(`[addNewServicesQueue] Reached batch limit (${maxPerBatch}).`);
      break;
    }
  }

  console.log('[addNewServicesQueue] Services to insert:', toInsert.length);

  // 7) Insert new services
  if (toInsert.length) {
    try {
      const inserted = await Service.insertMany(toInsert);
      console.log(`✅ Added ${inserted.length} new services to project ${projectId}`);
    } catch (err) {
      console.error('[addNewServicesQueue] ❌ Error inserting new services:', err);
      throw err;
    }
  } else {
    console.log('[addNewServicesQueue] No new services to insert.');
  }

  // 8) Enqueue description generator
  try {
    await redisServiceDesc.add({ projectId });
    console.log('[addNewServicesQueue] ▶ Enqueued redisServiceDesc for project:', projectId);
  } catch (e) {
    console.error('[addNewServicesQueue] Failed to enqueue redisServiceDesc:', e);
  }
});

addNewServicesQueue.on('error', err => {
  console.error('[addNewServicesQueue] Queue error:', err);
});

module.exports = addNewServicesQueue;
