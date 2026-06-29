const Bull = require('bull');
require('dotenv').config();
const axios = require('axios');
const UserProject = require('../models/userProjects');
const Service = require('../models/service');
const { getResponseFromOpenAI } = require('../openAi/openAi');
const slugify = require("../additional/slugify");
const WebsiteSection = require('../models/websiteSections');
const AreaServicesData = require('../models/AreaServicesData');
const { upsertSeoByPageUrl } = require('../services/pageSeoService');
const Country = require("../models/adminCountires");
const State = require("../models/adminStates");
const City = require("../models/adminCities");
const LocalArea = require('../models/adminLocalAreas');
const BusinessLocation = require('../models/businessLocation');
const redisHost = process.env.redisHost;
const redisPort = process.env.redisPort;
const https = require('https');
const sharp = require('sharp');
const helper = require('../additional/addon');
const path = require('path');
const fs = require('fs'); 
const { fetchJSONFromOpenAI, fetchStringFromOpenAI } = require('../additional/openaiHelpers');
const fetchFreepikImagesTracked = require('../additional/freePik');
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

const generateServiceDescQueue = new Bull('generateServiceDescQueue', {
  redis: { host: redisHost, port: redisPort },
});

const MAX_OPENAI_RETRIES = 3;

const FREEPIK_HOSTS_ALLOW = new Set(['img.freepik.com', 'images.freepik.com']);

// BASE_URL for services - must be apis.smartlybuild.dev
const BASE_URL = process.env.BASE_URL || 'https://apis.smartlybuild.dev';

function normalizeFreepikUrl(raw) {
  try {
    const u = new URL(raw);
    if (!FREEPIK_HOSTS_ALLOW.has(u.hostname)) u.hostname = 'img.freepik.com';
    u.protocol = 'https:';
    u.port = '';
    return u.toString();
  } catch {
    return raw;
  }
}

async function fetchImageBuffer(url) {
  const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
    'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Referer': 'https://www.freepik.com/'
  };

  const tryOnce = () =>
    axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 30000,
      maxRedirects: 5,
      httpsAgent,
      headers,
      validateStatus: s => s >= 200 && s < 400
    });

  try {
    return await tryOnce();
  } catch (e) {
    const nurl = normalizeFreepikUrl(url);
    if (nurl !== url) {
      return await axios.get(nurl, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 5,
        httpsAgent,
        headers,
        validateStatus: s => s >= 200 && s < 400
      });
    }
    throw e;
  }
}

async function retry(fn, attempts = 3, label = '') {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`${label} attempt ${i} failed:`, err.message);
    }
  }
  throw lastError;
}

async function fetchFreepikImages(serviceName, serviceType) {
  const term = [serviceName, serviceType].filter(Boolean).join(' ');
  console.log(`[Freepik] searching for images with term: "${term}"`);
  let projectId = "services";

  const res = await retry(
    () =>
      axios.get('https://api.freepik.com/v1/resources', {
        headers: { 'x-freepik-api-key': FREEPIK_API_KEY },
        params: {
          order: 'relevance',
          'filters[orientation][landscape]': 1,
          page: 1,
          limit: 5,
          term: `Real looking ${term}`,
        },
      }),
    3,
    'FreepikFetch'
  );

  console.log('Freepik status:', res.status);
  const items = (res.data && res.data.data) || [];
  if (!items.length) {
    console.warn('No Freepik images returned — check your key, endpoint, or quota');
    return [];
  }

  const folderPath = `public/images/${projectId}`;
  const WEBP_OPTS = {
    quality: 93,
    alphaQuality: 100,
    effort: 6,
    smartSubsample: true,
  };

  const uploaded = await Promise.all(
    items.map(async (item) => {
      const rawUrl = item?.image?.source?.url;
      if (!rawUrl) return null;

      try {
        const safeUrl = normalizeFreepikUrl(rawUrl);
        const host = new URL(safeUrl).hostname;
        if (!FREEPIK_HOSTS_ALLOW.has(host)) {
          console.warn('Skipping non-allowed host:', host, 'for', safeUrl);
          return null;
        }

        const imgResp = await fetchImageBuffer(safeUrl);
        const origBuf = Buffer.from(imgResp.data);

        // Convert to WebP using sharp (async/await with proper error handling)
        const webpBuf = await sharp(origBuf, { failOnError: false })
          .rotate()
          .webp(WEBP_OPTS)
          .toBuffer();

        // Verify WebP conversion was successful
        if (!webpBuf || webpBuf.length === 0) {
          throw new Error('WebP conversion failed - empty buffer');
        }

        // Build file object with buffer (simple and reliable)
        const file = {
          name: `${Date.now()}.webp`,
          mimetype: 'image/webp',
          size: webpBuf.length,
          buffer: webpBuf  // Pass buffer directly - no streams needed
        };

        // Upload file - only proceeds if file is successfully saved
        const fileName = await helper.uploadFile(file, folderPath, imgResp);
        
        // Verify file actually exists on disk before constructing URL
        const physicalPath = path.join(__dirname, '../', folderPath, fileName);
        if (!fs.existsSync(physicalPath)) {
          console.error(`[Services/Freepik] ❌ File missing after upload: ${physicalPath}`);
          throw new Error('File was not saved to disk');
        }
        
        // Ensure proper URL construction - BASE_URL is https://apis.smartlybuild.dev for services
        const filePath = `${BASE_URL}/images/${projectId}/${fileName}`;
        console.log(`[Services/Freepik] ✅ Image URL saved to DB: ${filePath}`);

        // Only return URL if upload was successful and file exists
        return {
          description: rawUrl,
          url: filePath
        };
      } catch (err) {
        console.error('Freepik image failed:', err?.message || err);
        return null;
      }
    })
  );

  return uploaded.filter(Boolean);
}

async function fetchStepsIcons(htmlSteps, service_name = '', areaName = '', extra = {}) {
  const prompt = `
    Based on these steps: ${htmlSteps}
    Output a JSON array of objects like:
    [
      { "stepName": "…", "iconClass": "fas fa-…", "serviceDescription": "…" }
    ]
    Each serviceDescription should be around 15-20 words only.
    Output only the JSON array.
  `;
  return fetchJSONFromOpenAI(
    prompt,
    'StepsIcons',
    {
      ...extra,
      promptFor: 'StepsIcons'
    }
  );
}

async function fetchDynamicServiceGroups(service_name, projectInfo, areaName = '', areaId = '', isAreaPage = false) {
  async function fetchOneGroup({ usedTitles }) {
    const locationContext = isAreaPage ? ` in ${areaName}` : '';
    const singlePrompt = `
      Create ONE service group for the service "${service_name}"${locationContext} under project "${projectInfo.projectName}" (category: ${projectInfo.serviceType}).
      Return JSON object only with keys:
      {
        "groupTitle": "unique, relevant title different from [${[...usedTitles].join(', ')}]",
        "items": [ { "title": "...", "iconClass": "fas fa-..." }, { ... } ]
      }
      - groupTitle must be highly relevant to the service type "${projectInfo.serviceType}" and unique.
      - items length must be between 5 and 8.
      - iconClass must be valid Font Awesome solid class (starts with "fas fa-").
      - The groupTitle MUST NOT duplicate any provided titles.
      - Ensure content is tailored to ${projectInfo.serviceType}${locationContext}.
      Output only the JSON object.
    `;
    const obj = await fetchJSONFromOpenAI(
      singlePrompt,
      'ServiceGroupSingle',
      {
        userId: projectInfo.userId,
        projectId: projectInfo._id,
        pageId: isAreaPage ? `area-${areaId}` : service_name,
        promptFrom: 'generateServiceDescQueue',
        promptFor: 'ServiceGroupSingle'
      }
    );
    const groupTitle = String(obj?.groupTitle || obj?.title || obj?.name || '').trim();
    const itemsRaw = Array.isArray(obj?.items) ? obj.items : (Array.isArray(obj?.services) ? obj.services : []);
    const items = itemsRaw
      .map(x => ({ title: String(x?.title || x?.name || '').trim(), iconClass: String(x?.iconClass || x?.icon || '').trim() }))
      .filter(x => x.title && /^fas fa-/.test(x.iconClass));
    if (!groupTitle || usedTitles.has(groupTitle) || items.length < 5) {
      throw new Error('Invalid group shape, duplicate title, or insufficient items');
    }
    return { groupTitle, items: items.slice(0, 8) };
  }

  async function buildFourGroups() {
    const groups = [];
    const used = new Set();
    let attempts = 0;
    while (groups.length < 4 && attempts < 16) {
      attempts++;
      try {
        const g = await fetchOneGroup({ usedTitles: used });
        used.add(g.groupTitle);
        groups.push(g);
      } catch (e) {
        console.warn(`Attempt ${attempts} failed: ${e.message}`);
      }
    }
    if (groups.length !== 4) throw new Error(`Could not build 4 unique groups, got ${groups.length}`);
    return groups;
  }

  try {
    return await buildFourGroups();
  } catch (e) {
    console.warn(`⚠️ Failed to generate 4 dynamic service groups for "${service_name}"${isAreaPage ? ` in ${areaName}` : ''}:`, e.message);
    return [];
  }
}

generateServiceDescQueue.process(10, async (job) => {
  const { projectId, worktype, locations } = job.data;

  if (worktype === "areapages" && Array.isArray(locations)) {
    const projectInfo = await UserProject
      .findById(projectId, 'projectName serviceType userId')
      .lean();
    if (!projectInfo) throw new Error('Project not found!');

    const services = await Service.find({ projectId, is_main: true }).lean();

    for (const service of services) {
      const { _id: serviceId, service_name, service_description } = service;

      for (const loc of locations) {
        const areaName = loc.name;
        const areaId = loc.id;
        const areaType = loc.areaType;
        
        console.log(`[AreaServicesData] Processing location - areaName: ${areaName}, areaId: ${areaId} (type: ${typeof areaId}), areaType: ${areaType}`);

        const aiPrompts = {
          service_description: `
            Write an 80-90 word, SEO-optimized, unique description for the service "${service_name}" in "${areaName}".
            Highlight why customers in ${areaName} should choose this service and its relevance to the location.
            Avoid generic statements—be specific to the needs, environment, or context of ${areaName}.
            Include the phrase "${service_name} in ${areaName}" naturally at least once.
            Output only the text.
          `,
          about_service: `
            Write a detailed, 120-150 word, SEO-focused paragraph about "${service_name}" in "${areaName}" for the project "${projectInfo.projectName}".
            Explain the main benefits for local customers, what’s special about your approach in ${areaName}, and include 2-3 long-tail keyword phrases about "${service_name} in ${areaName}".
            Make it engaging and highly relevant for residents or businesses in ${areaName}.
            Output only the text.
          `,
          whyChooseUsHeading: `
            Write a powerful heading (max 14 words) for "Why Choose Our ${service_name} Experts in ${areaName}?".
            It should be bold, persuasive, and highlight what sets your ${service_name} apart in ${areaName}.
            Output only the text 3-4 lines.
          `,
          whyChooseUsText: `
            Write a convincing "Why Choose Us" paragraph (60-80 words) for "${service_name}" in "${areaName}".
            Focus on your unique strengths, local expertise, and trustworthiness for customers in ${areaName}.
            Use a warm and confident tone, and mention "${service_name} in ${areaName}" at least once.
            Output only the text.
          `,
          comprehensiveCoverageText: `
            Write a 60-word paragraph about the comprehensive coverage of "${service_name}" in "${areaName}".
            Specify the neighborhoods, types of properties, or unique local needs you cover in ${areaName}.
            Mention why full coverage matters for customers in this location.
            Output only the text.
          `,
          customSolutionText: `
            Write two clear, unique sentences (each under 15 words) inviting people in "${areaName}" to request a custom "${service_name}" solution.
            Use strong calls to action tailored to ${areaName}.
            Output only the text.
          `,
          promiseLine: `
            Write a 60-70 word promise line for the "${service_name}" service in "${areaName}", for the project "${projectInfo.projectName}".
            Emphasize your reliability, quality, and commitment to satisfaction for local customers in ${areaName}.
            Output only the text.
          `,
          subServices: `
  List EXACTLY 15 unique, comma-separated long-tail keyword phrases that each include the exact phrase "${service_name} in ${areaName}".
            Each phrase should naturally fit local search intent (e.g., "emergency ${service_name} in ${areaName}", "same day ${service_name} in ${areaName}").
  Do not add numbers, serials, or any numeric suffixes to ANY phrase (e.g., no "Service 1", "Top 5", etc.); return ONLY the comma-separated list of clean titles/phrases.
`,
                  ourGuaranteeText: `
            Write a 80-90 word "Our Guarantee" text for "${service_name}" in "${areaName}", for the project "${projectInfo.projectName}". Output only the text.
          `,
        };

        let ai = {};
        for (const [key, prompt] of Object.entries(aiPrompts)) {
          ai[key] = await fetchStringFromOpenAI(
            prompt,
            key,
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: key
            }
          );
        }

        let subServices = ai.subServices
          .replace(/[`"'’]/g, '')
          .split(',')
          .map(s => s.trim()).filter(Boolean);

        let steps_process = [];
        try {
          steps_process = await fetchStepsIcons(
            `
              For the process steps of "${service_name}" in "${areaName}", 
              output a JSON array as per your service model:
              [
                { "stepName": "...", "iconClass": "fas fa-...", "serviceDescription": "..." }
              ]
              Each serviceDescription must mention why this step is important for customers in ${areaName}, 
              referencing any relevant local conditions, needs, or expectations.
              Output only the JSON array.
            `,
            service_name,
            areaName,
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'StepsIcons'
            }
          );
        } catch (err) {
          console.warn(`⚠️ StepsIcons failed for "${service_name}" in "${areaName}":`, err.message);
        }

        let whyChooseUsSection = [];
        try {
          const prompt = `
            Generate a JSON array of 4 objects for the "Why Choose Us" section 
            for the service "${service_name}" in "${areaName}".
            Each object must be:
              { "title": "...", "description": "...", "iconClass": "fas fa-..." }
            Make each title and description highly relevant to customers in ${areaName}. 
            Mention local benefits, special expertise for the ${areaName} area, or reasons residents and businesses in ${areaName} trust this service.
            Avoid generic claims—be specific to local needs, challenges, or values.
            Output only the JSON array.
          `;
          whyChooseUsSection = await fetchJSONFromOpenAI(
            prompt,
            'WhyChooseUsSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'WhyChooseUsSection'
            }
          );
        } catch (e) {
          console.warn(`⚠️ WhyChooseUsSection failed for "${service_name}" in "${areaName}":`, e.message);
        }

        let ourGuaranteeSection = [];
        try {
          const prompt = `
            Generate a JSON array of 4 objects for the "Our Guarantees" section 
            for the "${service_name}" service in "${areaName}".
            Each object must be:
              { "title": "...", "description": "...", "iconClass": "fas fa-..." }
            Each description must address a specific customer concern or expectation in ${areaName}.
            Use language that builds trust with ${areaName} locals, referencing local standards, satisfaction, or reliability.
            Output only the JSON array.
          `;
          ourGuaranteeSection = await fetchJSONFromOpenAI(
            prompt,
            'OurGuaranteeSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'OurGuaranteeSection'
            }
          );
        } catch (e) {
          console.warn(`⚠️ OurGuaranteeSection failed for "${service_name}" in "${areaName}":`, e.message);
        }

        const seoPrompt = `
          Write the following SEO meta tags for a service page:
          - Service Name: ${service_name}
          - Location/Area: ${areaName}
          - Project Name: ${projectInfo.projectName}
          - Service Type: ${projectInfo.serviceType}
          Instructions:
          - meta_title: Under 60 characters, clear, compelling, include service name and area.
          - meta_description: 120–155 characters, focus on why customers in ${areaName} should choose this service, mention project and service type.
          - meta_keywords: List 8–12 unique, relevant keyword phrases separated by commas, each related to the service and location (e.g., "${service_name} in ${areaName}", "best ${service_name} ${areaName}").
          Output only the JSON object with keys: meta_title, meta_description, meta_keywords.
        `;
        const seoContent = await fetchJSONFromOpenAI(
          seoPrompt,
          'SEO',
          {
            userId: projectInfo.userId,
            projectId,
            pageId: `area-${areaId}`,
            promptFrom: 'generateServiceDescQueue',
            promptFor: 'SEO'
          }
        );

        let serviceGroups = [];
        try {
          serviceGroups = await fetchDynamicServiceGroups(service_name, projectInfo, areaName, areaId, true);
          console.log(`[ServiceGroups][AREA] ${service_name} in ${areaName} => groups=${serviceGroups.length}`);
        } catch (e) {
          console.warn(`⚠️ ServiceGroups (AREA) failed for "${service_name}" in "${areaName}":`, e.message);
        }

        const areaServiceDoc = {
          projectId,
          serviceId,
          meta_title: seoContent.meta_title,
          meta_description: seoContent.meta_description,
          meta_keywords: seoContent.meta_keywords,
          areaId,
          areaType,
          service_description: ai.service_description,
          about_service: ai.about_service,
          whyChooseUsHeading: ai.whyChooseUsHeading,
          whyChooseUsText: ai.whyChooseUsText,
          whyChooseUsSection: whyChooseUsSection,
          comprehensiveCoverageText: ai.comprehensiveCoverageText,
          customSolutionText: ai.customSolutionText,
          steps_process,
          ourGuaranteeText: ai.ourGuaranteeText,
          ourGuaranteeSection: ourGuaranteeSection,
          promiseLine: ai.promiseLine,
          serviceGroups: serviceGroups,
          subServices,
          ctaSequence: undefined
        };

        console.log(`[AreaServicesData] Attempting to save - projectId: ${projectId}, serviceId: ${serviceId}, areaId: ${areaId} (type: ${typeof areaId}), areaType: ${areaType}, areaName: ${areaName}`);
        
        try {
          const areaServiceEntry = await AreaServicesData.findOneAndUpdate(
            { projectId, serviceId, areaId, areaType },
            { $set: areaServiceDoc },
            { upsert: true, new: true }
          );

          if (areaServiceEntry) {
            console.log(`[AreaServicesData] ✅ Successfully saved/updated - _id: ${areaServiceEntry._id}, areaId: ${areaServiceEntry.areaId} (type: ${typeof areaServiceEntry.areaId}), areaType: ${areaServiceEntry.areaType}, serviceId: ${areaServiceEntry.serviceId}`);
          } else {
            console.error(`[AreaServicesData] ❌ Failed to save - findOneAndUpdate returned null`);
          }
        } catch (saveError) {
          console.error(`[AreaServicesData] ❌ Error saving AreaServicesData:`, saveError);
          throw saveError;
        }

        let faqSection = [];
        try {
          const faqPrompt = `
            Generate a JSON array of 5 to 10 FAQ objects for the service "${service_name}" in "${areaName}" under the project "${projectInfo.projectName}".
          Each object must be:
            {
              "question": "A question related to ${service_name} in ${areaName} under the project ${projectInfo.projectName}.",
              "answer": "An answer of at least 40-50 words, no pricing or dates."
            }
          Output only the JSON array.
          `;
          faqSection = await fetchJSONFromOpenAI(
            faqPrompt,
            'FAQSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'FAQSection'
            }
          );

          const newFaqSection = new WebsiteSection({
            projectId,
            sectionTitle: 'FAQSERVICEAREA',
            sectionContent: faqSection,
            referencePage: areaServiceEntry._id
          });
          await newFaqSection.save();
          console.log(`✅ FAQSERVICEAREA saved for ${service_name} in ${areaName}`);
        } catch (err) {
          console.warn(`⚠️ FAQSERVICEAREA generation failed for "${service_name}" in "${areaName}":`, err.message);
        }

        let reviewSection = [];
        try {
          const reviewPrompt = `
            Generate a JSON array of exactly 5 review objects for the service "${service_name}" in "${areaName}" under the project "${projectInfo.projectName}".
Each object must follow this format:
{
  "customer_name": "First Last",
  "customer_image": "https://example.com/customerX.jpg",
  "rating": <decimal between 4.0 and 5.0>,
  "review_text": "A realistic, positive review of 30-40 words mentioning ${areaName} and ${service_name} under the project ${projectInfo.projectName}."
}
- Use different customer names and images for each review.
- Output only the JSON array with no extra text.
`;
          reviewSection = await fetchJSONFromOpenAI(
            reviewPrompt,
            'ReviewSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: `area-${areaId}`,
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'ReviewSection'
            }
          );

          const newReviewSection = new WebsiteSection({
            projectId,
            sectionTitle: 'REVIEWSERVICEAREA',
            sectionContent: reviewSection,
            referencePage: areaServiceEntry._id
          });
          await newReviewSection.save();
          console.log(`✅ REVIEWSERVICEAREA saved for ${service_name} in ${areaName}`);
        } catch (err) {
          console.warn(`⚠️ REVIEWSERVICEAREA generation failed for "${service_name}" in "${areaName}":`, err.message);
        }

        const s = (n) => slugify(n || "").trim();

        async function getLocationSlugPath(type, id) {
          let country, state, city, area, businessLocation, businessLocalArea;
          if (type === "country") {
            country = await Country.findOne({ id }).lean();
          } else if (type === "state") {
            state = await State.findOne({ id }).lean();
            country = await Country.findOne({ id: state?.country_id }).lean();
          } else if (type === "city") {
            city = await City.findOne({ id }).lean();
            state = await State.findOne({ id: city?.state_id }).lean();
            country = await Country.findOne({ id: state?.country_id }).lean();
          } else if (type === "local_area") {
            area = await LocalArea.findOne({ id }).lean();
            city = await City.findOne({ id: area?.city_id }).lean();
            state = await State.findOne({ id: city?.state_id }).lean();
            country = await Country.findOne({ id: state?.country_id }).lean();
          } else if (type === "business_location") {
            // For business locations, id is the _id (ObjectId or string)
            businessLocation = await BusinessLocation.findById(id).lean();
            if (businessLocation) {
              // Business locations can have country, state, city metadata
              if (businessLocation.country) {
                country = { name: businessLocation.country };
              }
              if (businessLocation.state) {
                state = { name: businessLocation.state };
              }
              if (businessLocation.city) {
                city = { name: businessLocation.city };
              }
            }
          } else if (type === "business_local_area") {
            // For business local areas, id is the _id (ObjectId or string)
            businessLocalArea = await BusinessLocation.findById(id).lean();
            if (businessLocalArea && businessLocalArea.parentId) {
              // Get parent business location
              businessLocation = await BusinessLocation.findById(businessLocalArea.parentId).lean();
              if (businessLocation) {
                if (businessLocation.country) {
                  country = { name: businessLocation.country };
                }
                if (businessLocation.state) {
                  state = { name: businessLocation.state };
                }
                if (businessLocation.city) {
                  city = { name: businessLocation.city };
                }
              }
            }
          }

          return [
            country && s(country.name),
            state && s(state.name),
            city && s(city.name),
            area && s(area.name),
            businessLocation && s(businessLocation.areaName),
            businessLocalArea && s(businessLocalArea.areaName)
          ]
            .filter(Boolean)
            .map((part) => `/${part}`)
            .join("");
        }

        async function buildUrls(areaType, areaId, service_name) {
          const location_url = await getLocationSlugPath(areaType, areaId) || "";
          const page_url = `${location_url.replace(/\/+$/, "")}/services/${slugify(service_name || "")}`;
          console.log(location_url, "<<<<<LOCATION URL>>>>>>");
          console.log(page_url, "<<<<<<<<<<<PAGE URL>>>>>>>>");

          const metaKeywordsStr = Array.isArray(seoContent.meta_keywords)
            ? seoContent.meta_keywords.map(x => String(x).trim()).filter(Boolean).join(", ")
            : (typeof seoContent.meta_keywords === "string"
              ? seoContent.meta_keywords
                .split(/[,\n]/)
                .map(s => s.replace(/^[\s'"]+|[\s'"]+$/g, ""))
                .filter(Boolean)
                .join(", ")
              : "");

          await upsertSeoByPageUrl(projectId, page_url, {
            meta_title: seoContent.meta_title,
            meta_description: seoContent.meta_description,
            meta_keywords: metaKeywordsStr || (seoContent.meta_title || ""),
            meta_image: '',
            canonical_url: page_url,
            og_title: seoContent.meta_title,
            og_description: seoContent.meta_description,
          }, 'ai');
        }

        buildUrls(areaType, areaId, service_name);
        console.log(`✅ Upserted AreaServicesData for ${service_name} in ${areaName} (${areaType})`);
      }
    }
    return;
  } else {
    console.log(`🔄 Processing projectId=${projectId}`);

    try {
      const projectInfo = await UserProject
        .findById(projectId, 'projectName serviceType userId')
        .lean();
      if (!projectInfo) throw new Error('Project not found!');

      const services = await Service.find(
        { projectId, is_main: true, serviceProcessed: false },
        'service_name service_description images _id'
      ).lean();

      if (!services.length) {
        console.log('✅ No unprocessed services remaining.');
        return;
      }

      let processedCount = 0, failedCount = 0;
      const previousUrls = new Set();

      for (let i = 0; i < services.length; i++) {
        const svc = services[i];
        const {
          _id: serviceId,
          service_name,
          service_description,
          images: prevImages = []
        } = svc;

        console.log(`\n[${i + 1}/${services.length}] ✨ ${service_name}`);

        let subServices = [];
        try {
          const subServicesPrompt = `
            List 15 unique, comma-separated long-tail keyword phrases that include "${service_name}". 
            Choose modifiers fitting the service (e.g., for DJ: “wedding”, “corporate event”; for hospital: “24/7 emergency”, “pediatric”; for education: “online certification”, “tutoring session”). 
            Avoid irrelevant or generic modifiers. 
            Return only the comma-separated list.
          `;
          const subServicesRaw = await fetchStringFromOpenAI(
            subServicesPrompt,
            'subServices',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'subServices'
            }
          );
          subServices = subServicesRaw
            .replace(/```|"/g, '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
        } catch (err) {
          console.warn(`⚠️ Failed to parse subServices for "${service_name}":`, err.message);
          subServices = [];
        }

        const prompts = {
          whyChooseUsText: `
            Write a persuasive "Why Choose Us" paragraph (60-80 words) for "${service_name}"
            under the "${projectInfo.projectName}" project based on: "${service_description}".
            Output only the text.
          `,
          ourProcess: `
            Write a structured "Our Process" description (80-100 words) for "${service_name}"
            under "${projectInfo.projectName}" based on: "${service_description}".
            Output only the text.
          `,
          scheduleService: `
            Write a "Schedule Service" blurb (40-60 words) for "${service_name}"
            under "${projectInfo.projectName}", focusing on booking ease.
            Output only the text.
          `,
          ourGuarantees: `
            Write a 40-45 word "Our Guarantees" paragraph for "${service_name}" service
            under "${projectInfo.projectName}", emphasizing trust and reliability.
            Output only the text.
          `,
          whyChooseUsHeading: `
            Write a persuasive heading (max 14 words) for "Why Choose Our ${service_name} Experts?".
            Reflect why customers should choose this service under "${projectInfo.projectName}".
            Output only the text 3-4 lines.
          `,
          customSolutionText: `
            Write two short, clear sentences (each under 15 words) under "Need a Custom Solution?" 
            for "${service_name}" in "${projectInfo.projectName}".
            Output only the text.
          `,
          comprehensiveCoverageText: `
            Write a 60-word descriptive paragraph under "Comprehensive Service Coverage".
            Explain what areas/aspects "${service_name}" covers under "${projectInfo.projectName}".
            Output only the text.
          `,
          aboutService: `
            Write a 100–150 word SEO-friendly paragraph about "${service_name}"
            for project "${projectInfo.projectName}", highlighting benefits.
            Integrate keywords: ${subServices.join(', ')}.
            Output only the text.
          `,
          promiseLine: `
            Write a 60-70 word engaging promise line for "${service_name}" in "${projectInfo.projectName}".
            Emphasize reliability, quality, and commitment to satisfaction.
            Output only the text.
          `
        };

        let ai = {};
        try {
          for (const [key, prompt] of Object.entries(prompts)) {
            ai[key] = await fetchStringFromOpenAI(
              prompt,
              key,
              {
                userId: projectInfo.userId,
                projectId,
                pageId: serviceId.toString(),
                promptFrom: 'generateServiceDescQueue',
                promptFor: key
              }
            );
          }
        } catch (err) {
          console.error(`❌ OpenAI failed for "${service_name}", skipping.`, err.message);
          failedCount++;
          continue;
        }

        let imagesToStore;
        try {
          // Use tracked FreePik function with projectId and userId
          imagesToStore = await fetchFreepikImagesTracked(
            `${service_name} ${projectInfo.serviceType}`,
            projectId,
            5, // limit
            projectInfo.userId,
            serviceId.toString(), // pageId
            'generateServiceDescQueue',
            'service_images'
          );
          console.log(`[Freepik] returned ${imagesToStore.length} images for "${service_name}"`);
        } catch (err) {
          console.warn(`⚠️ Freepik error for "${service_name}": ${err.message}`);
          imagesToStore = Array.isArray(prevImages) ? prevImages : [];
        }

        if (!Array.isArray(imagesToStore) || imagesToStore.length === 0) {
          console.warn(`⚠️ No images from Freepik for "${service_name}", using prevImages`);
          imagesToStore = Array.isArray(prevImages) ? prevImages : [];
        }

        const htmlSteps = ai.ourProcess.replace(/\n/g, '<br>');
        let steps_process = [];
        try {
          steps_process = await fetchStepsIcons(
            htmlSteps,
            service_name,
            projectInfo.projectName,
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'StepsIcons'
            }
          );
        } catch (err) {
          console.error(`❌ StepsIcons failed for "${service_name}", skipping.`, err.message);
          failedCount++;
          continue;
        }

        let ourGuaranteeSection = [];
        try {
          const guaranteePrompt = `
            Generate a JSON array of exactly 4 objects for the "Our Guarantees" section
            for "${service_name}" under project "${projectInfo.projectName}".
            Each object must be: { "title": "...", "description": "...", "iconClass": "fas fa-..." }.
            Output only the JSON array.
          `;
          ourGuaranteeSection = await fetchJSONFromOpenAI(
            guaranteePrompt,
            'OurGuaranteeSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'OurGuaranteeSection'
            }
          );
        } catch (err) {
          console.warn(`⚠️ OurGuaranteeSection failed for "${service_name}":`, err.message);
        }

        let whyChooseUsSection = [];
        try {
          const whyPrompt = `
            Generate a JSON array of exactly 4 objects for the "Why Choose Us" section
            for "${service_name}" under project "${projectInfo.projectName}".
            Each object must be: { "title": "...", "description": "...", "iconClass": "fas fa-..." }.
            Output only the JSON array.
          `;
          whyChooseUsSection = await fetchJSONFromOpenAI(
            whyPrompt,
            'WhyChooseUsSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'WhyChooseUsSection'
            }
          );
        } catch (err) {
          console.warn(`⚠️ WhyChooseUsSection failed for "${service_name}":`, err.message);
        }

        let faqSection = [];
        try {
          const faqPrompt = `
            Generate a JSON array of 5 to 10 FAQ objects for the service "${service_name}" under the project "${projectInfo.projectName}".
            Each object must be:
              {
                "question": "A question related to ${service_name}.",
                "answer": "An answer of at least 40-50 words, no pricing or dates."
              }
            Output only the JSON array.
          `;
          faqSection = await fetchJSONFromOpenAI(
            faqPrompt,
            'FAQSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'FAQSection'
            }
          );

          const newFaqSection = new WebsiteSection({
            projectId,
            sectionTitle: 'FAQSERVICE',
            sectionContent: faqSection,
            referencePage: serviceId
          });
          await newFaqSection.save();
        } catch (err) {
          console.warn(`⚠️ FAQSection failed for "${service_name}":`, err.message);
        }

        let reviewSection = [];
        try {
          const reviewPrompt = `
            Generate a JSON array of exactly 5 review objects for the service "${service_name}" under the project "${projectInfo.projectName}".
          Each object must follow this format:
          {
            "customer_name": "First Last",
            "customer_image": "https://example.com/customerX.jpg",
            "rating": <decimal between 4.0 and 5.0>,
            "review_text": "A realistic, positive review of 30-40 words mentioning ${service_name} under the project ${projectInfo.projectName}."
          }
          - Use different customer names and images for each review.
          - Output only the JSON array with no extra text.
          `;
          reviewSection = await fetchJSONFromOpenAI(
            reviewPrompt,
            'ReviewSection',
            {
              userId: projectInfo.userId,
              projectId,
              pageId: serviceId.toString(),
              promptFrom: 'generateServiceDescQueue',
              promptFor: 'ReviewSection'
            }
          );

          const newReviewSection = new WebsiteSection({
            projectId,
            sectionTitle: 'REVIEWSERVICE',
            sectionContent: reviewSection,
            referencePage: serviceId
          });
          await newReviewSection.save();
          console.log(`✅ REVIEWSERVICE saved for ${service_name}`);
        } catch (err) {
          console.warn(`⚠️ REVIEWSERVICE generation failed for "${service_name}":`, err.message);
        }

        let serviceGroups = [];
        try {
          serviceGroups = await fetchDynamicServiceGroups(service_name, projectInfo);
          console.log(`[ServiceGroups][BASE] ${service_name} => groups=${serviceGroups.length}`);
        } catch (e) {
          console.warn(`⚠️ ServiceGroups (BASE) failed for "${service_name}":`, e.message);
        }

        await Service.findByIdAndUpdate(serviceId, {
          $set: {
            whyChooseUsText: ai.whyChooseUsText.replace(/\n/g, '<br>'),
            ourProcess: ai.ourProcess.replace(/\n/g, '<br>'),
            scheduleService: ai.scheduleService.replace(/\n/g, '<br>'),
            whyChooseUsHeading: ai.whyChooseUsHeading.replace(/\n/g, '<br>'),
            customSolutionText: ai.customSolutionText.replace(/\n/g, '<br>'),
            comprehensiveCoverageText: ai.comprehensiveCoverageText.replace(/\n/g, '<br>'),
            ourGuaranteeText: ai.ourGuarantees.replace(/\n/g, '<br>'),
            promiseLine: ai.promiseLine,
            serviceGroups: serviceGroups,
            about_service: ai.aboutService,
            images: imagesToStore,
            steps_process,
            ourGuaranteeSection,
            whyChooseUsSection,
            subServices,
            serviceProcessed: true
          }
        });

        console.log(`✅ Updated "${service_name}"`);
        processedCount++;
      }

      await UserProject.findByIdAndUpdate(projectId, { $set: { status: 2 } });
      console.log(`\n🎉 Done. ${processedCount} succeeded, ${failedCount} failed.`);
    } catch (err) {
      console.error(`🔥 Queue processor error for project ${projectId}:`, err);
      throw err;
    }
  }
});

async function shutdown() {
  console.log('Shutting down generateServiceDescQueue...');
  await generateServiceDescQueue.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = generateServiceDescQueue;