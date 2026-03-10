const Bull = require('bull');
const axios = require('axios');
const UserProject = require('../models/userProjects');
const SeoSettings = require("../models/seoSettings");
const Slug = require("../models/slug")
const https = require("https");
const sharp = require("sharp");
const helper = require("../additional/addon")
const path = require('path');
const fs = require('fs');
const AreaPagesContent = require('../models/AreaPagesContent');
const {
  fetchJSONFromOpenAI,
  fetchStringFromOpenAI,
  fetchSeoContentForPage
} = require('../additional/openaiHelpers');
const fetchFreepikImagesTracked = require('../additional/freePik');

require('dotenv').config();

const MAX_OPENAI_RETRIES = 3;

const projectBackgroundQueue = new Bull('projectBackgroundQueue', {
  redis: {
    host: process.env.redisHost,
    port: process.env.redisPort,
  },
  defaultJobOptions: {
    attempts: 1,
    backoff: { type: 'fixed', delay: 30_000 },
    removeOnComplete: true,
    removeOnFail: false,
  }
});

const strip = s => s.replace(/^["']+|["']+$/g, '').trim();

const FA_ICONS_JSON_URL = 'https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/metadata/icons.json';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY;

async function retry(fn, args = [], max = 3, label = 'operation') {
  let err;
  for (let i = 1; i <= max; i++) {
    try {
      return await fn(...args);
    } catch (e) {
      err = e;
      console.warn(`[${label}] attempt ${i} failed: ${e.message}`);
    }
  }
  throw err;
}

projectBackgroundQueue.process(5, async (job) => {
  const { projectId, worktype } = job.data;
  const BASE_URL = process.env.BASE_URL || 'https://apis.smartlybuild.dev';

  try {
    const project = await UserProject.findById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    console.log("New project found in projectBackgroundQueue,", projectId);
    const { serviceType, projectName, wantImages, focusKeyword, projectKeywordsText, categories, subCategories, microCategories } = project;

    let mainCategory = categories && categories.length > 0 ? categories[0] : '';
    const subcategorieslist = (subCategories || []).join(', ');
    const microcategorieslist = (microCategories || []).join(', ');
    let focusCategory = microcategorieslist || subcategorieslist || '';

    let images = [];
    let iconsArray = [];
    let ourGuaranteeSection = [];
    let ourGuaranteeText = "";
    let whyChooseUsSection = [];
    let ourProcessSection = [];
    let cta = [];
    let featuresSection = [];
    let statsSection = [];
    let whyChooseUsAboutPage = [];
    let descriptions = [];
    let coreValuesIntro = "";
    let coreValues = [];
    let whatMakesUsDifferent = [];
    let commitment = "";
    let missionSubHeadings = [];
    let missionLine = "";
    let visionSubHeadings = [];
    let visionLine = "";
    let defaultFasFaIcon = 'fas fa-cog';
    let welcomeLine = "";
    let projectSlogan = "";
    let promiseLine = "";
    let description = "";
    let heroHeading = "";
    let serviceHeroText = "";
    let aboutHeroText = "";


    if (worktype !== "areapages") {
      if (wantImages === 1) {


        if (wantImages) {
          console.log('Fetching Freepik images for:', mainCategory);
          
          try {
            // Use tracked FreePik function with projectId and userId
            const searchTerm = `Real looking ${focusKeyword}, ${focusCategory}`.trim();
            images = await fetchFreepikImagesTracked(
              searchTerm,
              projectId,
              5, // limit
              project.userId?.toString() || null,
              projectId, // pageId
              'projectBackgroundQueue',
              'project_images'
            );
            
            if (!images.length) {
              console.warn(
                "No Freepik images returned — check your key, endpoint, quota, or ISP/CDN blocking."
              );
            }
          } catch (err) {
            console.error("Freepik fetch failed:", err?.message || err);
            images = [];
          }
        }


      }

      const { data: faIcons } = await retry(() => axios.get(FA_ICONS_JSON_URL), [], 3, 'FetchFAIcons');
      const isValidFAIcon = iconClass => {
        const name = iconClass.replace(/^(fas|fa)\s+fa-/, '').trim();
        return faIcons[name]?.styles?.includes('solid');
      };

      const iconPrompt = `
        Generate a JSON array of 8–10 valid FontAwesome iconClass values for "${mainCategory}" or "${projectName}". 
        Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}.
        Each must be in the format "fas fa-tools". Output only the JSON array.
      `;
      try {
        const candidates = await fetchJSONFromOpenAI(iconPrompt, 'DefaultFasFaIcon', {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'DefaultFasFaIcon'
        });
        for (const icon of candidates) {
          if (isValidFAIcon(icon)) {
            defaultFasFaIcon = icon;
            break;
          }
        }
      } catch (e) {
        console.warn('Default FA icon generation failed, using fallback:', e.message);
      }

      const homepageIconPrompt = `
        Generate a JSON array of 7–10 FontAwesome iconClass values related to "${mainCategory}". 
        Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}.
        Each must follow "fas fa-tools" format. Output only the JSON array.
      `;
      try {
        iconsArray = await fetchJSONFromOpenAI(homepageIconPrompt, 'HomepageIcons', {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'HomepageIcons'
        });
      } catch (e) {
        console.warn('Homepage icons generation failed:', e.message);
      }

      welcomeLine = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a 80–100 word engaging welcome line for a homepage of a website whoose Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}, SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 100 words. Output only the line.`,
        'WelcomeLine',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'WelcomeLine'
        }
      ));

      projectSlogan = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a 3–4 word catchy slogan for website. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 3 to 4 words. Output only the slogan.`,
        'ProjectSlogan',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'ProjectSlogan'
        }
      ));

      promiseLine = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a 50–70 word engaging promise line for website. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 50 to 70 words. Output only the line.`,
        'PromiseLine',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'PromiseLine'
        }
      ));

      description = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer an 80–90 word homepage description for website : "${projectName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the paragraph.`,
        'Description',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'Description'
        }
      ));

      heroHeading = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a catchy heading for hero section of website with 5 to 6 words For the website : "${projectName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}. 
        The heading should be concise, impactful, and fully reflect the core value or purpose of the website niche. We need SEO optimized content. Strict Rule: we need exact 5 to 6 words. Output only the heading.`,
        'HeroHeading',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'HeroHeading'
        }
      ));

      ourGuaranteeText = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer an 80–90 word "Our Guarantee" text for website homepage website name is "${projectName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the text.`,
        'OurGuaranteeText',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'OurGuaranteeText'
        }
      ));

      try {
        ourGuaranteeSection = (
          await fetchJSONFromOpenAI(
            `Generate a JSON array of exactly 4 objects for "Our Guarantee" section. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
            Each object: { "title": "...", "description": "...", "iconClass": "fas fa-tools" }. 
            Output only the JSON array.`,
            'OurGuaranteeSection',
            {
              userId: project.userId,
              projectId,
              pageId: 'homepage',
              promptFrom: 'backgroundQueue',
              promptFor: 'OurGuaranteeSection'
            }
          )
        ).map((g, i) => ({ serialno: i + 1, ...g }));
      } catch (e) {
        console.warn('OurGuaranteeSection failed:', e.message);
      }

      try {
        whyChooseUsSection = await fetchJSONFromOpenAI(
          `Generate a JSON array of 5–10 objects for "Why Choose Us" for website. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
          Each: { "title": "why choose us title related to ${mainCategory}", "description": "description totally related to title and ${mainCategory}", "iconClass": "fas fa-<icon-name>" }. 
          Output only JSON.`,
          'WhyChooseUsSection',
          {
            userId: project.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'backgroundQueue',
            promptFor: 'WhyChooseUsSection'
          }
        );
      } catch (e) {
        console.warn('WhyChooseUsSection failed:', e.message);
      }

      try {
        ourProcessSection = await fetchJSONFromOpenAI(
          `Generate a JSON array of 4–10 steps for "Our Process". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
          Each: { "title": "Process step title related to ${mainCategory}", "description": "description totally related to title and ${mainCategory}", "iconClass": "fas fa-<icon-name>" }. 
          Output only JSON.`,
          'OurProcessSection',
          {
            userId: project.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'backgroundQueue',
            promptFor: 'OurProcessSection'
          }
        );
      } catch (e) {
        console.warn('OurProcessSection failed:', e.message);
      }

      try {
        cta = (
          await fetchJSONFromOpenAI(
            `Generate a JSON array of 5–6 CTA objects. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
            Each: { "title": "title related to ${mainCategory}", "description": "description totally related to title and ${mainCategory}", "iconClass": "fas fa-<icon-name>" }. 
            Output only the JSON array; don't use "shop now".`,
            'CTASection',
            {
              userId: project.userId,
              projectId,
              pageId: 'homepage',
              promptFrom: 'backgroundQueue',
              promptFor: 'CTASection'
            }
          )
        ).map((c, i) => ({ serialno: i + 1, ...c }));
      } catch (e) {
        console.warn('CTASection failed:', e.message);
      }

      try {
        featuresSection = (
          await fetchJSONFromOpenAI(
            `Generate a JSON array of 3 feature objects for homepage hero, each with:
            { "iconName": "CheckCircle", "title": "title related to ${mainCategory}...", "subtitle": "subtitle related to ${mainCategory} and title..." }.
            Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. Output only JSON array.`,
            'FeaturesSection',
            {
              userId: project.userId,
              projectId,
              pageId: 'homepage',
              promptFrom: 'backgroundQueue',
              promptFor: 'FeaturesSection'
            }
          )
        ).map((f, i) => ({ serialno: i + 1, ...f }));
      } catch (e) {
        console.warn('FeaturesSection failed:', e.message);
      }

      try {
        statsSection = (
          await fetchJSONFromOpenAI(
            `Generate a JSON array called StatsSection with exactly 4 statistic objects for the homepage hero. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. Use the Parent category to choose metrics that are relevant and dynamic. Each object must include:
            - "iconName": a unique icon name string (pick different ones; do NOT reuse "Users").
            - "value": a realistic, category-specific statistic, formatted with "+" or "K" as needed.
            - "label": a concise, descriptive label explaining the statistic, distinct for each object.
            Requirements:
            1. All 4 objects must have different iconName, value, and label.
            2. Choose icons from common sets (e.g. Briefcase, ChartLine, Clock, Trophy, Money, Cloud, ShoppingCart, Globe).
            3. Do NOT repeat any iconName or label.
            4. Values must reflect plausible metrics for the given Parent category.
            5. Output ONLY the JSON array (no extra text).`,
            'StatsSection',
            {
              userId: project.userId,
              projectId,
              pageId: 'homepage',
              promptFrom: 'backgroundQueue',
              promptFor: 'StatsSection'
            }
          )
        ).map((s, i) => ({ serialno: i + 1, ...s }));
      } catch (e) {
        console.warn('StatsSection failed:', e.message);
      }

      try {
        whyChooseUsAboutPage = await fetchJSONFromOpenAI(
          `Generate a JSON array of exactly 3 objects for "Why Choose Us" section on the About Page. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
          Each object should include:
          - "title": a benefit or unique quality about ${projectName} for Parent category ${mainCategory}
          - "description": a meaningful sentence (20–25 words) explaining why it's valuable to the customer
          - "iconClass": a valid FontAwesome icon in the form "fas fa-..."
          Strict Rule: each description must be exactly 20 to 25 words.
          Ensure the icons are appropriate and different.
          Output only the JSON array.`,
          'WhyChooseUsAboutPage',
          {
            userId: project.userId,
            projectId,
            pageId: 'aboutPage',
            promptFrom: 'backgroundQueue',
            promptFor: 'WhyChooseUsAboutPage'
          }
        );
      } catch (e) {
        console.warn('WhyChooseUsAboutPage fetch failed:', e.message);
        whyChooseUsAboutPage = [
          {
            iconClass: 'fas fa-user-check',
            title: 'Dedicated Expertise',
            description: 'Our skilled professionals bring experience and precision to every work, ensuring dependable results and peace of mind.'
          },
          {
            iconClass: 'fas fa-hand-holding-heart',
            title: 'Customer Commitment',
            description: 'We value long-term relationships and provide customer-first solutions tailored to your needs and satisfaction.'
          },
          {
            iconClass: 'fas fa-rocket',
            title: 'Efficient Delivery',
            description: 'From planning to execution, we prioritize timely completion and streamlined service for a hassle-free experience.'
          }
        ];
      }

      const generateUniqueDescription = async (index) => {
        const prompt = `Please write as a professional writer a 80–90 word engaging and unique website description for "${projectName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}. 
        We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the paragraph. Ensure the description is relevant and not repetitive.`;
        return fetchStringFromOpenAI(
          prompt,
          `ProjectDescription-${index + 1}`,
          {
            userId: project.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'backgroundQueue',
            promptFor: `ProjectDescription-${index + 1}`
          }
        );
      };

      const descriptionPromises = Array.from({ length: 5 }, (_, idx) =>
        generateUniqueDescription(idx)
      );
      descriptions = await Promise.all(descriptionPromises).then(ds => ds.map(strip));

      coreValuesIntro = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a one-sentence introduction for "Our Core Values". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Output only the sentence.`,
        'CoreValuesIntro',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'CoreValuesIntro'
        }
      ));

      coreValues = await fetchJSONFromOpenAI(
        `Generate a JSON array of exactly 6 objects for "Our Core Values". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.  
        Each object should have keys:
        - "title": one of [Customer First, Professional Team, Eco-Friendly, Quality Standards, Reliability, Trust & Safety]
        - "iconClass": a valid "fas fa-…" FontAwesome class related to the title
        - "description": a 20–25 word explanation for that title.
        Strict Rule: each description must be exactly 20 to 25 words.
        Output only the JSON array.`,
        'CoreValuesArray',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'CoreValuesArray'
        }
      );

      whatMakesUsDifferent = await fetchJSONFromOpenAI(
        `Generate a JSON array of exactly 6 objects for "What Makes Us Different". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
        Each object must contain:
        - "title": a unique reason that highlights differentiation in the context of ${mainCategory}
        - "description": a 20–25 word detailed explanation of that title and how it makes us different
        - "iconClass": a valid FontAwesome class in "fas fa-..." format matching the theme of the title
        Strict Rule: each description must be exactly 20 to 25 words.
        Ensure all titles and iconClass values are distinct. Output only the JSON array.`,
        'WhatMakesUsDifferent',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'WhatMakesUsDifferent'
        }
      );

      commitment = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer two 40-word paragraphs (80 words total) under the heading "Our Commitment to Excellence".  
        Use the copy from: "At our core, we believe … positive difference in our clients' lives."  
        Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 words total (two 40-word paragraphs). Output only the text and totally related to the website.`,
        'Commitment',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'Commitment'
        }
      ));

      // Updated Mission Sub-Headings
      try {
        let rawMissionSubHeadings = await fetchJSONFromOpenAI(
          `Generate a JSON array of exactly 3 strings for "Our Mission" sub-headings. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
          Based on: "To provide exceptional service in ${mainCategory} with sustainable practices."
          Each string must be a concise sub-heading (5-10 words), unique, with no repeated words across sub-headings.
          Strict Rule: each sub-heading must be exactly 5 to 10 words.
          Output ONLY a flat JSON array of 3 strings, e.g., ["Sub-heading 1", "Sub-heading 2", "Sub-heading 3"].`,
          'MissionSubs',
          {
            userId: project.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'backgroundQueue',
            promptFor: 'MissionSubs'
          }
        );
        // Validate output
        if (!Array.isArray(rawMissionSubHeadings) || rawMissionSubHeadings.length !== 3 || !rawMissionSubHeadings.every(s => typeof s === 'string')) {
          console.warn('Invalid missionSubHeadings format, using fallback');
          rawMissionSubHeadings = [
            `Exceptional ${mainCategory} Services`,
            'Sustainable Practice Commitment',
            'Community-Focused Impact'
          ];
        }
        missionSubHeadings = rawMissionSubHeadings;
      } catch (e) {
        console.warn('MissionSubs fetch failed, using fallback:', e.message);
        missionSubHeadings = [
          `Exceptional ${mainCategory} Services`,
          'Sustainable Practice Commitment',
          'Community-Focused Impact'
        ];
      }

      missionLine = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a single ~25-character line that encapsulates "Our Mission" above. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 25 characters. Output only the line.`,
        'MissionLine',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'MissionLine'
        }
      ));

      // Updated Vision Sub-Headings
      try {
        let rawVisionSubHeadings = await fetchJSONFromOpenAI(
          `Generate a JSON array of exactly 3 strings for "Our Vision" sub-headings. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}.
          Based on: "To be the most trusted provider for our community in ${mainCategory}."
          Each string must be a concise sub-heading (5-10 words), unique, with no repeated words across sub-headings.
          Strict Rule: each sub-heading must be exactly 5 to 10 words.
          Output ONLY a flat JSON array of 3 strings, e.g., ["Sub-heading 1", "Sub-heading 2", "Sub-heading 3"].`,
          'VisionSubs',
          {
            userId: project.userId,
            projectId,
            pageId: 'homepage',
            promptFrom: 'backgroundQueue',
            promptFor: 'VisionSubs'
          }
        );
        // Validate output
        if (!Array.isArray(rawVisionSubHeadings) || rawVisionSubHeadings.length !== 3 || !rawVisionSubHeadings.every(s => typeof s === 'string')) {
          console.warn('Invalid visionSubHeadings format, using fallback');
          rawVisionSubHeadings = [
            `Trusted ${mainCategory} Leader`,
            'Innovative Community Solutions',
            'Reliable Service Excellence'
          ];
        }
        visionSubHeadings = rawVisionSubHeadings;
      } catch (e) {
        console.warn('VisionSubs fetch failed, using fallback:', e.message);
        visionSubHeadings = [
          `Trusted ${mainCategory} Leader`,
          'Innovative Community Solutions',
          'Reliable Service Excellence'
        ];
      }

      visionLine = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a single ~25-character line that encapsulates "Our Vision" above. Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 25 characters. Output only the line.`,
        'VisionLine',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'VisionLine'
        }
      ));

      const seoPages = ['/', '/about', '/services', '/areas', '/contact', '/terms-conditions', '/privacy-policy'];
      for (let page of seoPages) {
        const pageName = page.replace('/', '').replace('-', ' ').toUpperCase();
        const seoContent = await fetchSeoContentForPage(
          pageName,
          mainCategory,
          projectName,
          {
            userId: project.userId,
            projectId,
            pageId: pageName,
            promptFrom: 'backgroundQueue',
            promptFor: `SEOContent-${pageName}`
          }
        );

        const seoData = new SeoSettings({
          page_url: page,
          meta_title: seoContent.meta_title,
          meta_description: seoContent.meta_description,
          meta_keywords: seoContent.meta_keywords,
          meta_image: '',
          canonical_url: '',
          projectId: projectId,
        });
        await seoData.save();

      }

      serviceHeroText = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer a catchy and engaging "Service Hero Text". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
        The text should be impactful, concise, and directly related to the core value. We need SEO optimized content. Output only the text.`,
        'ServiceHeroText',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'ServiceHeroText'
        }
      ));

      aboutHeroText = strip(await fetchStringFromOpenAI(
        `Please write as a professional writer an engaging "About Hero Text" For the website : "${projectName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
        The text should be captivating, concise, and reflect the mission and vision of the website. We need SEO optimized content. Output only the text.`,
        'AboutHeroText',
        {
          userId: project.userId,
          projectId,
          pageId: 'homepage',
          promptFrom: 'backgroundQueue',
          promptFor: 'AboutHeroText'
        }
      ));

      await UserProject.findByIdAndUpdate(projectId, {
        images,
        defaultFasFaIcon,
        icons: iconsArray,
        welcomeLine,
        projectSlogan,
        promiseLine,
        description,
        descriptions,
        ourGuaranteeText,
        heroHeading,
        aboutHeroText,
        serviceHeroText,
        ourGuaranteeSection,
        whyChooseUsSection,
        whyChooseUsAboutPage,
        ourProcessSection,
        cta,
        featuresSection,
        statsSection,
        coreValuesIntro,
        coreValues,
        whatMakesUsDifferent,
        commitment,
        missionSubHeadings,
        missionLine,
        visionSubHeadings,
        visionLine
      });

      console.log(`✅ Background processing complete for project ${projectId}`);
    }

    if (worktype === "areapages" && Array.isArray(job.data.locations)) {
      console.log(`[AreaPagesContent] Processing ${job.data.locations.length} locations for project ${projectId}`);
      for (const loc of job.data.locations) {
        const areaName = loc.name;
        const areaType = loc.areaType;
        const areaId = loc.id;
        
        console.log(`[AreaPagesContent] Starting processing - areaName: ${areaName}, areaId: ${areaId} (type: ${typeof areaId}), areaType: ${areaType}`);


        const slugDoc = await Slug.findOne({
          projectId: projectId,
          locationId: areaId,
          slugType: areaType
        });
        let slug

        if (slugDoc) {
          console.log("Found slug:", slugDoc.slug);
          slug = slugDoc.slug;

        }




        console.log(`[AreaPagesContent] Processing ${areaType} - areaId: ${areaId}, areaName: ${areaName}`);
        
        const existingData = await AreaPagesContent.findOne({
          projectId: projectId,
          areaId: loc.id,
          areaType: areaType
        });

        if (!existingData) {
          console.log(`[AreaPagesContent] Not found existing record for ${areaType} - areaId: ${areaId}, areaName: ${areaName}`);


          const areaHeroHeading = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a 5-6 word impactful hero heading for our website : ${projectName} whose service is  "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 5 to 6 words. Output only the heading.`,
            'AreaHeroHeading',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaHeroHeading'
            }
          ));

          const areaHeroSubheading = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a 15-18 word hero subheading for our website : ${projectName} whose service is "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 15 to 18 words. Output only the subheading.`,
            'AreaHeroSubheading',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaHeroSubheading'
            }
          ));

          const areaWelcomeLine = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a welcoming one-liner (80-90 chars) for our website : ${projectName} whose service is "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 characters. Output only the line.`,
            'AreaWelcomeLine',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaWelcomeLine'
            }
          ));

          const areaPromiseLine = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a 60-70 word promise line for our website : ${projectName} whose service is  "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 60 to 70 words. Output only the paragraph.`,
            'AreaPromiseLine',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaPromiseLine'
            }
          ));

          const areaDescription = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a unique 80-90 word homepage description for our website : ${projectName} whose service is  "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the paragraph.`,
            'AreaDescription',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaDescription'
            }
          ));

          const areaDescriptionPromises = Array.from({ length: 3 }, (_, idx) =>
            fetchStringFromOpenAI(
              `Please write as a professional writer a unique 80-90 word description for our website : ${projectName} whose service is  "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the paragraph.`,
              `AreaDescription-${idx + 1}`,
              {
                userId: project.userId,
                projectId,
                pageId: `area-${loc.id}`,
                promptFrom: 'backgroundQueue',
                promptFor: `AreaDescription-${idx + 1}`
              }
            )
          );


          let areaStatsSection = [];
          try {
            const rawStats = await fetchJSONFromOpenAI(
              `Generate a JSON array of exactly 4 statistic objects for "${mainCategory}" in "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. Each object must include:
              - "iconName": a valid FontAwesome icon (e.g. "fas fa-chart-line")
              - "value": a realistic metric for this category in this area
              - "label": a concise label explaining the metric
              Output only the JSON array.`,
              'AreaStatsSection',
              {
                userId: project.userId,
                projectId,
                pageId: `area-${loc.id}`,
                promptFrom: 'backgroundQueue',
                promptFor: 'AreaStatsSection'
              }
            );
            areaStatsSection = rawStats.map((s, i) => ({ serialno: i + 1, ...s }));
          } catch (e) {
            console.warn('AreaStatsSection generation failed:', e.message);
          }

          const areaDescriptions = await Promise.all(areaDescriptionPromises).then(descriptions => descriptions.map(strip));

          const areaSeoContent = await fetchSeoContentForPage(
            areaName,
            mainCategory,
            projectName,
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: `SEOContent-${areaName}`
            }
          );

          const areaGuaranteeText = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer an 80–90 word "Our Guarantee" text for our website : ${projectName} whose service is "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the text.`,
            'AreaGuaranteeText',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaGuaranteeText'
            }
          ));

          // ─── generate second guarantee text ───
          const areaGuaranteeText2 = strip(await fetchStringFromOpenAI(
            `Please write as a professional writer a DIFFERENT 80–90 word "Our Guarantee" text for our website : ${projectName} whose service is "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. We need SEO optimized content. Strict Rule: we need exact 80 to 90 words. Output only the text.`,
            'AreaGuaranteeText2',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'AreaGuaranteeText2'
            }
          ));







          const areaGuaranteeSection = (
            await fetchJSONFromOpenAI(
              `Generate a JSON array of exactly 4 objects for "Our Guarantee" section for "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
            Each: { "title": "...", "description": "...", "iconClass": "fas fa-tools" }.
            Output only JSON.`,
              'OurGuaranteeSection',
              {
                userId: project.userId,
                projectId,
                pageId: `area-${loc.id}`,
                promptFrom: 'backgroundQueue',
                promptFor: 'OurGuaranteeSection'
              }
            )
          ).map((g, i) => ({ serialno: i + 1, ...g }));

          const areaWhyChooseUsSection = await fetchJSONFromOpenAI(
            `Generate a JSON array of 5–10 objects for "Why Choose Us" for "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
          Each: { "title": "...", "description": "...", "iconClass": "fas fa-..." }.
          Output only JSON.`,
            'WhyChooseUsSection',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'WhyChooseUsSection'
            }
          );

          const areaProcessSection = await fetchJSONFromOpenAI(
            `Generate a JSON array of 4–10 steps for "Our Process" for "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
          Each: { "title": "...", "description": "...", "iconClass": "fas fa-..." }.
          Output only JSON.`,
            'OurProcessSection',
            {
              userId: project.userId,
              projectId,
              pageId: `area-${loc.id}`,
              promptFrom: 'backgroundQueue',
              promptFor: 'OurProcessSection'
            }
          );

          const areaCta = (
            await fetchJSONFromOpenAI(
              `Generate a JSON array of 5–6 CTA objects for "${mainCategory}" in area : "${areaName}". Parent category is ${mainCategory}. Focused category is ${focusCategory}, Focus keywords are ${focusKeyword || 'N/A'}., SEO keywords are ${projectKeywordsText || 'N/A'}. Categories: ${(categories || []).join(', ')}. Subcategories: ${subcategorieslist || 'N/A'}, website name is ${projectName}. 
            Each: { "title": "...", "description": "...", "serialno": n }.
            Output only JSON. Important: don't mention any date, offer, numeric values, etc.`,
              'CTASection',
              {
                userId: project.userId,
                projectId,
                pageId: `area-${loc.id}`,
                promptFrom: 'backgroundQueue',
                promptFor: 'CTASection'
              }
            )
          ).map((c, i) => ({ serialno: i + 1, title: c.title, description: c.description }));

          const areaContentData = {
            projectId: projectId,
            areaId: loc.id,
            areaType: loc.areaType,
            ...(loc.slug ? { slug: loc.slug } : {}),
            meta_title: areaSeoContent.meta_title,
            meta_description: areaSeoContent.meta_description,
            meta_keywords: Array.isArray(areaSeoContent.meta_keywords)
              ? areaSeoContent.meta_keywords
              : (typeof areaSeoContent.meta_keywords === "string"
                ? areaSeoContent.meta_keywords.split(",").map(x => x.trim())
                : []),
            heroHeading: areaHeroHeading,
            heroSubheading: areaHeroSubheading,
            heroImages: images.map(img => img.url),
            welcomeLine: areaWelcomeLine,
            promiseLine: areaPromiseLine,
            cta: areaCta,
            featuresSection,
            statsSection: areaStatsSection,
            description: areaDescription,
            descriptions: areaDescriptions,
            ourGuaranteeText: areaGuaranteeText,
            ourGuaranteeText2: areaGuaranteeText2,
            ourGuaranteeSection: areaGuaranteeSection,
            ourGuaranteesImage: [],
            ourProcessImage: [],
            scheduleServiceImage: [],
            whyChooseUsImage: [],
            whyChooseUsSection: areaWhyChooseUsSection,
            ourProcessSection: areaProcessSection,
            steps_icons: [],
            locInfo: {
              name: loc.name,
              ...(loc.lat ? { lat: loc.lat } : {}),
              ...(loc.lng ? { lng: loc.lng } : {}),
            }
          };

          try {
            const savedAreaPage = await AreaPagesContent.findOneAndUpdate(
              { projectId: projectId, areaId: loc.id, areaType: areaType },
              { $set: areaContentData },
              { upsert: true, new: true }
            );

            if (savedAreaPage) {
              console.log(`[AreaPagesContent] ✅ Successfully saved/updated ${areaType} - areaId: ${savedAreaPage.areaId} (type: ${typeof savedAreaPage.areaId}), areaType: ${savedAreaPage.areaType}, _id: ${savedAreaPage._id}`);
            } else {
              console.error(`[AreaPagesContent] ❌ Failed to save - findOneAndUpdate returned null for ${areaType} - areaId: ${loc.id}`);
            }
          } catch (saveError) {
            console.error(`[AreaPagesContent] ❌ Error saving AreaPagesContent for ${areaType} - areaId: ${loc.id}:`, saveError);
            throw saveError;
          }

          let page_url = `/${slug}`


          const metaKeywordsStr = Array.isArray(areaSeoContent.meta_keywords)
            ? areaSeoContent.meta_keywords
              .map(x => String(x).trim())
              .filter(Boolean)
              .join(", ")
            : (typeof areaSeoContent.meta_keywords === "string"
              ? areaSeoContent.meta_keywords
                .split(/[,\n]/)                        // split on commas or new lines
                .map(s => s.replace(/^[\s'"]+|[\s'"]+$/g, "")) // trim spaces/quotes
                .filter(Boolean)
                .join(", ")
              : "");

          const seoData = new SeoSettings({
            page_url: page_url,
            meta_title: areaSeoContent.meta_title,
            meta_description: areaSeoContent.meta_description,
            meta_keywords: metaKeywordsStr,   // <-- now a String
            meta_image: '',
            canonical_url: '',
            projectId: projectId,
          });
          await seoData.save();




          console.log(`✅ Upserted AreaPagesContent for ${areaName} (${areaType})`);
        } else {
          console.log(`[AreaPagesContent] Record already exists for ${projectId} + ${areaId} (${areaType})`);
        }

      }
    }
  } catch (err) {
    console.error(`❌ Job error for project ${projectId}:`, err);
    throw err;
  }
});

module.exports = projectBackgroundQueue;