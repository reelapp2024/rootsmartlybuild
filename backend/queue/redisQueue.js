const Bull = require('bull');
require('dotenv').config();
const UserProject = require('../models/userProjects');
const Service = require('../models/service');
const WebsiteSection = require('../models/websiteSections');
const { upsertSeoByPageUrl } = require('../services/pageSeoService');
const slugify = require('../additional/slugify');      // used for /services/:slug

const axios = require('axios');
const { getSubcategoriesFromOpenAI, getResponseFromOpenAI } = require('../openAi/openAi');
const {
  fetchJSONFromOpenAI,
  fetchStringFromOpenAI,
  fetchSeoContentForPage
} = require('../additional/openaiHelpers');
// Initialize Bull Queue for Locations (country, state, city, local_area)
const { getBullRedisConfig } = require('../config/bullRedis');
const redisQueue = new Bull('redisQueue', {
  redis: getBullRedisConfig(),
});

// Generic retry helper
async function retry(fn, args = [], maxRetries = 3, label = ' Mestre operation') {
  let lastErr;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn(...args);
    } catch (err) {
      lastErr = err;
      console.warn(`[${label}] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxRetries) {
        console.error(`[${label}] all ${maxRetries} attempts failed.`);
        throw lastErr;
      }
    }
  }
  throw lastErr;
}


// Helper function to validate Font Awesome icons
const FA_ICONS_JSON_URL =
  'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/metadata/icons.json';
async function isValidFAIcon(iconClass) {
  try {
    const response = await retry(
      () => axios.get(FA_ICONS_JSON_URL),
      [],
      3,
      'FontAwesomeValidation'
    );
    const faIcons = response.data;
    const iconName = iconClass.replace(/^(fas|fa)\s+fa-/, '').trim();
    return faIcons[iconName] && faIcons[iconName].styles.includes('solid');
  } catch (error) {
    console.error('Error validating Font Awesome icon:', error.message);
    return false;
  }
}

redisQueue.process(5, async (job) => {
  let { type, data, projectId, wantAiServices = 1, servicesCount, services = [] } = job.data;

  // Determine referencePageId
  let ReferencePageId = 'homepage';
  if (type === 'country') ReferencePageId = data.countryId;
  else if (type === 'state') ReferencePageId = data.stateId;
  else if (type === 'city') ReferencePageId = data.cityId;
  else if (type === 'local_area') ReferencePageId = data.localAreaId;
  else if (type === 'business_location') ReferencePageId = data._id ? data._id.toString() : data.locationId;
  else if (type === 'business_local_area') ReferencePageId = data._id ? data._id.toString() : data.locationId;

  // Fetch project and flags from DB with retries
  const userProject = await retry(
    () => UserProject.findById(projectId),
    [],
    3,
    'FetchUserProject'
  );


  if (!userProject) throw new Error(`UserProject ${projectId} not found`);
  const service_type = userProject.serviceType;
  const projectName = userProject.projectName;
  const defaultIcon = userProject.defaultFasFaIcon || 'fas fa-circle'; // Fallback to a safe default
  const servicesGenerated = userProject.servicesGenerated;

  // Extract variables similar to projectBackgroundQueue.js and addNewServicesQueue.js
  const { focusKeyword, projectKeywordsText, categories, subCategories, microCategories } = userProject;
  let mainCategory = categories && categories.length > 0 ? categories[0] : service_type || '';
  const subcategorieslist = (subCategories || []).join(', ');
  const microcategorieslist = (microCategories || []).join(', ');
  let focusCategory = microcategorieslist || subcategorieslist || '';
  const categorieslist = (categories || []).join(', ');

  // Determine startFrom
  let startFrom = 'homepage';
  if (userProject.isCountry === 1) startFrom = 'country';
  else if (userProject.isState === 1) startFrom = 'state';
  else if (userProject.isCity === 1) startFrom = 'city';
  else if (userProject.isLocal === 1) startFrom = 'local_area';
  

  console.log(type == startFrom, "type == startFrom", type, startFrom);

  try {
    // === SERVICE GENERATION: only run once on the very first startFrom page ===
    if (!servicesGenerated && type === 'homepage') {
      console.log(`First pass on "${type}" for project ${projectId}, generating services…`);

      let servicesToSave = [];
      if (wantAiServices == 1) {
        // ----- AI-BASED SERVICES GENERATION -----

        const prompt = `Generate a JSON array containing between exact ${servicesCount} objects please make sure create exactly ${servicesCount} count, each following this structure and keep in mind :
        service_title: The name of the subcategory, relevant to the specified service type. Ensure the name does not end with a period (.).  
        fas-fa-icon: A valid FontAwesome icon or logo. Ensure if it's a brand, then use brand fas fa or fa fa icon name related to the subcategory. Use fas (solid style) icons primarily. If a fas icon is not available or invalid, fallback to a fa (regular or legacy) icon. Ensure the provided icon works correctly.  
        subcategory_description: A brief description of the subcategory around 80-90 words, relevant to the specified service type. Ensure this does not end with a period (.).  
        contact_phone: A valid phone number formatted for the specified country.  

        **important instruction make sure all the service_titles based on project name and service type and subcategory_description around 80 90 words.  

        Input:  
        ${type !== 'homepage' ? `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: ${data.name},` : ''}
        Project name: ${projectName}  
        Parent category is ${mainCategory}. Focused category is ${focusCategory || 'N/A'}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${categorieslist || 'N/A'}. Subcategories: ${subcategorieslist || 'N/A'}.

        Example Output:  
        {  
          "service_title": "Pipe Installation",  
          "fas-fa-icon": "fas fa-pipe",  
          "subcategory_description": "Expert plumbing solutions... Satisfaction guaranteed around 80 90 words.",  
          "contact_phone": "+91-9876543210"  
        }`;

        // Fetch subcategories with retries
        const subcategories = await retry(
          () => getSubcategoriesFromOpenAI(prompt),
          [],
          3,
          'Subcategories'
        );

        for (let subcategory of subcategories) {
          let icon = subcategory['fas-fa-icon'] || defaultIcon; // Use default if undefined
          if (!(await isValidFAIcon(icon))) {
            console.log(`Invalid icon '${icon}' for '${subcategory.service_title}'. Using default.`);
            icon = defaultIcon;
          }

          const existingService = await retry(
            () => Service.findOne({
              projectId,
              name: String(subcategory.service_title || '').trim().toLowerCase()
            }),
            [],
            3,
            'CheckExistingService'
          );

          if (!existingService) {



            const areaNamePart = type !== 'homepage' ? `- ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: ${data.name}` : '';
            const seoPrompt = `
  Write the following SEO meta tags for a service page:
  - Service Name: ${subcategory.service_title}
  - Project Name: ${projectName}
  - Service Type: ${service_type}
  ${areaNamePart}
  Instructions:
  - meta_title: Under 60 characters, clear, compelling, include the service name${type !== 'homepage' ? ` and ${data.name}` : ''}.
  - meta_description: 120–155 characters, persuasive, mention project and service type${type !== 'homepage' ? ` and ${data.name}` : ''}.
  - meta_keywords: 8–12 unique keyword phrases separated by commas.
  Output only the JSON object with keys: meta_title, meta_description, meta_keywords.
`;

            let seoContent;
            try {
              seoContent = await fetchJSONFromOpenAI(
                seoPrompt,
                'SEO',
                {
                  userId: userProject.userId,
                  projectId,
                  pageId: `service-${slugify(subcategory.service_title)}`,
                  promptFrom: 'redisQueue',
                  promptFor: 'SERVICE SEO'
                }
              );
            } catch (e) {
              console.warn('[SEO] OpenAI SEO fetch failed:', e.message);
              seoContent = { meta_title: subcategory.service_title, meta_description: '', meta_keywords: '' };
            }

            const page = `/services/${slugify(subcategory.service_title)}`;

            try {
              await upsertSeoByPageUrl(projectId, page, {
                meta_title: (seoContent.meta_title || '').toString().trim(),
                meta_description: (seoContent.meta_description || '').toString().trim(),
                meta_keywords: Array.isArray(seoContent.meta_keywords)
                  ? seoContent.meta_keywords.map(x => String(x).trim()).filter(Boolean).join(', ')
                  : (typeof seoContent.meta_keywords === 'string' ? seoContent.meta_keywords : ''),
                meta_image: '',
                canonical_url: page,
                og_title: (seoContent.meta_title || '').toString().trim(),
                og_description: (seoContent.meta_description || '').toString().trim(),
              }, 'ai');
              console.log('[SEO] saved for', page);
            } catch (e) {
              console.error('[SEO] save failed for', page, e);
            }









            servicesToSave.push({
              projectId,
              name: String(subcategory.service_title || '').trim().toLowerCase(),
              slug: slugify(subcategory.service_title || '')
            });
          } else {
            console.log(`Service '${subcategory.service_title}' already exists. Skipping.`);
          }
        }
      } else if (Array.isArray(services) && services.length) {
        // ----- PREDEFINED SERVICES GENERATION -----
        const objCount = services.length;
        const prompt = `
        Generate a JSON array of exactly ${objCount} objects—one for each of these subcategory names:
        ${services.map(n => `- "${n}"`).join('\n')}
        Each object must follow this structure:
        {
          "service_title": <one of the provided names>,
          "fas-fa-icon":      <valid FontAwesome class; fallback to project default if invalid>,
          "subcategory_description":  around 80-90 words <brief, relevant description not ending with a period>,
          "contact_phone":    <valid phone number for the country ${data.name}>
        }
        Do NOT add or remove any names. Return exactly ${objCount} items in a JSON array.  
        Warning: this is very important data—do not miss or add entries.  

        Input:
        ${type !== 'homepage' ? `${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: ${data.name},` : ''}
        Project name: ${projectName}
        Parent category is ${mainCategory}. Focused category is ${focusCategory || 'N/A'}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${categorieslist || 'N/A'}. Subcategories: ${subcategorieslist || 'N/A'}.
        `;

        // Fetch predefined subcategories with retries
        const subcategories = await retry(
          () => getSubcategoriesFromOpenAI(prompt),
          [],
          3,
          'PredefinedSubcategories'
        );

        for (let subcategory of subcategories) {
          let icon = subcategory['fas-fa-icon'] || defaultIcon; // Use default if undefined
          if (!(await isValidFAIcon(icon))) {
            console.log(`Invalid icon '${icon}' for '${subcategory.service_title}'. Using default.`);
            icon = defaultIcon;
          }

          const existingService = await retry(
            () => Service.findOne({
              projectId,
              name: String(subcategory.service_title || '').trim().toLowerCase()
            }),
            [],
            3,
            'CheckExistingService'
          );

          if (!existingService) {

            const areaNamePart = type !== 'homepage' ? `- ${type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}: ${data.name}` : '';
            const seoPrompt = `
  Write the following SEO meta tags for a service page:
  - Service Name: ${subcategory.service_title}
  - Project Name: ${projectName}
  - Service Type: ${service_type}
  ${areaNamePart}
  Instructions:
  - meta_title: Under 60 characters, clear, compelling, include the service name${type !== 'homepage' ? ` and ${data.name}` : ''}.
  - meta_description: 120–155 characters, persuasive, mention project and service type${type !== 'homepage' ? ` and ${data.name}` : ''}.
  - meta_keywords: 8–12 unique keyword phrases separated by commas.
  Output only the JSON object with keys: meta_title, meta_description, meta_keywords.
`;

            let seoContent;
            try {
              seoContent = await fetchJSONFromOpenAI(
                seoPrompt,
                'SEO',
                {
                  userId: userProject.userId,
                  projectId,
                  pageId: `service-${slugify(subcategory.service_title)}`,
                  promptFrom: 'redisQueue',
                  promptFor: 'SERVICE SEO'
                }
              );
            } catch (e) {
              console.warn('[SEO] OpenAI SEO fetch failed:', e.message);
              seoContent = { meta_title: subcategory.service_title, meta_description: '', meta_keywords: '' };
            }

            const page = `/services/${slugify(subcategory.service_title)}`;

            try {
              await upsertSeoByPageUrl(projectId, page, {
                meta_title: (seoContent.meta_title || '').toString().trim(),
                meta_description: (seoContent.meta_description || '').toString().trim(),
                meta_keywords: Array.isArray(seoContent.meta_keywords)
                  ? seoContent.meta_keywords.map(x => String(x).trim()).filter(Boolean).join(', ')
                  : (typeof seoContent.meta_keywords === 'string' ? seoContent.meta_keywords : ''),
                meta_image: '',
                canonical_url: page,
                og_title: (seoContent.meta_title || '').toString().trim(),
                og_description: (seoContent.meta_description || '').toString().trim(),
              }, 'ai');
              console.log('[SEO] saved for', page);
            } catch (e) {
              console.error('[SEO] save failed for', page, e);
            }

            servicesToSave.push({
              projectId,
              name: String(subcategory.service_title || '').trim().toLowerCase(),
              slug: slugify(subcategory.service_title || '')
            });
          } else {
            console.log(`Service '${subcategory.service_title}' already exists. Skipping.`);
          }
        }
      }

      // Save services with retries
      if (servicesToSave.length > 0) {
        await retry(
          () => Service.insertMany(servicesToSave),
          [],
          3,
          'SaveServices'
        );
        console.log('Services saved successfully!');
      }

      // Mark services as generated with retries
      userProject.servicesGenerated = true;
      await retry(
        () => userProject.save(),
        [],
        3,
        'UpdateServicesGenerated'
      );
      console.log('✔️ Services generated and flag set; will not run again.');
    } else {
      console.log('Services already generated or not the start page—skipping service creation.');
    }

    // Generate FAQs
    const existingFaqSection = await retry(
      () => WebsiteSection.findOne({
        projectId,
        sectionTitle: 'FAQ',
        referencePage: ReferencePageId
      }),
      [],
      3,
      'CheckExistingFAQ'
    );
    if (!existingFaqSection) {
      let faqPrompt = '';
      if (type === 'homepage') {
        faqPrompt = `Generate a JSON array of 5 to 10 FAQ objects:
        - A question related to the service and project.
        - An answer around not less than 40-50 words, no pricing or dates.
        Input:
        - Service Type: ${service_type}
        - Project Name: ${projectName}
        
        
        Output only a flat JSON array. Example:
[
  {"question": "What ${service_type} services are in ${data.name}?", "answer": "In ${data.name}, we offer expert ${service_type} services, delivering quality and reliability with professional execution tailored to local needs and conditions."},
  {"question": "How safe is ${service_type} in ${data.name}?", "answer": "We ensure safety in ${data.name} with trained staff, rigorous protocols, and high-quality equipment for a secure and reliable experience."}
]
        `;
      } else {
        faqPrompt = `Generate a JSON array of 5 to 10 FAQ objects:
        - A question related to the service in ${data.name}.
        - An answer around not less than 40-50 words, no pricing or dates.
        Input:
        - Location: ${data.name}
        - Service Type: ${service_type}
        - Project Name: ${projectName}
        
        
        Output only a flat JSON array. Example:
[
  {"question": "What ${service_type} services are in ${data.name}?", "answer": "In ${data.name}, we offer expert ${service_type} services, delivering quality and reliability with professional execution tailored to local needs and conditions."},
  {"question": "How safe is ${service_type} in ${data.name}?", "answer": "We ensure safety in ${data.name} with trained staff, rigorous protocols, and high-quality equipment for a secure and reliable experience."}
]
        
        `;
      }
      // Fetch & parse FAQs with retries
      let faqs


      try {
        faqs = await fetchJSONFromOpenAI(
          `${faqPrompt}`,
          'FAQ',
          {
            userId: userProject.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'redisQueue',
            promptFor: 'Faq section'
          }
        );
      } catch (e) {
        console.warn('Faq section failed:', e.message);
      }



      const newFaqSection = new WebsiteSection({
        projectId,
        sectionTitle: 'FAQ',
        sectionContent: faqs,
        referencePage: ReferencePageId
      });
      await retry(
        () => newFaqSection.save(),
        [],
        3,
        'SaveFAQ'
      );
      console.log('FAQs saved successfully!');
    } else {
      console.log('FAQs already generated for this page. Reusing existing FAQs.');
    }

    // Generate Reviews
    const existingReviewSection = await retry(
      () => WebsiteSection.findOne({
        projectId,
        sectionTitle: 'Reviews',
        referencePage: ReferencePageId
      }),
      [],
      3,
      'CheckExistingReviews'
    );
    if (!existingReviewSection) {
      let reviewPrompt = '';
      if (type === 'homepage') {
        reviewPrompt = `
        Generate a JSON array of 5 to 7 review objects:
        - customer_name, customer_image, rating, review_text
        - Highlight ${service_type} services for ${projectName}, ratings 3.5–5, no prices or dates.
       Output only a flat JSON array. Example:
[
  {"customer_name": "John Doe", "customer_image": "https://example.com/customer1.jpg", "rating": 4.5, "review_text": "Exceptional ${service_type} service with professional staff and great attention to detail."},
  {"customer_name": "Jane Smith", "customer_image": "https://example.com/customer2.jpg", "rating": 4.0, "review_text": "Reliable ${service_type} experience with a friendly team, highly recommended."}
]
       
        `;
      } else {
        reviewPrompt = `
        Generate a JSON array of 5 to 7 review objects:
        - customer_name, customer_image, rating, review_text
        - Culturally appropriate names for ${data.name}, highlight ${service_type} services, ratings 3.5–5, no prices or dates.
       
       Output only a flat JSON array. Example:
[
  {"customer_name": "John Doe", "customer_image": "https://example.com/customer1.jpg", "rating": 4.5, "review_text": "Exceptional ${service_type} service with professional staff and great attention to detail."},
  {"customer_name": "Jane Smith", "customer_image": "https://example.com/customer2.jpg", "rating": 4.0, "review_text": "Reliable ${service_type} experience with a friendly team, highly recommended."}
]
        `;
      }
      // Fetch & parse reviews with retries


      let reviews


      try {
        reviews = await fetchJSONFromOpenAI(
          `${reviewPrompt}`,
          'FAQ',
          {
            userId: userProject.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'redisQueue',
            promptFor: 'reviews section'
          }
        );
      } catch (e) {
        console.warn('reviews section failed:', e.message);
      }



      const newReviewSection = new WebsiteSection({
        projectId,
        sectionTitle: 'Reviews',
        sectionContent: reviews,
        referencePage: ReferencePageId
      });
      await retry(
        () => newReviewSection.save(),
        [],
        3,
        'SaveReviews'
      );
      console.log('Reviews saved successfully!');
    } else {
      console.log('Reviews already generated. Reusing existing Reviews.');
    }

  } catch (error) {
    console.error(`Job failed for ${type}: ${data.name}`, error);
    throw error;
  }
});

// Gracefully shutting down on process exit
const shutdown = async () => {
  console.log('Shutting down redisQueue gracefully...');
  await redisQueue.close();
  console.log('Queue processing stopped.');
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = redisQueue;