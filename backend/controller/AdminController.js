const User = require("../models/users")
const fs = require('fs-extra');
const { Readable } = require('stream');
const path = require('path');
const unzipper = require('unzipper');
const ftp = require('basic-ftp'); // ✅ Required for FTP connections
const SftpClient = require('ssh2-sftp-client'); // ✅ Required for SSH/SFTP
const { deployReactApp } = require('../additional/deployHelper');  // Adjust the path if needed
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { isValidObjectId, Types } = mongoose;
const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client();
const helper = require("../additional/addon");
const Users = require("../models/users")
const UserSiteContent = require('../models/UserSiteContent');
const userProjects = require("../models/userProjects");
const Blog = require("../models/blogs")
// at top of file
const SectionOrder = require('../models/SectionOrder');
const ThemeData = require("../models/themeData")
const Theme = require("../models/Theme")
const UserProject = require('../models/userProjects'); // Import UserProject model
const Country = require("../models/adminCountires")
const State = require("../models/adminStates");
const City = require("../models/adminCities");
const Author = require("../models/authors")
const AdminLocalArea = require('../models/adminLocalAreas'); // add this alongside your other model imports
const BusinessLocation = require('../models/businessLocation');
const WebsiteSection = require("../models/websiteSections");
const AboutUs = require("../models/aboutus");
const SeoSettings = require("../models/seoSettings")
const ThemeSetting = require("../models/themeSettings")
const ProjectDeployment = require("../models/ProjectDeployment");
const Slug = require("../models/slug")
const SiteHeaderFooter = require("../models/siteHeaderFooter")
const WebsitePage = require("../models/WebsitePage")
const { getResponseFromOpenAI } = require("../openAi/openAi")


const SectionContent = require("../models/SectionContent");
const secretKey = process.env.JWT_SECRET
const HostingConnection = require('../models/HostingConnection');
const CreditsUsage = require("../models/CreditsUsage")
const ProjectCategory = require("../models/ProjectCategory");
const SubCategory = require("../models/SubCategory");
const MicroCategory = require("../models/MicroCategory");

const WebsiteComponent = require("../models/WebsiteComponent");
const WebsiteDesignsData = require("../models/WebsiteDesignsData");
const WebsiteElement = require("../models/WebsiteElement");
const BuilderElement = require("../models/BuilderElement");

// Helper function to ensure page exists in WebsiteDesignsData
async function ensurePageInDesignData(projectId, pageId) {
    try {
        // Find or create WebsiteDesignsData for this project
        let designData = await WebsiteDesignsData.findOne({ projectId });

        if (!designData) {
            // Get userId from project
            const project = await userProjects.findById(projectId);
            if (!project) {
                console.error('[ensurePageInDesignData] Project not found:', projectId);
                return;
            }

            // Create new WebsiteDesignsData with default values
            designData = new WebsiteDesignsData({
                projectId: projectId,
                userId: project.userId || project.user,
                colorScheme: 'default',
                pages: []
            });
        }

        // Check if page already exists in pages array
        const pageExists = designData.pages.some(
            p => p.pageId && p.pageId.toString() === pageId.toString()
        );

        if (!pageExists) {
            // Add page to pages array
            designData.pages.push({
                pageId: pageId,
                style: {},
                componentIds: []
            });
            await designData.save();
            console.log('[ensurePageInDesignData] Page added to WebsiteDesignsData:', pageId);
        } else {
            console.log('[ensurePageInDesignData] Page already exists in WebsiteDesignsData:', pageId);
        }
    } catch (error) {
        console.error('[ensurePageInDesignData] Error:', error);
        // Don't throw - this is a helper function, we don't want to break the main flow
    }
}
const {
    fetchJSONFromOpenAI,
    fetchStringFromOpenAI,
    fetchSeoContentForPage,
    getResponseFromOpenAITracked
} = require('../additional/openaiHelpers');

const {
    testFTPConnection,
    testSSHConnection,
    testCpanelConnection,
    uploadFolderFTP,
    uploadFolderSFTP,
    uploadToCPanel,
    uploadFolderCPanel,
    uploadFileCPanel

} = require('../additional/connectionHelpers');


const redisQueue = require("../queue/redisQueue");
const generateServiceDescQueue = require("../queue/redisServiceDesc")
const addNewServicesQueue = require("../queue/addNewServicesQueue")
const Service = require("../models/service")
const Notification = require("../models/notification")

const axios = require('axios');
const { json } = require("express");
const LOCATIONIQ_API_KEY = process.env.LOCATIONIQ_API_KEY;
const slugify = require("../additional/slugify");

const projectBackgroundQueue = require("../queue/projectBackgroundQueue");
const redislatlngqueueQueue = require("../queue/queuelatlng")
// Helper function to ensure component exists in WebsiteComponent (create if not exists with variant "a")
async function ensureComponentExists(componentName, uniqueId = null) {
    const normalizedName = componentName.toLowerCase().trim().replace(/-/g, '_');

    // Generate uniqueId if not provided (format: {name}_a)
    if (!uniqueId) {
        uniqueId = `${normalizedName}_a`;
    } else {
        uniqueId = uniqueId.toLowerCase().trim().replace(/-/g, '_');
    }

    // Extract variant from uniqueId (e.g., "hero_a" -> "a")
    const variant = uniqueId.split('_').slice(1).join('_') || 'a';

    // Check if component exists
    let component = await WebsiteComponent.findOne({ name: normalizedName });

    if (!component) {
        // Create new component with variant "a"
        component = new WebsiteComponent({
            name: normalizedName,
            variants: [{
                uniqueId: uniqueId,
                status: 1 // Enabled
            }]
        });
        await component.save();
        console.log(`[ensureComponentExists] Created new component: ${normalizedName} with variant ${variant}`);
    } else {
        // Check if variant exists in component
        const variantExists = component.variants && component.variants.some(v => v.uniqueId === uniqueId);

        if (!variantExists) {
            // Add variant to existing component
            if (!component.variants) {
                component.variants = [];
            }
            component.variants.push({
                uniqueId: uniqueId,
                status: 1 // Enabled
            });
            await component.save();
            console.log(`[ensureComponentExists] Added variant ${variant} to existing component: ${normalizedName}`);
        }
    }

    return component;
}

async function upsertContactUsFAQ({ project, email, phone, mainLocation }) {
    // Build the prompt to generate location-aware, contact-aware FAQs
    const prompt = `
Generate a JSON array of 6–8 FAQ objects for a Contact Us page.
Each object must have:
- "question": a clear, self-contained question about contacting or reaching the company
- "answer": 45–70 words, no pricing, no dates, no legal claims. Be helpful and specific.
Use the following details naturally where relevant (do not repeat them in every answer):
- Email: ${email || 'N/A'}
- Phone: ${phone || 'N/A'}
- Main Location: ${mainLocation || 'N/A'}
- Project Name: ${project.projectName}
- Service Type: ${project.serviceType}

Style notes:
- Keep language simple and professional.
- Prefer practical guidance (response times, what info to include in an email/call).
- Avoid hard promises and avoid ending every sentence with the exact contact info; weave it in where it fits also avoid the other personal info or details like availability or other things.

Return ONLY a flat JSON array like:
[
  {"question":"...","answer":"..."},
  {"question":"...","answer":"..."}
]
  `.trim();

    let faqs;
    try {
        faqs = await fetchJSONFromOpenAI(
            prompt,
            'FAQ',
            {
                userId: project.userId,
                projectId: project._id?.toString?.() || project.id,
                pageId: 'contact-us',
                promptFrom: 'controller',
                promptFor: 'Contact Us FAQ'
            }
        );
        if (!Array.isArray(faqs) || faqs.length === 0) {
            throw new Error('Empty or invalid FAQ payload from OpenAI');
        }
    } catch (e) {
        console.warn('[ContactUs FAQ] generation failed:', e.message);
        return; // Fail soft; do not block AboutUs update
    }

    // Upsert WebsiteSection for Contact page FAQs
    const filter = {
        projectId: project._id || project.id,
        sectionTitle: 'FAQ',
        referencePage: 'contact'
    };

    const update = {
        $set: {
            sectionTitle: 'FAQ',
            sectionContent: faqs,
            referencePage: 'contact',
            projectId: project._id || project.id
        }
    };

    const options = { upsert: true, new: true };

    try {
        const doc = await WebsiteSection.findOneAndUpdate(filter, update, options);
        console.log('[ContactUs FAQ] upserted, _id =', doc?._id?.toString?.());
    } catch (err) {
        console.error('[ContactUs FAQ] upsert failed:', err.message);
    }
}


const sharp = require('sharp');


const cleanOneLine = (s = "") =>
    String(s).replace(/^[\s"'"“"‘'`]+|[\s"'"“"‘'`]+$/g, "").replace(/\s+/g, " ").trim();


const normalizeArray = (input, fieldName, mandatory = false) => {
    if (!input) {
        if (mandatory) throw new Error(`${fieldName} is required`);
        return [];
    }

    let arr = [];
    if (typeof input === 'string') {
        try {
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) arr = parsed;
            else arr = [parsed];
        } catch {
            // single string, wrap in array
            arr = [input];
        }
    } else if (Array.isArray(input)) {
        arr = input;
    } else {
        arr = [String(input)];
    }

    // Trim strings and remove empty
    arr = arr.map(v => String(v).trim()).filter(Boolean);

    if (mandatory && arr.length === 0) throw new Error(`${fieldName} cannot be empty`);
    return arr;
};

module.exports = {

    getDashboardStats: async (req, res) => {
        try {
            const userId = req.user.userId;

            // Get counts
            const totalUsers = await Users.countDocuments();
            const totalProjects = await userProjects.countDocuments({ userId });
            const totalThemes = await Theme.countDocuments();

            return res.status(200).json({
                success: true,
                data: {
                    totalUsers,
                    totalProjects,
                    totalThemes
                }
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard statistics',
                error: error.message
            });
        }
    },

    uploadFileapi: async (req, res) => {
        try {
            const file = req?.files?.file; // express-fileupload: field name "file"
            if (!file) {
                return helper.sendError(res, 400, 'file is required');
            }

            const folderPath = 'public/files/';

            // If it's an image -> convert to WebP, then upload as a stream.
            if (file.mimetype && file.mimetype.startsWith('image/')) {
                // express-fileupload gives either tempFilePath (when useTempFiles:true) or data (Buffer)
                const input = file.tempFilePath ? file.tempFilePath : file.data;
                if (!input) {
                    return helper.sendError(res, 400, 'No valid image input (tempFilePath or data) found.');
                }

                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`,     // your helper uses file.name
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream                              // your helper accepts file.stream
                };

                const savedName = await helper.uploadFile(webpFile, folderPath, null); // <- removed imgResp
                const url = `/files/${savedName}`;
                return helper.sendSuccess(res, 201, 'File uploaded successfully!!', { url });
            }

            // Non-image: pass through as-is
            // Your helper accepts either tempFilePath or stream. Prefer tempFilePath if present.
            let savedName;
            if (file.tempFilePath) {
                savedName = await helper.uploadFile(file, folderPath, null);
            } else if (file.data) {
                const stream = Readable.from(file.data);
                const passthrough = {
                    name: file.name,
                    mimetype: file.mimetype,
                    size: file.size,
                    stream
                };
                savedName = await helper.uploadFile(passthrough, folderPath, null);
            } else {
                return helper.sendError(res, 400, 'No valid file stream or tempFilePath found.');
            }

            const url = `/files/${savedName}`;
            return helper.sendSuccess(res, 201, 'File uploaded successfully!!', { url });
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error?.message || 'Upload failed');
        }
    },
    openai: async (req, res) => {
        try {
            let prompt = req.body.prompt;
            if (!prompt) { throw "prompt is required" }

            const userId = req.user?.userId || req.body.userId || null;
            const projectId = req.body.projectId || null;

            const OpenAiResponse = await getResponseFromOpenAITracked(
                prompt,
                'OpenAIContentGeneration',
                {
                    userId,
                    projectId: projectId || 'general',
                    pageId: req.body.pageId || projectId || 'general',
                    promptFrom: req.body.promptFrom || 'admin_panel',
                    promptFor: req.body.promptFor || 'content_generation'
                }
            );

            return helper.sendSuccess(res, 201, 'Content generated Sucessfuly!!', OpenAiResponse);

        }
        catch (error) {
            console.error(error);
            return helper.sendError(res, 500, error);
        }

    },

    getFocusedKeyword: async (req, res) => {
        // console.log("right destination",req.body); return

        try {
            let { serviceType, projectName, categories, subCategories, microCategories } = req.body;

            categories = normalizeArray(categories, 'categories', false);
            subCategories = normalizeArray(subCategories, 'subCategories', false);
            microCategories = normalizeArray(microCategories, 'microCategories', false);





            let mainCategory = categories.length > 0 ? categories[0] : "";
            const subcategorieslist = []
                .concat(subCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            const microcategorieslist = []
                .concat(microCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');
            console.log(mainCategory, subcategorieslist, "sub<<< adn micro>>>", microcategorieslist, "<fast<<");

            if (!serviceType || !projectName) {
                return res.status(400).json({
                    message: 'serviceType, projectName are required'
                });
            }
            let userId = req.user.userId
            let label = "FOCUS KEYWROD"
            let promptFrom = "getFocusedKeyword"
            let promptFor = projectName
            let projectId = projectName
            let pageId = projectName

            let focusCategory = microcategorieslist || subcategorieslist || '';
            let prompt = `Suggest the best primary SEO keyword phrase (up to 5 words) for a website with the project name "${projectName}". The website is in the "${mainCategory}" category and focuses on "${focusCategory}". Return only the keyword phrase, without any extra explanation or punctuation.`;

            const result = await fetchStringFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });

            return res.status(200).json({
                message: 'Focused Keyword fetched successfully',
                data: result
            });


        }
        catch (error) {
            console.error('Error in getUsageByProject:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while fetching OpenAI usage.' });
        }
    },


    getProjectKeywords: async (req, res) => {
        try {
            let { projectName, serviceType, focusKeyword, count, categories, subCategories, microCategories } = req.body;


            categories = normalizeArray(categories, 'categories', false);
            subCategories = normalizeArray(subCategories, 'subCategories', false);
            microCategories = normalizeArray(microCategories, 'microCategories', false);


            let mainCategory = categories.length > 0 ? categories[0] : "";
            const subcategorieslist = []
                .concat(subCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            const microcategorieslist = []
                .concat(microCategories || [])
                .map(v => String(v).trim())
                .filter(Boolean)
                .join(', ');

            // console.log(mainCategory, subcategorieslist, "sub<<< adn micro>>>", microcategorieslist, "<fast<<"); return


            if (!projectName || !serviceType) {
                return res.status(400).json({
                    message: 'projectName and serviceType are required'
                });
            }

            // Optional: how many keywords to generate (default 8; clamp 3..15)
            const n = Math.max(3, Math.min(Number(count) || 8, 15));

            // audit/meta (same style as your existing calls)
            const userId = req.user?.userId;
            const label = 'PROJECT_KEYWORDS';
            const promptFrom = 'getProjectKeywords';
            const promptFor = projectName;
            const projectId = projectName;
            const pageId = projectName;

            // Prompt: force *only* a JSON array of strings
            let focusCategory = microcategorieslist || subcategorieslist || '';

            const prompt = `
            Return ONLY a JSON array of ${n} SEO keywords (2–4 words each) for a website with the project name "${projectName}". 
            The site is in the "${mainCategory}" category and focuses on "${focusCategory}".
            ${focusKeyword ? `Include close variants of the focus keyword "${focusKeyword}" near the beginning.` : ''}
            Do not include any explanations, keys, or objects—just a raw JSON array of strings.
            `.trim();


            let result = await fetchJSONFromOpenAI(
                prompt,
                label,
                { userId, projectId, pageId, promptFrom, promptFor }
            );

            // Defensive: ensure we end with a string[] cleanly
            if (typeof result === 'string') {
                try { result = JSON.parse(result); } catch (_) { /* fall through */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: 'Model did not return a JSON array.' });
            }

            // Sanitize items -> strings, trimmed, non-empty, unique
            const cleaned = Array.from(
                new Set(
                    result
                        .map(x => String(x || '').replace(/\s+/g, ' ').trim())
                        .filter(x => x.length > 0)
                )
            );

            return res.status(200).json({
                message: 'Keywords generated successfully',
                data: cleaned
            });
        } catch (error) {
            console.error('Error in getProjectKeywords:', error);
            return res.status(500).json({ message: 'Failed to generate keywords' });
        }
    },

    /* --- Generate Blog Meta Title --- */
    getBlogMetaTitle: async (req, res) => {
        try {
            const { title, type } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const userId = req.user?.userId;
            const label = "BLOG_META_TITLE";
            const promptFrom = "getBlogMetaTitle";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Write a concise SEO meta title for a blog post.
Inputs:
- Post title: "${title}"
- Content type/niche: "${type}"

Rules:
- Aim ≤ 60 characters (hard max 65).
- Use Title Case.
- Include the core idea from the post title.
- No brand name, quotes, emojis, or trailing punctuation.
- Return ONLY the title as plain text (no JSON, no extra words).
      `.trim();

            let result = await fetchStringFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            // sanitize and softly enforce 65-char cap
            let out = cleanOneLine(result);
            const MAX = 65;
            if (out.length > MAX) out = out.slice(0, MAX).replace(/\s+\S*$/, "");

            return res.status(200).json({
                message: "Meta title generated successfully",
                data: out,
            });
        } catch (error) {
            console.error("Error in getBlogMetaTitle:", error);
            return res.status(500).json({ message: "Failed to generate meta title" });
        }
    },

    /* --- Generate Blog Meta Keywords --- */
    getBlogMetaKeywords: async (req, res) => {
        try {
            const { title, type, focusKeyword, count } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const n = Math.max(3, Math.min(Number(count) || 8, 15));

            const userId = req.user?.userId;
            const label = "BLOG_META_KEYWORDS";
            const promptFrom = "getBlogMetaKeywords";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Return ONLY a JSON array of ${n} SEO meta keywords (2–4 words each) for a blog post.
Context:
- Post title: "${title}"
- Content type/niche: "${type}"
${focusKeyword ? `- Optional focus keyword: "${focusKeyword}" (include close variants near the start)` : ""}

Strict rules:
- JSON array of strings ONLY (e.g., ["keyword one","keyword two"]).
- No explanations, no keys, no objects, no trailing text.
      `.trim();

            let result = await fetchJSONFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch (_) { /* ignore */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: "Model did not return a JSON array." });
            }

            // sanitize -> unique string[]
            const cleaned = Array.from(new Set(
                result
                    .map(x => String(x || "").replace(/\s+/g, " ").trim())
                    .filter(x => x.length > 0)
            ));

            return res.status(200).json({
                message: "Meta keywords generated successfully",
                data: cleaned,
            });
        } catch (error) {
            console.error("Error in getBlogMetaKeywords:", error);
            return res.status(500).json({ message: "Failed to generate meta keywords" });
        }
    },

    /* --- Generate Blog Meta Description --- */
    getBlogMetaDescription: async (req, res) => {
        try {
            const { title, type } = req.body;
            if (!title || !type) {
                return res.status(400).json({ message: "title and type are required" });
            }

            const userId = req.user?.userId;
            const label = "BLOG_META_DESCRIPTION";
            const promptFrom = "getBlogMetaDescription";
            const promptFor = title;
            const projectId = req.body.projectId || type;
            const pageId = title;

            const prompt = `
Write a compelling SEO meta description for a blog post.
Inputs:
- Post title: "${title}"
- Content type/niche: "${type}"

Rules:
- 150–160 characters preferred (hard max 160).
- Active voice; clear benefit; natural keyword use from the title.
- No quotes, emojis, or call-to-action spam.
- Return ONLY the sentence as plain text (no JSON, no extra words).
      `.trim();

            let result = await fetchStringFromOpenAI(prompt, label, {
                userId, projectId, pageId, promptFrom, promptFor,
            });

            let out = cleanOneLine(result);
            const MAX = 160;
            if (out.length > MAX) out = out.slice(0, MAX).replace(/\s+\S*$/, "");

            return res.status(200).json({
                message: "Meta description generated successfully",
                data: out,
            });
        } catch (error) {
            console.error("Error in getBlogMetaDescription:", error);
            return res.status(500).json({ message: "Failed to generate meta description" });
        }
    },
    generateImage: async (req, res) => {
        try {
            const { prompt } = req.body;
            if (!prompt) {
                return res.status(400).json({ message: "prompt is required" });
            }

            const API_KEY = process.env.GEMINI_API_KEY;
            if (!API_KEY) {
                return res.status(500).json({ message: "GEMINI_API_KEY is not configured" });
            }

            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(API_KEY);

            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });
            const result = await model.generateContent(prompt);
            const response = await result.response;

            // Extract token usage information from response
            // usageMetadata can be in result.response or response object
            const usageMetadata = result.response?.usageMetadata || response?.usageMetadata || result?.usageMetadata || {};
            const inputTokens = usageMetadata.promptTokenCount || 0;
            const outputTokens = usageMetadata.candidatesTokenCount || 0;
            const totalTokens = usageMetadata.totalTokenCount || (inputTokens + outputTokens);

            // Pricing per million tokens (as per official Gemini pricing)
            // Text: Input: $0.30 / Output: $2.50 per million
            // Image: Input: $0.30 / Output: $0.039 per million (per image)
            // Since we're inputting text (prompt) and getting image output:
            const inputPricePerMillion = 0.30; // USD per million tokens (text input)
            const outputPricePerMillion = 0.039; // USD per million tokens (image output)

            // Calculate costs in USD
            const inputCostUSD = (inputTokens / 1_000_000) * inputPricePerMillion;
            const outputCostUSD = (outputTokens / 1_000_000) * outputPricePerMillion;
            const totalCostUSD = inputCostUSD + outputCostUSD;

            // Convert to INR (using approximate rate: 1 USD = 83 INR)
            const usdToInrRate = 83;
            const inputCostINR = inputCostUSD * usdToInrRate;
            const outputCostINR = outputCostUSD * usdToInrRate;
            const totalCostINR = totalCostUSD * usdToInrRate;

            // Log token usage and pricing information
            console.log('\n========== Gemini Image Generation Token Usage ==========');
            console.log(`📊 Input Tokens:  ${inputTokens.toLocaleString()}`);
            console.log(`📊 Output Tokens: ${outputTokens.toLocaleString()}`);
            console.log(`📊 Total Tokens:  ${totalTokens.toLocaleString()}`);
            console.log('\n💰 Cost Breakdown:');
            console.log(`   Input Cost:  $${inputCostUSD.toFixed(6)} (₹${inputCostINR.toFixed(4)})`);
            console.log(`   Output Cost: $${outputCostUSD.toFixed(6)} (₹${outputCostINR.toFixed(4)})`);
            console.log(`   Total Cost:  $${totalCostUSD.toFixed(6)} (₹${totalCostINR.toFixed(4)})`);
            console.log('==========================================================\n');

            // Extract image data from response structure
            const candidate = response.candidates?.[0];
            if (!candidate || !candidate.content || !candidate.content.parts) {
                return res.status(500).json({
                    message: "Failed to generate image: Invalid response structure",
                    error: "No image data found in response"
                });
            }

            // Find the part containing image data
            const imagePart = candidate.content.parts.find(part => part.inlineData);
            if (!imagePart || !imagePart.inlineData) {
                // If no inlineData, check if there's text that might contain image reference
                const textPart = candidate.content.parts.find(part => part.text);
                if (textPart && textPart.text) {
                    return res.status(500).json({
                        message: "Image generation returned text instead of image data",
                        error: textPart.text,
                        note: "The model may not support image generation or returned a text response"
                    });
                }
                return res.status(500).json({
                    message: "Failed to generate image: No image data found",
                    error: "Response does not contain image data"
                });
            }

            // Extract base64 image data
            const base64Image = imagePart.inlineData.data;
            const mimeType = imagePart.inlineData.mimeType || 'image/png';

            // Convert base64 to Buffer
            const imageBuffer = Buffer.from(base64Image, 'base64');

            // Determine file extension from mimeType
            const extension = mimeType.split('/')[1] || 'png';
            const fileName = `generated_${Date.now()}.${extension}`;

            // Create file object for upload
            const fileObject = {
                name: fileName,
                mimetype: mimeType,
                buffer: imageBuffer
            };

            // Upload file to server
            const folderPath = 'public/files/generated-images';
            const savedFileName = await helper.uploadFile(fileObject, folderPath, null);

            // Construct the URL
            // Default to localhost:1111, use live URL only if USE_LIVE_IMAGE_URL=true in .env (line 27)
            const useLiveUrl = process.env.USE_LIVE_IMAGE_URL === 'true';
            const baseUrl = useLiveUrl 
                ? (process.env.BASE_URL || 'https://apis.smartlybuild.dev')
                : 'http://localhost:1111';
            const imageUrl = `${baseUrl}/files/generated-images/${savedFileName}`;

            return res.status(200).json({
                message: "Image generated successfully",
                data: {
                    imageUrl: imageUrl,
                    fileName: savedFileName,
                    mimeType: mimeType,
                    prompt: prompt,
                    tokenUsage: {
                        inputTokens: inputTokens,
                        outputTokens: outputTokens,
                        totalTokens: totalTokens
                    },
                    cost: {
                        usd: {
                            input: inputCostUSD,
                            output: outputCostUSD,
                            total: totalCostUSD
                        },
                        inr: {
                            input: inputCostINR,
                            output: outputCostINR,
                            total: totalCostINR
                        }
                    }
                }
            });

        } catch (error) {
            console.error("Error in generateImage:", error);
            return res.status(500).json({
                message: "Failed to generate image",
                error: error.message
            });
        }
    },


    getLocalAreasWithPincodes: async (req, res) => {
        try {
            let { cityId, count } = req.body;

            if (!cityId) {
                return res.status(400).json({ message: "cityId is required" });
            }

            // Parse and validate count - default to 1, clamp between 1-50
            const parsedCount = count !== undefined && count !== null ? Number(count) : 1;
            const n = Math.max(1, Math.min(isNaN(parsedCount) ? 1 : parsedCount, 50));

            console.log("Generating local areas with pincodes for cityId:", cityId, "count:", n);

            // Fetch city->state->country text for prompt
            async function getAddressByCityId(cityId) {
                const city = await City.findOne({ id: cityId }).lean();
                if (!city) return null;
                const state = await State.findOne({ id: city.state_id }).lean();
                const country = state ? await Country.findOne({ id: state.country_id }).lean() : null;
                return `${city.name}, ${state?.name || ""}, ${country?.name || ""}`;
            }

            const address = await getAddressByCityId(cityId);
            console.log("Derived address for prompt:", address);
            if (!address) return res.status(404).json({ message: "City not found using cityId" });

            const parts = address.split(',').map(x => x.trim()).filter(Boolean);
            if (parts.length < 3) return res.status(400).json({ message: "Invalid cityId: Could not derive city,state,country" });

            const cityForPrompt = parts[0];
            const stateForPrompt = parts[1];
            const countryForPrompt = parts[2];

            // Prompt AI for area names & pincodes only
            const prompt = `Return ONLY a JSON array of ${n} local areas within 30km radius of "${cityForPrompt}", "${stateForPrompt}", "${countryForPrompt}" with their postal codes.
 
Requirements:
- Only include areas within 30 kilometer radius from ${cityForPrompt} city center
- Each object must have: { "areaName": "<exact local area name>", "pincode": "<valid postal code>" }
- Use real, verified postal codes only (format varies by country)
- Postal code format examples:
  * India: 6-digit (e.g., "201301")
  * USA: 5-digit ZIP (e.g., "90210") 
  * UK: Alphanumeric (e.g., "SW1A 1AA")
  * Canada: Alphanumeric (e.g., "M5H 2N2")
  * Germany: 5-digit (e.g., "10115")
  * Australia: 4-digit (e.g., "2000")
- Match postal code format to the country specified
- Do not include areas beyond 30km distance
- Return valid JSON array only, no additional text or explanations
 
Example format:
[
  {"areaName": "Area Name 1", "pincode": "201301"},
  {"areaName": "Area Name 2", "pincode": "201302"}
]`.trim();


            console.log("Prompt sent to OpenAI for area with pin codes:", prompt);

            let result = await fetchJSONFromOpenAI(prompt, "LOCAL_AREAS_PINCODES", {
                userId: req.user?.userId,
                projectId: cityId,
                pageId: cityId,
                promptFrom: "getLocalAreasWithPincodes",
                promptFor: address
            });

            console.log("Raw result from OpenAI:", result);

            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch (e) { /* ignore */ }
            }

            if (!Array.isArray(result)) return res.status(502).json({ message: "Model did not return a valid JSON array." });

            // Deduplicate and filter invalid
            // Deduplicate and filter invalid
            const seen = new Set();
            const normalized = [];
            for (const item of result) {
                if (!item?.areaName || !item?.pincode) continue;
                const name = item.areaName.trim();
                const pin = String(item.pincode).trim(); // ✅ Just trim, no validation

                if (!name) continue; // ✅ Keep only name validation
                const key = `${name.toLowerCase()}::${pin}`;
                if (seen.has(key)) continue;
                seen.add(key);
                normalized.push({ areaName: name, pincode: pin });
            }


            if (normalized.length === 0) return res.status(422).json({ message: "No valid local areas returned by model." });

            const finalAreas = normalized.slice(0, n);

            // Format as requested: array of strings like "Area Name (pincode)"
            const formattedArray = finalAreas.map(area => `${area.areaName} (${area.pincode})`);

            return res.status(200).json({
                message: `Generated ${formattedArray.length} local areas with pincodes`,
                data: formattedArray
            });

        } catch (error) {
            console.log("Error in getLocalAreasWithPincodes:", error);
            return res.status(500).json({ message: "Internal Server Error" });
        }
    },




    getOpenAIUsageByProject: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Find the usage document for this project
            const usageDoc = await CreditsUsage.findOne({ projectId });
            if (!usageDoc || !Array.isArray(usageDoc.usageData) || !usageDoc.usageData.length) {
                return res.status(404).json({ message: 'No usage data found for this project' });
            }

            const entries = usageDoc.usageData.map(entry => ({
                usageType: entry.usageType,
                promptFrom: entry.promptFrom,
                promptFor: entry.promptFor,
                pageId: entry.pageId,
                inputTokens: entry.inputTokens,
                outputTokens: entry.outputTokens,
                cost: entry.pricing,
                when: entry.createdAt
            }));

            // Totals
            const totals = entries.reduce((acc, e) => {
                acc.totalInputTokens += (e.inputTokens || 0);
                acc.totalOutputTokens += (e.outputTokens || 0);
                acc.totalCost += (e.cost || 0);
                return acc;
            }, { totalInputTokens: 0, totalOutputTokens: 0, totalCost: 0 });

            return res.status(200).json({
                message: 'Usage data fetched successfully',
                data: {
                    totals,
                    entries
                }
            });

        } catch (error) {
            console.error('Error in getUsageByProject:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while fetching usage data.' });
        }
    },


    openAiString: async (req, res) => {

        try {
            const { prompt, label, userId, projectId, pageId, promptFrom, promptFor } = req.body;

            if (!prompt || !label || !userId || !projectId || !pageId || !promptFrom || !promptFor) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const result = await fetchStringFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });
            return res.status(200).json({ result });
        } catch (err) {
            return res.status(500).json({ error: `Failed to fetch string: ${err.message}` });
        }

    },

    openAiJSON: async (req, res) => {
        try {
            const { prompt, label, userId, projectId, pageId, promptFrom, promptFor } = req.body;

            if (!prompt || !label || !userId || !projectId || !pageId || !promptFrom || !promptFor) {
                return res.status(400).json({ error: 'Missing required parameters' });
            }

            const result = await fetchJSONFromOpenAI(prompt, label, { userId, projectId, pageId, promptFrom, promptFor });
            return res.status(200).json({ result });
        } catch (err) {
            return res.status(500).json({ error: `Failed to fetch JSON: ${err.message}` });
        }
    },

    queueLatLngCitiesCopyWithoutSpecificCountry: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }]
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(4912)
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                await redislatlngqueueQueue.add({
                    id: city.id,
                    cityName: city.name,
                    stateName: stateInfo.name,
                    countryName
                });
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queueLatLngSingleCity: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {

                $or: [{ lat: null }, { lng: null }],
                id: "46875"

            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(1)  // Limit to 4900 cities
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                const id = city.id
                const cityName = city.name
                const stateName = stateInfo.name


                try {
                    const resp = await axios.get('https://us1.locationiq.com/v1/search.php', {
                        params: {
                            key: process.env.LOCATIONIQ_API_KEY,
                            q: `${cityName}, ${stateName}, ${countryName}`,
                            format: 'json',
                            limit: 1,
                        },
                        headers: { 'User-Agent': 'LatLngCityWorker/1.0' },
                    });

                    const location = resp.data[0];
                    if (!location) {
                        // mark as unavailable and skip
                        await City.updateOne({ id }, { $set: { notavailable: 1 } });
                        console.warn(`⚠️ No geocode result for ${cityName}; marking notavailable.`);
                        return;
                    }

                    // successful – write back lat/lng
                    await City.updateOne(
                        { id },
                        { $set: { lat: location.lat, lng: location.lon } }
                    );
                    console.log(`✅ Updated lat/lng for city: ${cityName}`);
                    //    const filter = {
                    //                 notavailable: { $ne: 1 },
                    //                 $or: [{ lat: null }, { lng: null }]
                    //             };

                    //             // 1) Count how many are still eligible
                    //             const citiesCount = await AdminCity.countDocuments(filter);
                    //             console.log(citiesCount, "cities remaining to queue");

                } catch (err) {
                    console.error(`❌ Error for city ${cityName}:`, err.message);

                    if (err.response?.status === 429) {
                        // rate-limit: retry
                        console.warn('⚠️ Rate limited. Retrying after delay...');
                        await delay(5000);
                        throw err;
                    } else {
                        // other errors: mark unavailable so we don't loop forever
                        await City.updateOne({ id }, { $set: { notavailable: 1 } });
                        console.warn(`⚠️ Marked ${cityName} notavailable due to error.`);
                    }
                }
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queueLatLngCities: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }],
                // state_id: { $in: (await State.find({ country_id: 231 }).select('id').lean()).map(state => state.id) }
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch
            const cities = await City.find(filter)
                .limit(4900)  // Limit to 4900 cities
                .lean();

            // 3) Build a map of state_id → { name, country_id }
            const stateIds = [...new Set(cities.map(c => c.state_id))];
            const states = await State.find({ id: { $in: stateIds } }).lean();
            const statesMap = {};
            states.forEach(s => {
                statesMap[s.id] = { name: s.name, country_id: s.country_id };
            });

            // 4) Build a map of country_id → countryName
            const countryIds = [...new Set(states.map(s => s.country_id))];
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            const countriesMap = {};
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // 5) Enqueue each city
            for (let city of cities) {
                const stateInfo = statesMap[city.state_id];
                if (!stateInfo) continue;

                const countryName = countriesMap[stateInfo.country_id];
                if (!countryName) continue;

                await redislatlngqueueQueue.add({
                    id: city.id,
                    cityName: city.name,
                    stateName: stateInfo.name,
                    countryName
                });
            }

            res.json({
                message: `${cities.length} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },

    queueLatLngCitiesCount: async (req, res) => {
        try {
            // Only cities not marked unavailable (notavailable != 1) 
            // and missing at least one coord, and cities within states having country_id 231
            const filter = {
                notavailable: { $ne: 1 },
                $or: [{ lat: null }, { lng: null }],
                state_id: { $in: (await State.find({ country_id: 231 }).select('id').lean()).map(state => state.id) }
            };

            // 1) Count how many are still eligible
            const citiesCount = await City.countDocuments(filter);
            console.log(citiesCount, "cities remaining to queue");

            // 2) Fetch a batch


            res.json({
                message: `${citiesCount} cities queued for lat/lng update.`
            });

        } catch (err) {
            console.error('City Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing cities.' });
        }
    },


    queuelatlngSTATE: async (req, res) => {
        try {

            const statesCount = await State.countDocuments({
                $or: [{ lat: null }, { lng: null }]
            });

            console.log(statesCount, "Left statesCountstatesCountstatesCount");

            // Fetch states needing lat/lng
            const states = await State.find({
                $or: [{ lat: null }, { lng: null }]
            }).limit(1600).lean();

            // Get all unique country_ids
            const countryIds = [...new Set(states.map(state => state.country_id))];

            // Fetch corresponding countries
            const countriesMap = {};
            const countries = await Country.find({ id: { $in: countryIds } }).lean();
            countries.forEach(c => {
                countriesMap[c.id] = c.name;
            });

            // Enqueue each state with full location string
            for (let state of states) {
                const countryName = countriesMap[state.country_id];
                if (!countryName) {
                    console.warn(`⚠️ No country found for state ID ${state.id}`);
                    continue;
                }

                await redislatlngqueueQueue.add({
                    id: state.id,
                    name: state.name,
                    countryName
                });
            }

            res.json({ message: `${states.length} states queued for lat/lng update.` });
        } catch (err) {
            console.error('State Enqueue Error:', err);
            res.status(500).json({ message: 'Error queuing states.' });
        }
    },

    genSNofSt: async (req, res) => {
        try {
            const { country_id } = req.body;

            if (!country_id) {
                return res.status(400).json({ message: 'Country ID is required.' });
            }

            // Fetch country details from the database using the provided country_id
            const country = await Country.findOne({ id: country_id }).lean();

            if (!country) {
                return res.status(404).json({ message: `Country with ID ${country_id} not found.` });
            }

            const countryName = country.name;

            let hasMoreStates = true;

            while (hasMoreStates) {
                // Fetch up to 100 states without sort names for this country
                const states = await State.find({
                    sortname: { $exists: false },
                    country_id: country_id
                }).limit(100).lean();

                if (states.length === 0) {
                    console.log(`All states for ${countryName} have been processed.`);
                    hasMoreStates = false;
                    break;
                }

                // Prepare the dynamic prompt using country name from DB
                const stateNames = states.map(state => state.name).join(", ");
                const prompt = `What are the official short names or abbreviations for the following states in ${countryName}: ${stateNames}? Please provide them as a comma-separated list.`;

                let sortnames = [];
                let attempts = 0;
                const maxAttempts = 3;

                // Retry until correct number of sort names are retrieved
                while (sortnames.length !== states.length && attempts < maxAttempts) {
                    attempts++;

                    const userId = req.user?.userId || 'admin';
                    const projectId = 'system_admin';
                    const OpenAiResponse = await getResponseFromOpenAITracked(
                        prompt,
                        'StateSortNameGeneration',
                        {
                            userId,
                            projectId,
                            pageId: country_id?.toString() || 'system',
                            promptFrom: 'admin_panel',
                            promptFor: 'state_sortname_generation'
                        }
                    );

                    sortnames = OpenAiResponse.text.split(',').map(name => name.trim());

                    console.log(`OpenAI response for ${countryName}: ${OpenAiResponse}`);

                    if (sortnames.length !== states.length) {
                        console.error(`Mismatch: Expected ${states.length} sort names, but got ${sortnames.length}. Retrying...`);
                    }
                }

                if (sortnames.length !== states.length) {
                    console.error(`Failed to get correct number of sort names for ${countryName} after ${attempts} attempts.`);
                    return res.status(400).json({
                        message: `Mismatch between states and generated short names for ${countryName}. Expected ${states.length}, but got ${sortnames.length}.`
                    });
                }

                // Update each state's sort name
                const updates = states.map((state, index) => {
                    const shortname = sortnames[index] || state.name.toUpperCase().slice(0, 2); // Fallback to first 2 letters
                    return State.updateOne({ id: state.id }, { sortname: shortname })
                        .then(() => {
                            console.log(`State '${state.name}' updated with sortname: ${shortname}`);
                        })
                        .catch(err => {
                            console.error(`Error updating state '${state.name}':`, err);
                        });
                });

                await Promise.all(updates);
            }

            res.json({ message: `All states for ${countryName} processed successfully.` });

        } catch (err) {
            console.error('Error processing states:', err);
            res.status(500).json({ message: 'Internal server error.' });
        }
    },

    verifytoken: async (req, res) => {
        try {

            console.log("right verification wrong verifcation")

            let user = req.user

            console.log(user, "user is here")

            const existingUser = await User.findById(user.userId);

            if (existingUser) {
                return helper.sendSuccess(res, 201, 'User verified successfully', existingUser);

            }

            else {

                console.log("Unverified user")
                throw "Unverified user"
            }


        } catch (error) {
            return helper.sendError(res, 500, 'Internal Server Error');

        }
    },

    login: async (req, res) => {
        try {
            let { email, phone, password, country_code, deviceToken, deviceType } = req.body;

            const requiredFields = ['password', 'deviceToken', 'deviceType'];
            const nonRequiredFields = ['phone', 'email', 'country_code'];

            // Validate fields
            if (!await helper.validateFields(req.body, requiredFields, nonRequiredFields, res)) {
                return;
            }

            // Ensure at least one contact detail (email or phone) is provided
            if (!email && !phone) {
                return helper.sendError(res, 400, 'Either email or phone must be provided');
            }

            // Validate country_code presence when a phone is provided
            if (phone && !country_code) {
                return helper.sendError(res, 400, 'Country code is required if phone is provided');
            }

            let userDetails;


            // Find user by email or phone based on the request
            // **Accept both type 0 and 1** when looking up by email or phone
            const typeFilter = { $in: [0, 1] };
            if (email) {
                userDetails = await User.findOne({ email, type: typeFilter });
            } else {
                userDetails = await User.findOne({ country_code, phone, type: typeFilter });
            }
            console.log(req.body, "req.body okay")

            console.log(userDetails, "userDetails")
            if (!userDetails) {
                console.log(userDetails)
                return helper.sendError(res, 404, 'User not found');
            }

            // Verify password using bcrypt
            const authentication = bcrypt.compareSync(password, userDetails.password);

            if (!authentication) {
                return helper.sendError(res, 401, "Email, phone, or password doesn't match");
            }

            // Check for the device in the user's devices array
            const existingDevice = userDetails.devices.find(
                (device) => device.deviceToken === deviceToken && device.deviceType === deviceType
            );

            if (existingDevice) {
                // Increment the tokenVersion for this device
                existingDevice.tokenVersion += 1;
            } else {
                // Add new device to the user's devices array
                userDetails.devices.push({
                    deviceToken,
                    deviceType,
                    tokenVersion: 0, // Start tokenVersion at 0 for new devices

                });
            }

            // Save the updated user with device changes
            await userDetails.save();

            const token = jwt.sign(
                {
                    userId: userDetails._id,
                    deviceToken,
                    tokenVersion: existingDevice ? existingDevice.tokenVersion : 0,
                },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );

            // Return success with token
            let userObject = userDetails.toObject();
            userObject.token = token;

            console.log("login sucess", token)

            return helper.sendSuccess(res, 201, 'User logged in successfully', userObject);
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, 'Internal Server Error');
        }
    },

    logout: async (req, res) => {
        try {
            const userId = req.user.userId; // Extract user ID from the authenticated request
            let { logoutFromAll, deviceToken } = req.body;

            if (!deviceToken && !logoutFromAll) {
                logoutFromAll = true
            }
            if (logoutFromAll) {

                console.log("User Wants log out from all devices!!!")
                // Logout from all devices
                const user = await User.findById(userId);

                if (!user) {
                    return helper.sendError(res, 404, 'User not found');
                }

                // Increment tokenVersion for all devices
                user.devices = user.devices.map(device => ({
                    ...device,
                    tokenVersion: device.tokenVersion + 1 // Increment tokenVersion for all devices
                }));

                // Save updated user data
                await user.save();

                return helper.sendSuccess(res, 200, 'User logged out successfully from all devices');
            } else {

                console.log("User want to log out from a selected Device!!!")
                // Logout from a single device
                if (!deviceToken) {
                    return helper.sendError(res, 400, 'Device token is required for single device logout');
                }

                const user = await User.findOneAndUpdate(
                    { _id: userId, "devices.deviceToken": deviceToken }, // Find the user and the specific device
                    { $inc: { "devices.$.tokenVersion": 1 } }, // Increment the tokenVersion for the matching device
                    { new: true }
                );

                if (!user) {
                    return helper.sendError(res, 404, 'Device not found or user not found');
                }

                return helper.sendSuccess(res, 200, 'User logged out successfully from the specified device');
            }
        } catch (error) {
            console.error(error);
            return helper.sendError(res, 500, 'Internal Server Error');
        }
    },

    dashboard: async (req, res) => {
        try {

            const UsersCount = await User.countDocuments({ type: 0 });
            const userProjectsCount = await userProjects.countDocuments();
            console.log('Number of documents:', UsersCount);


            console.log("success fetched dashboard")

            res.status(200).json({
                success: true,
                code: 200,
                message: 'Forms fetched successfully',
                body: 23,
                "TotalUsersCount": UsersCount,
                "TotalOrdersCount": userProjectsCount

            })



        } catch (error) {

            // Catch any errors and return a consistent error response
            console.log("Error in login API:", error.message || error);
            return res.status(400).json({
                success: false,
                code: 400,
                message: error.message || "An error occurred", // Make sure to return a string message
                body: {},
            });

        }
    },

    openAiTest: async (req, res) => {
        const { title } = req.body;

        if (!title || typeof title !== "string") {
            return res.status(400).json({ message: "Title is required and should be a string." });
        }

        console.log(`Generating YouTube Short script for: ${title}`);

        try {
            const prompt = `Create a 40-second YouTube short on a topic = ${title} with limited words ( maximum 300 ) that are readable in 40 seconds. Please provide me with up-to-date information that is easy to understand and has good content that should include interesting facts, real numbers, and real data. Make sure to include a separate title and description. Don't add any links to websites and YouTube channels in the content and don't use emojis. please don't miss the last line for CTA. Please don't add steps. And make sure all the content should be in Hindi and according to 2025 and the Indian audience. Please follow the exact instructions and don't miss any keywords do the work in sequence for all topics and start from the first topic
            make sure output will similar like;=

            Title:
            भारत के सबसे खूबसूरत पेट-फ्रेंडली सनसेट पॉइंट्स

            Description:
            अगर आप अपने पेट के साथ सनसेट का मजा लेना चाहते हैं, तो ये भारत के सबसे खूबसूरत पेट-फ्रेंडली सनसेट पॉइंट्स हैं।

            Script (40-Second YouTube Short):
            "क्या आप जानते हैं कि भारत में 10 से ज्यादा सनसेट पॉइंट्स अब पेट-फ्रेंडली हो चुके हैं? अगर आप अपने पेट के साथ सनसेट का मजा लेना चाहते हैं, तो ये जगहें आपके लिए परफेक्ट हैं।

            कन्याकुमारी: यहां पेट्स के साथ सनसेट का मजा लें।

            गोवा का पालोलेम बीच: पेट्स के साथ बीच पर सनसेट का अनुभव।

            उदयपुर का लेक पिचोला: यहां पेट्स के साथ लेकसाइड सनसेट का मजा लें।

            मसूरी का लाल टिब्बा: पेट्स के साथ हिल स्टेशन पर सनसेट का अनुभव।

            2025 तक, भारत में पेट-फ्रेंडली सनसेट पॉइंट्स की संख्या 15% बढ़ने की उम्मीद है। तो, कब प्लान कर रहे हैं अपने पेट के साथ सनसेट ट्रिप? कमेंट में बताएं!"

            CTA:
            "अगर आपको यह जानकारी पसंद आई हो, तो इस वीडियो को लाइक करें और हमारे चैनल को सब्सक्राइब करें।"


            
            
            `;

            const userId = req.user?.userId || req.body.userId || 'admin';
            const projectId = req.body.projectId || 'system';

            const OpenAiResponse = await getResponseFromOpenAITracked(
                prompt,
                'YouTubeShortScript',
                {
                    userId,
                    projectId,
                    pageId: req.body.pageId || projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'youtube_short_script'
                }
            );

            const cleanedResponse = OpenAiResponse.text.replace(/```json|```/g, "").trim();

            return res.status(200).send(cleanedResponse);
        } catch (error) {
            console.error("Error generating YouTube Short script:", error);
            return res.status(500).json({ message: "An error occurred while processing your request." });
        }
    },



    create_user: async (req, res) => {

        try {

            const { fullName, email, phone, password, address } = req.body;

            if (!fullName || !email || !phone || !password || !address) {

                console.log(req.body)
                return res.status(400).json({ message: 'All fields are required' });
            }
            // Check if user already exists (by email or phone)
            const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
            if (existingUser) {
                console.log("Exists user")
                throw 'User already exists with the given email or phone number'
            }


            // Hash the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            console.log("here we go!!!!!")

            // Create a new user
            const newUser = new User({
                fullName,
                email,
                phone,
                password: hashedPassword,
                address,
                wallet: {
                    balance: 0,  // New user starts with a balance of 0
                    transactions: [],
                },
            });

            // Save the new user to the database
            await newUser.save();

            // Create notification for super admins
            try {
                await Notification.create({
                    userFromId: newUser._id,
                    isSuperAdminNotification: true,
                    message: `New user registered: ${newUser.email}`,
                    type: 'user_registered',
                    relatedId: newUser._id
                });
            } catch (notifError) {
                console.error('Error creating user registration notification:', notifError);
            }

            return helper.sendSuccess(res, 201, 'User created successfully', newUser);

        } catch (error) {
            console.log(error, "error")
            return helper.sendError(res, 500, error);
        }
    },

    // ============================================
    // HEADER APIs (type = 0)
    // ============================================
    headerCreate: async (req, res) => {
        try {
            const { projectId, userId, variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            if (!projectId || !userId) {
                return res.status(400).json({ message: 'Project ID and User ID are required' });
            }

            const header = new SiteHeaderFooter({
                projectId,
                userId,
                type: 0, // Header
                variant: variant || 'a',
                status: 'inactive',
                logo: logo || {},
                menu: menu || [],
                contactDetails: contactDetails || {},
                style: style || {},
                elementIds: elementIds || [],
                settings: settings || {}
            });

            await header.save();
            return res.status(201).json({
                message: 'Header created successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerCreate:', error);
            return res.status(500).json({
                message: 'Error creating header',
                error: error.message
            });
        }
    },

    headerUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const { variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            // Update fields if provided (check for null/undefined, but allow empty arrays/objects)
            if (variant !== undefined && variant !== null) header.variant = variant;
            if (logo !== undefined && logo !== null) header.logo = logo;
            // Helper function to sanitize menu items
            const sanitizeMenuItems = (menuItems) => {
                if (!Array.isArray(menuItems)) return [];

                return menuItems.map(item => {
                    const sanitizedItem = { ...item };

                    // Validate pageId - must be a valid ObjectId or null/undefined
                    if (sanitizedItem.pageId) {
                        // Check if it's a valid ObjectId string (24 hex characters)
                        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(sanitizedItem.pageId));
                        if (!isValidObjectId) {
                            console.warn('[headerUpdate] Invalid pageId format, setting to null:', sanitizedItem.pageId);
                            sanitizedItem.pageId = null;
                        }
                    } else {
                        sanitizedItem.pageId = null;
                    }

                    // Recursively sanitize children
                    if (sanitizedItem.children && Array.isArray(sanitizedItem.children)) {
                        sanitizedItem.children = sanitizeMenuItems(sanitizedItem.children);
                    }

                    return sanitizedItem;
                });
            };

            if (menu !== undefined && menu !== null) {
                header.menu = sanitizeMenuItems(menu);
                console.log('[headerUpdate] Menu set:', { menuLength: header.menu.length, menu: header.menu });
            }
            if (contactDetails !== undefined && contactDetails !== null) header.contactDetails = contactDetails;
            if (style !== undefined && style !== null) header.style = style;
            if (elementIds !== undefined && elementIds !== null) {
                header.elementIds = Array.isArray(elementIds) ? elementIds : [];
            }
            if (settings !== undefined && settings !== null) header.settings = settings;

            await header.save();
            return res.status(200).json({
                success: true,
                message: 'Header updated successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerUpdate:', error);
            return res.status(500).json({
                message: 'Error updating header',
                error: error.message
            });
        }
    },

    headerDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            await SiteHeaderFooter.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Header deleted successfully' });
        } catch (error) {
            console.error('Error in headerDelete:', error);
            return res.status(500).json({
                message: 'Error deleting header',
                error: error.message
            });
        }
    },

    headerGetById: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);
            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }
            return res.status(200).json({
                success: true,
                message: 'Header fetched successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerGetById:', error);
            return res.status(500).json({
                message: 'Error fetching header',
                error: error.message
            });
        }
    },

    headerGetByProject: async (req, res) => {
        try {
            const { projectId } = req.params;
            const headers = await SiteHeaderFooter.find({
                projectId,
                type: 0
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Headers fetched successfully',
                data: headers
            });
        } catch (error) {
            console.error('Error in headerGetByProject:', error);
            return res.status(500).json({
                message: 'Error fetching headers',
                error: error.message
            });
        }
    },

    headerGetActive: async (req, res) => {
        try {
            const { projectId } = req.params;
            const header = await SiteHeaderFooter.findOne({
                projectId,
                type: 0,
                status: 'active'
            });

            if (!header) {
                return res.status(404).json({ message: 'No active header found' });
            }

            console.log('Active header fetched successfully', header);

            return res.status(200).json({
                success: true,
                message: 'Active header fetched successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerGetActive:', error);
            return res.status(500).json({
                message: 'Error fetching active header',
                error: error.message
            });
        }
    },

    headerActivate: async (req, res) => {
        try {
            const { id } = req.params;
            const header = await SiteHeaderFooter.findById(id);

            if (!header || header.type !== 0) {
                return res.status(404).json({ message: 'Header not found' });
            }

            // Deactivate all other headers for this project
            await SiteHeaderFooter.updateMany(
                { projectId: header.projectId, type: 0, _id: { $ne: id } },
                { status: 'inactive' }
            );

            // Activate this header
            header.status = 'active';
            await header.save();

            return res.status(200).json({
                message: 'Header activated successfully',
                data: header
            });
        } catch (error) {
            console.error('Error in headerActivate:', error);
            return res.status(500).json({
                message: 'Error activating header',
                error: error.message
            });
        }
    },

    // ============================================
    // FOOTER APIs (type = 1)
    // ============================================
    footerCreate: async (req, res) => {
        try {
            const { projectId, userId, variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            if (!projectId || !userId) {
                return res.status(400).json({ message: 'Project ID and User ID are required' });
            }

            const footer = new SiteHeaderFooter({
                projectId,
                userId,
                type: 1, // Footer
                variant: variant || 'a',
                status: 'inactive',
                logo: logo || {},
                menu: menu || [],
                contactDetails: contactDetails || {},
                style: style || {},
                elementIds: elementIds || [],
                settings: settings || {}
            });

            await footer.save();
            return res.status(201).json({
                message: 'Footer created successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerCreate:', error);
            return res.status(500).json({
                message: 'Error creating footer',
                error: error.message
            });
        }
    },

    footerUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const { variant, logo, menu, contactDetails, style, elementIds, settings } = req.body;

            console.log('[footerUpdate] Request received:', {
                id,
                hasMenu: !!menu,
                menuLength: menu?.length,
                hasLogo: !!logo,
                hasContactDetails: !!contactDetails,
                hasStyle: !!style,
                hasElementIds: !!elementIds,
                hasSettings: !!settings,
            });

            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                console.error('[footerUpdate] Footer not found:', { id, footerType: footer?.type });
                return res.status(404).json({ message: 'Footer not found' });
            }

            // Helper function to sanitize menu items
            const sanitizeMenuItems = (menuItems) => {
                if (!Array.isArray(menuItems)) return [];

                return menuItems.map(item => {
                    const sanitizedItem = { ...item };

                    // Validate pageId - must be a valid ObjectId or null/undefined
                    if (sanitizedItem.pageId) {
                        // Check if it's a valid ObjectId string (24 hex characters)
                        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(sanitizedItem.pageId));
                        if (!isValidObjectId) {
                            console.warn('[footerUpdate] Invalid pageId format, setting to null:', sanitizedItem.pageId);
                            sanitizedItem.pageId = null;
                        }
                    } else {
                        sanitizedItem.pageId = null;
                    }

                    // Recursively sanitize children
                    if (sanitizedItem.children && Array.isArray(sanitizedItem.children)) {
                        sanitizedItem.children = sanitizeMenuItems(sanitizedItem.children);
                    }

                    return sanitizedItem;
                });
            };

            // Update fields if provided
            if (variant !== undefined) footer.variant = variant;
            if (logo !== undefined) footer.logo = logo;
            if (menu !== undefined && menu !== null) {
                footer.menu = sanitizeMenuItems(menu);
                console.log('[footerUpdate] Menu set:', { menuLength: footer.menu.length, menu: footer.menu });
            }
            if (contactDetails !== undefined) footer.contactDetails = contactDetails;
            if (style !== undefined) footer.style = style;
            if (elementIds !== undefined) footer.elementIds = elementIds;
            if (settings !== undefined) footer.settings = settings;

            await footer.save();
            console.log('[footerUpdate] Footer saved successfully:', { id: footer._id, menuLength: footer.menu?.length });

            return res.status(200).json({
                success: true,
                message: 'Footer updated successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerUpdate:', error);
            return res.status(500).json({
                message: 'Error updating footer',
                error: error.message
            });
        }
    },

    footerDelete: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }

            await SiteHeaderFooter.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Footer deleted successfully' });
        } catch (error) {
            console.error('Error in footerDelete:', error);
            return res.status(500).json({
                message: 'Error deleting footer',
                error: error.message
            });
        }
    },

    footerGetById: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);
            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }
            return res.status(200).json({
                success: true,
                message: 'Footer fetched successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerGetById:', error);
            return res.status(500).json({
                message: 'Error fetching footer',
                error: error.message
            });
        }
    },

    footerGetByProject: async (req, res) => {
        try {
            const { projectId } = req.params;
            const footers = await SiteHeaderFooter.find({
                projectId,
                type: 1
            }).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Footers fetched successfully',
                data: footers
            });
        } catch (error) {
            console.error('Error in footerGetByProject:', error);
            return res.status(500).json({
                message: 'Error fetching footers',
                error: error.message
            });
        }
    },

    footerGetActive: async (req, res) => {
        try {
            const { projectId } = req.params;
            const footer = await SiteHeaderFooter.findOne({
                projectId,
                type: 1,
                status: 'active'
            });

            if (!footer) {
                return res.status(404).json({ message: 'No active footer found' });
            }
            console.log('Active footer fetched successfully', footer);

            return res.status(200).json({
                success: true,
                message: 'Active footer fetched successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerGetActive:', error);
            return res.status(500).json({
                message: 'Error fetching active footer',
                error: error.message
            });
        }
    },

    // API endpoint to update menu URLs when page slug changes
    // POST /admin/v1/header-footer/update-menu-urls
    // Body: { pageId: string, newSlug: string }
    updateMenuUrlsForPage: async (req, res) => {
        try {
            const { pageId, newSlug } = req.body;

            if (!pageId || !newSlug) {
                return res.status(400).json({
                    success: false,
                    message: 'pageId and newSlug are required'
                });
            }

            console.log(`[updateMenuUrlsForPage] Updating menu URLs for pageId: ${pageId}, newSlug: ${newSlug}`);

            // Recursive function to update menu items and their children
            const updateMenuItems = (menuItems, pageId, newSlug) => {
                if (!Array.isArray(menuItems)) return menuItems;

                return menuItems.map(item => {
                    const updatedItem = { ...item };

                    // If this menu item is linked to the page, update its URL
                    if (item.pageId && item.pageId.toString() === pageId.toString()) {
                        updatedItem.url = `/${newSlug}`;
                        console.log(`[updateMenuUrlsForPage] Updated menu item "${item.name}" URL to /${newSlug}`);
                    }

                    // Recursively update children
                    if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                        updatedItem.children = updateMenuItems(item.children, pageId, newSlug);
                    }

                    return updatedItem;
                });
            };

            // Find all headers and footers that have menu items linked to this page
            const headersFooters = await SiteHeaderFooter.find({
                $or: [
                    { 'menu.pageId': pageId },
                    { 'menu.children.pageId': pageId }
                ]
            });

            console.log(`[updateMenuUrlsForPage] Found ${headersFooters.length} headers/footers to update`);

            let updatedCount = 0;

            // Update each header/footer
            for (const headerFooter of headersFooters) {
                const updatedMenu = updateMenuItems(headerFooter.menu, pageId, newSlug);

                // Check if menu actually changed
                const menuChanged = JSON.stringify(headerFooter.menu) !== JSON.stringify(updatedMenu);

                if (menuChanged) {
                    headerFooter.menu = updatedMenu;
                    await headerFooter.save();
                    updatedCount++;
                    console.log(`[updateMenuUrlsForPage] Updated ${headerFooter.type === 0 ? 'header' : 'footer'} ${headerFooter._id}`);
                }
            }

            console.log(`[updateMenuUrlsForPage] Completed updating ${updatedCount} headers/footers`);

            return res.status(200).json({
                success: true,
                message: `Menu URLs updated successfully for ${updatedCount} header(s)/footer(s)`,
                updatedCount
            });
        } catch (error) {
            console.error('[updateMenuUrlsForPage] Error updating menu URLs:', error);
            return res.status(500).json({
                success: false,
                message: 'Error updating menu URLs',
                error: error.message
            });
        }
    },

    footerActivate: async (req, res) => {
        try {
            const { id } = req.params;
            const footer = await SiteHeaderFooter.findById(id);

            if (!footer || footer.type !== 1) {
                return res.status(404).json({ message: 'Footer not found' });
            }

            // Deactivate all other footers for this project
            await SiteHeaderFooter.updateMany(
                { projectId: footer.projectId, type: 1, _id: { $ne: id } },
                { status: 'inactive' }
            );

            // Activate this footer
            footer.status = 'active';
            await footer.save();

            return res.status(200).json({
                message: 'Footer activated successfully',
                data: footer
            });
        } catch (error) {
            console.error('Error in footerActivate:', error);
            return res.status(500).json({
                message: 'Error activating footer',
                error: error.message
            });
        }
    },

    // ============================================
    // CREATE DEFAULT HEADER/FOOTER
    // ============================================
    createDefaultHeaderFooter: async (req, res) => {
        try {
            let { projectId, userId, type } = req.body; // type: 0 = Header, 1 = Footer

            // Convert type to number if it's a string
            if (typeof type === 'string') {
                type = parseInt(type, 10);
            }

            if (!projectId || !userId || type === undefined || type === null) {
                return res.status(400).json({
                    message: 'Project ID, User ID, and Type are required'
                });
            }

            // Ensure type is a number and is either 0 or 1
            const typeNumber = Number(type);
            if (isNaN(typeNumber) || (typeNumber !== 0 && typeNumber !== 1)) {
                return res.status(400).json({
                    message: 'Type must be 0 (Header) or 1 (Footer)'
                });
            }

            // Use the converted number
            type = typeNumber;

            // Check if default already exists
            const existing = await SiteHeaderFooter.findOne({
                projectId,
                type,
                variant: 'a',
                status: 'active'
            });

            if (existing) {
                return res.status(400).json({
                    message: `Default ${type === 0 ? 'header' : 'footer'} already exists for this project`
                });
            }

            // Default menu structure
            const defaultMenu = [
                {
                    id: 'home',
                    name: 'Home',
                    url: '/',
                    icon: '',
                    target: '_self',
                    order: 0,
                    children: [],
                    style: {}
                },
                {
                    id: 'about',
                    name: 'About',
                    url: '/about',
                    icon: '',
                    target: '_self',
                    order: 1,
                    children: [],
                    style: {}
                },
                {
                    id: 'services',
                    name: 'Services',
                    url: '/services',
                    icon: '',
                    target: '_self',
                    order: 2,
                    children: [],
                    style: {}
                },
                {
                    id: 'contact',
                    name: 'Contact',
                    url: '/contact',
                    icon: '',
                    target: '_self',
                    order: 3,
                    children: [],
                    style: {}
                }
            ];

            // Default contact details
            const defaultContactDetails = {
                phone: {
                    enabled: true,
                    number: '',
                    label: 'Phone',
                    style: {}
                },
                email: {
                    enabled: true,
                    address: '',
                    label: 'Email',
                    style: {}
                },
                address: {
                    enabled: false,
                    text: '',
                    style: {}
                }
            };

            // Default style
            const defaultStyle = type === 0 ? {
                backgroundColor: '#ffffff',
                color: '#000000',
                padding: '16px 0',
                borderBottom: '1px solid #e5e7eb'
            } : {
                backgroundColor: '#1f2937',
                color: '#ffffff',
                padding: '48px 0',
                borderTop: '1px solid #374151'
            };

            // Default settings
            const defaultSettings = type === 0 ? {
                sticky: false,
                transparent: false,
                showOnMobile: true,
                showOnTablet: true,
                showOnDesktop: true,
                custom: {}
            } : {
                sticky: false,
                transparent: false,
                showOnMobile: true,
                showOnTablet: true,
                showOnDesktop: true,
                custom: {}
            };

            // Deactivate any existing active header/footer of this type
            await SiteHeaderFooter.updateMany(
                { projectId, type },
                { status: 'inactive' }
            );

            const defaultItem = new SiteHeaderFooter({
                projectId,
                userId,
                type,
                variant: 'a',
                status: 'active',
                logo: {
                    url: '',
                    alt: 'Logo',
                    width: 150,
                    height: 50,
                    style: {}
                },
                menu: defaultMenu,
                contactDetails: defaultContactDetails,
                style: defaultStyle,
                elementIds: [],
                settings: defaultSettings
            });

            await defaultItem.save();

            return res.status(201).json({
                message: `Default ${type === 0 ? 'header' : 'footer'} created successfully`,
                data: defaultItem
            });
        } catch (error) {
            console.error('Error in createDefaultHeaderFooter:', error);
            return res.status(500).json({
                message: 'Error creating default header/footer',
                error: error.message
            });
        }
    },

    create_author: async (req, res) => {
        try {
            let { name, about, jobTitle, links } = req.body;
            const image = req.files?.image; // Ensure image is correctly accessed
            console.log(req.body, req.files)

            if (typeof links === 'string') {

                links = JSON.parse(links); // Attempt to parse the string

                console.log(links, "inside of parsing")
                if (!Array.isArray(links)) {
                    return res.status(400).json({ message: 'Links must be an array of objects' });

                }
            }

            // Validate required fields
            if (!name || !name.trim()) {
                return res.status(400).json({ message: 'Name is required' });
            }

            let userId = req.user.userId; // Get logged-in user ID from req.user.id
            console.log(userId, req.user);

            // Deduplicate by userId and name
            const existing = await Author.findOne({ userId, name: name.trim() });
            if (existing) {
                return res.status(400).json({ message: 'Author already exists for this user with the given name' });
            }

            // If an image is uploaded, process it using the helper
            let imageUrl = '';
            if (image) {
                const folderPath = 'public/files/authors/images'; // Path to store the image

                // Validate that the file has a valid mimetype (optional, for safety)
                if (!image.mimetype || !image.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'Uploaded file must be an image' });
                }

                // Handle image processing (similar to uploadFileapi)
                const input = image.tempFilePath ? image.tempFilePath : image.data;
                if (!input) {
                    return res.status(400).json({ message: 'No valid image input (tempFilePath or data) found.' });
                }

                // Convert to WebP using sharp
                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                // Create a readable stream for the WebP buffer
                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`, // Unique filename
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream
                };

                // Upload the file using the helper
                const savedName = await helper.uploadFile(webpFile, folderPath, null);
                imageUrl = `/files/authors/images/${savedName}`; // Adjust the URL based on your folder structure
            }

            // Prepare the new Author object
            const author = new Author({
                name: name.trim(),
                jobTitle: jobTitle ? jobTitle.trim() : '',
                bio: about ? about.trim() : '',
                image: imageUrl,
                links: links || [], // links can be an empty array if not provided
                userId
            });

            // Save the author to the database
            await author.save();
            return helper.sendSuccess(res, 201, 'Author created successfully', author);
        } catch (error) {
            console.log(error, 'error');
            return helper.sendError(res, 500, error?.message || 'Failed to create author');
        }
    }
    ,

    edit_author: async (req, res) => {
        try {
            const { authorId } = req.params; // Get the author ID from URL params
            const { name, about, jobTitle, links } = req.body;
            const image = req.files?.image; // Image uploaded from request

            // Validate required fields
            if (!authorId || !mongoose.isValidObjectId(authorId)) {
                return res.status(400).json({ message: 'Valid authorId is required' });
            }

            const existingAuthor = await Author.findById(authorId);
            if (!existingAuthor) {
                return res.status(404).json({ message: 'Author not found' });
            }

            // If the name is provided and changed, check for duplicates
            if (name && name.trim() !== existingAuthor.name) {
                const duplicateAuthor = await Author.findOne({ userId: req.user.userId, name: name.trim() });
                if (duplicateAuthor) {
                    return res.status(400).json({ message: 'Author with this name already exists' });
                }
                existingAuthor.name = name.trim();
            }

            // Update fields
            if (about) {
                existingAuthor.bio = about.trim();
            }
            if (jobTitle) {
                existingAuthor.jobTitle = jobTitle.trim();
            }

            // If image is uploaded, process it using the helper
            if (image) {
                const folderPath = 'public/files/authors/images'; // Path to store the image

                // Validate that the file has a valid mimetype
                if (!image.mimetype || !image.mimetype.startsWith('image/')) {
                    return res.status(400).json({ message: 'Uploaded file must be an image' });
                }

                // Handle image processing (similar to uploadFileapi)
                const input = image.tempFilePath ? image.tempFilePath : image.data;
                if (!input) {
                    return res.status(400).json({ message: 'No valid image input (tempFilePath or data) found.' });
                }

                // Convert to WebP using sharp
                const webpBuf = await sharp(input, { failOnError: false })
                    .rotate()
                    .webp({ quality: 78, effort: 5 })
                    .toBuffer();

                // Create a readable stream for the WebP buffer
                const stream = Readable.from(webpBuf);
                const webpFile = {
                    name: `${Date.now()}.webp`, // Unique filename
                    mimetype: 'image/webp',
                    size: webpBuf.length,
                    stream
                };

                // Upload the file using the helper
                const savedName = await helper.uploadFile(webpFile, folderPath, null);
                existingAuthor.image = `/files/authors/images/${savedName}`; // Adjust the URL based on your folder structure
            }

            // Ensure links is always an array
            let parsedLinks = [];
            if (links) {
                // If links is a string, parse it as JSON, otherwise keep it as is if it's an array
                if (typeof links === 'string') {
                    try {
                        parsedLinks = JSON.parse(links); // Attempt to parse the string
                        if (!Array.isArray(parsedLinks)) {
                            return res.status(400).json({ message: 'Links must be an array of objects' });
                        }
                    } catch (error) {
                        return res.status(400).json({ message: 'Invalid format for links' });
                    }
                } else if (Array.isArray(links)) {
                    parsedLinks = links; // Already an array, use it as is
                } else {
                    return res.status(400).json({ message: 'Links should be an array of objects' });
                }
            }

            // Update links if provided
            existingAuthor.links = parsedLinks; // Update the links array if links were provided

            // Save the updated author object
            await existingAuthor.save();

            return helper.sendSuccess(res, 200, 'Author updated successfully', existingAuthor);
        } catch (error) {
            console.log(error, 'error');
            return helper.sendError(res, 500, error?.message || 'Failed to update author');
        }
    }
    ,
    // Fetch authors by userId
    fetch_authors: async (req, res) => {
        try {
            const userId = req.user.userId; // Get logged-in user ID from req.user.userId

            // Find authors for this user
            const authors = await Author.find({ userId }).exec();


            if (!authors || authors.length === 0) {
                return res.status(404).json({ message: 'No authors found for this user' });
            }

            return helper.sendSuccess(res, 200, 'Authors fetched successfully', authors);
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to fetch authors');
        }
    }
    ,

    fetch_author_by_blog_id: async (req, res) => {
        try {
            const blogId = req.body.blogId; // Get the blogId from the request body

            if (!blogId) {
                return res.status(400).json({ message: 'Blog ID is required' });
            }

            // Step 1: Find the blog by its ID to get the associated authorId
            const blog = await Blog.findById(blogId).exec();

            if (!blog) {
                return res.status(404).json({ message: 'Blog not found' });
            }

            // Step 2: Use the authorId from the blog to find the corresponding author
            const author = await Author.findById(blog.authorId).exec();

            if (!author) {
                return res.status(404).json({ message: 'Author not found for this blog' });
            }

            return helper.sendSuccess(res, 200, 'Author fetched successfully', author);
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to fetch author');
        }
    },

    // Delete an author by authorId
    delete_author: async (req, res) => {
        try {
            const { authorId } = req.params; // Get authorId from params
            const userId = req.user.userId; // Get logged-in user ID from req.user.userId

            // Validate if the author exists and belongs to the current user
            const author = await Author.findOne({ _id: authorId, userId }).exec();

            if (!author) {
                return res.status(404).json({ message: 'Author not found' });
            }

            // Delete the author
            await Author.findByIdAndDelete(authorId);

            return helper.sendSuccess(res, 200, 'Author deleted successfully');
        } catch (error) {
            console.log(error);
            return helper.sendError(res, 500, error?.message || 'Failed to delete author');
        }
    },

    fetch_users: async (req, res) => {
        const { page = 1, limit = 10 } = req.query; // Default to page 1 and limit of 10
        console.log("hey how are ;you", req.query, req.body)

        try {
            // Fetch users from the database with pagination
            const users = await User.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit) // Skip users from previous pages
                .limit(Number(limit)); // Limit the number of users per page

            // Get the total count of users (for pagination info)
            const totalUsers = await User.countDocuments();

            // Return the users with pagination information
            res.status(200).json({
                message: 'User list fetched successfully',
                data: users,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers,
                }
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error. Please try again later.' });
        }



    },

    createProject: async (req, res) => {
        try {
            let {
                userId,
                serviceType,
                projectName,
                wantImages,
                focusKeyword,
                projectKeywordsText,
                categories,
                subCategories,
                microCategories
            } = req.body;

            // console.log(req.body, "Request body for creating project");return



            if (!serviceType) serviceType = categories[0];

            // wantImages always defaults to 1 (hidden field, always enabled)
            // Only allow 0 if explicitly provided, otherwise default to 1
            let finalWantImages = 1; // Default to 1
            if (wantImages !== undefined && wantImages !== null) {
                const parsed = parseInt(wantImages, 10);
                if (!isNaN(parsed) && parsed === 0) {
                    finalWantImages = 0; // Only allow 0 if explicitly set
                }
            }

            // Mandatory keywords
            if (!projectKeywordsText || !focusKeyword) {
                return res.status(400).json({
                    message: 'projectKeywordsText and focusKeyword are required'
                });
            }



            // Normalize arrays
            try {
                categories = normalizeArray(categories, 'categories', true);
                subCategories = normalizeArray(subCategories, 'subCategories', true);
                microCategories = normalizeArray(microCategories, 'microCategories', false);
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }

            if (!userId) userId = "676556920ee225052d8cd600";
            if (!userId || !projectName) {
                return res.status(400).json({
                    message: 'userId and projectName are required'
                });
            }

            // Process categories: Check if exists, if not create with isManual: 1
            let categoryId = null;
            if (categories && categories.length > 0) {
                const categoryName = categories[0].trim();

                // Check if category exists
                let category = await ProjectCategory.findOne({ name: categoryName });

                if (!category) {
                    // Category doesn't exist, create it with isManual: 1
                    category = new ProjectCategory({
                        name: categoryName,
                        isManual: 1
                    });
                    await category.save();
                    console.log(`[CreateProject] Created manual category: ${categoryName}`);
                }

                categoryId = category._id;
            }

            // Process subcategories: Check if exists, if not create with isManual: 1
            const processedSubCategories = [];
            if (subCategories && subCategories.length > 0 && categoryId) {
                for (const subCatName of subCategories) {
                    const trimmedName = subCatName.trim();
                    if (!trimmedName) continue;

                    // Check if subcategory exists for this category
                    let subCategory = await SubCategory.findOne({
                        categoryId: categoryId,
                        name: trimmedName
                    });

                    if (!subCategory) {
                        // Subcategory doesn't exist, create it with isManual: 1
                        subCategory = new SubCategory({
                            categoryId: categoryId,
                            name: trimmedName,
                            isManual: 1
                        });
                        await subCategory.save();
                        console.log(`[CreateProject] Created manual subcategory: ${trimmedName} for category: ${categoryId}`);
                    }

                    processedSubCategories.push(trimmedName);
                }
            }

            // Process micro categories: Check if exists, if not create with isManual: 1
            const processedMicroCategories = [];
            if (microCategories && microCategories.length > 0 && categoryId && processedSubCategories.length > 0) {
                // Get the first subcategory ID for micro categories
                const firstSubCategory = await SubCategory.findOne({
                    categoryId: categoryId,
                    name: processedSubCategories[0]
                });

                if (firstSubCategory) {
                    for (const microCatName of microCategories) {
                        const trimmedName = microCatName.trim();
                        if (!trimmedName) continue;

                        // Check if micro category exists for this subcategory
                        let microCategory = await MicroCategory.findOne({
                            subCategoryId: firstSubCategory._id,
                            name: trimmedName
                        });

                        if (!microCategory) {
                            // Micro category doesn't exist, create it with isManual: 1
                            microCategory = new MicroCategory({
                                categoryId: categoryId,
                                subCategoryId: firstSubCategory._id,
                                name: trimmedName,
                                isManual: 1
                            });
                            await microCategory.save();
                            console.log(`[CreateProject] Created manual micro category: ${trimmedName} for subcategory: ${firstSubCategory._id}`);
                        }

                        processedMicroCategories.push(trimmedName);
                    }
                }
            }

            // Save minimal project data immediately, include categories
            const newProject = new UserProject({
                userId,
                serviceType, // optional
                projectName,
                projectKeywordsText,
                focusKeyword,
                wantImages: finalWantImages, // Always defaults to 1
                status: 1,
                projectType: 0, // 0 = location based site
                categories: categories || [],
                subCategories: processedSubCategories,
                microCategories: processedMicroCategories
            });

            const savedProject = await newProject.save();

            // Enqueue background job
            console.log(savedProject._id.toString(), "This project sent for projectBackgroundQueue From step 1")
            await projectBackgroundQueue.add({ projectId: savedProject._id.toString() });

            // Create notification for super admins
            try {
                const user = await Users.findById(userId).select('email username').lean();
                await Notification.create({
                    userFromId: userId,
                    isSuperAdminNotification: true,
                    message: `${user?.username || user?.email || 'User'} created new project "${projectName}"`,
                    type: 'project_created',
                    relatedId: savedProject._id
                });
            } catch (notifError) {
                console.error('Error creating project creation notification:', notifError);
            }

            return res
                .status(201)
                .json({ message: 'Project created successfully', data: savedProject });

        } catch (error) {
            console.error('Error in createProject:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while processing your request.' });
        }
    },

    createBusinessWebsite: async (req, res) => {
        try {
            let {
                userId,
                serviceType,
                projectName,
                wantImages,
                focusKeyword,
                projectKeywordsText,
                categories,
                subCategories,
                microCategories
            } = req.body;

            if (!serviceType) serviceType = categories[0];

            // wantImages always defaults to 1 (hidden field, always enabled)
            let finalWantImages = 1; // Default to 1
            if (wantImages !== undefined && wantImages !== null) {
                const parsed = parseInt(wantImages, 10);
                if (!isNaN(parsed) && parsed === 0) {
                    finalWantImages = 0; // Only allow 0 if explicitly set
                }
            }

            // Mandatory keywords
            if (!projectKeywordsText || !focusKeyword) {
                return res.status(400).json({
                    message: 'projectKeywordsText and focusKeyword are required'
                });
            }

            // Normalize arrays
            try {
                categories = normalizeArray(categories, 'categories', true);
                subCategories = normalizeArray(subCategories, 'subCategories', true);
                microCategories = normalizeArray(microCategories, 'microCategories', false);
            } catch (err) {
                return res.status(400).json({ message: err.message });
            }

            if (!userId) userId = "676556920ee225052d8cd600";
            if (!userId || !projectName) {
                return res.status(400).json({
                    message: 'userId and projectName are required'
                });
            }

            // Process categories: Check if exists, if not create with isManual: 1
            let categoryId = null;
            if (categories && categories.length > 0) {
                const categoryName = categories[0].trim();

                // Check if category exists
                let category = await ProjectCategory.findOne({ name: categoryName });

                if (!category) {
                    // Category doesn't exist, create it with isManual: 1
                    category = new ProjectCategory({
                        name: categoryName,
                        isManual: 1
                    });
                    await category.save();
                    console.log(`[CreateBusinessWebsite] Created manual category: ${categoryName}`);
                }

                categoryId = category._id;
            }

            // Process subcategories: Check if exists, if not create with isManual: 1
            const processedSubCategories = [];
            if (subCategories && subCategories.length > 0 && categoryId) {
                for (const subCatName of subCategories) {
                    const trimmedName = subCatName.trim();
                    if (!trimmedName) continue;

                    // Check if subcategory exists for this category
                    let subCategory = await SubCategory.findOne({
                        categoryId: categoryId,
                        name: trimmedName
                    });

                    if (!subCategory) {
                        // Subcategory doesn't exist, create it with isManual: 1
                        subCategory = new SubCategory({
                            categoryId: categoryId,
                            name: trimmedName,
                            isManual: 1
                        });
                        await subCategory.save();
                        console.log(`[CreateBusinessWebsite] Created manual subcategory: ${trimmedName} for category: ${categoryId}`);
                    }

                    processedSubCategories.push(trimmedName);
                }
            }

            // Process micro categories: Check if exists, if not create with isManual: 1
            const processedMicroCategories = [];
            if (microCategories && microCategories.length > 0 && categoryId && processedSubCategories.length > 0) {
                // Get the first subcategory ID for micro categories
                const firstSubCategory = await SubCategory.findOne({
                    categoryId: categoryId,
                    name: processedSubCategories[0]
                });

                if (firstSubCategory) {
                    for (const microCatName of microCategories) {
                        const trimmedName = microCatName.trim();
                        if (!trimmedName) continue;

                        // Check if micro category exists for this subcategory
                        let microCategory = await MicroCategory.findOne({
                            subCategoryId: firstSubCategory._id,
                            name: trimmedName
                        });

                        if (!microCategory) {
                            // Micro category doesn't exist, create it with isManual: 1
                            microCategory = new MicroCategory({
                                categoryId: categoryId,
                                subCategoryId: firstSubCategory._id,
                                name: trimmedName,
                                isManual: 1
                            });
                            await microCategory.save();
                            console.log(`[CreateBusinessWebsite] Created manual micro category: ${trimmedName} for subcategory: ${firstSubCategory._id}`);
                        }

                        processedMicroCategories.push(trimmedName);
                    }
                }
            }

            // Save minimal project data immediately, include categories
            const newProject = new UserProject({
                userId,
                serviceType, // optional
                projectName,
                projectKeywordsText,
                focusKeyword,
                wantImages: finalWantImages, // Always defaults to 1
                status: 1,
                projectType: 1, // 1 = business site
                categories: categories || [],
                subCategories: processedSubCategories,
                microCategories: processedMicroCategories
            });

            const savedProject = await newProject.save();

            // Enqueue background job
            console.log(savedProject._id.toString(), "This business website project sent for projectBackgroundQueue From step 1")
            await projectBackgroundQueue.add({ projectId: savedProject._id.toString() });

            // Create notification for super admins
            try {
                const user = await Users.findById(userId).select('email username').lean();
                await Notification.create({
                    userFromId: userId,
                    isSuperAdminNotification: true,
                    message: `${user?.username || user?.email || 'User'} created new business website "${projectName}"`,
                    type: 'project_created',
                    relatedId: savedProject._id
                });
            } catch (notifError) {
                console.error('Error creating business website creation notification:', notifError);
            }

            return res
                .status(201)
                .json({ message: 'Business website created successfully', data: savedProject });

        } catch (error) {
            console.error('Error in createBusinessWebsite:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while processing your request.' });
        }
    },

    deleteProject: async (req, res) => {

        console.log("Delete project API called", req.params)
        const projectId = req.params.id;

        try {
            // Check if project exists in UserProject collection
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ ok: false, error: "Project not found" });
            }

            // Delete associated ProjectDeployment records
            await ProjectDeployment.deleteMany({ projectId });

            // Delete the project from UserProject
            await UserProject.findByIdAndDelete(projectId);

            return res.status(200).json({ ok: true, message: "Project deleted successfully" });
        } catch (error) {
            console.error('Error in deleteProject:', error);
            return res.status(500).json({ ok: false, error: error.message || 'An error occurred while deleting the project' });
        }
    },



    addTheme: async (req, res) => {
        try {
            let { themeId, themeName, sections, settings, isActive } = req.body;


            if (typeof sections == "string") {
                sections = JSON.parse(sections)
            }

            if (!themeId) {

                if (!themeName || !Array.isArray(sections) || sections.length === 0) {
                    return res.status(400).json({
                        message: 'themeName and a non-empty sections array are required'
                    });
                }
            }


            let themeData;

            if (themeId) {
                // 2a. UPDATE existing ThemeData
                themeData = await ThemeData.findById(themeId);
                if (!themeData) {
                    return res.status(404).json({ message: 'Theme data not found' });
                }

                themeData.themeName = themeName;
                themeData.sections = sections;
                if (settings !== undefined) themeData.settings = settings;
                if (isActive !== undefined) themeData.isActive = isActive;

                const updated = await themeData.save();
                return res.json({ message: 'Theme data updated', data: updated });

            } else {
                // 2b. CREATE new ThemeData
                const exists = await ThemeData.findOne({ themeName });
                if (exists) {
                    return res.status(409).json({ message: 'Theme already exists' });
                }

                themeData = new ThemeData({
                    themeName,
                    sections,
                    settings: settings || {},
                    isActive: !!isActive
                });

                const created = await themeData.save();
                return res.status(201).json({ message: 'Theme data created', data: created });
            }

        } catch (err) {
            console.error('addTheme error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    fetchThemeById: async (req, res) => {
        try {
            const { themeId } = req.body;

            if (!themeId) {
                return res.status(400).json({ message: 'themeId is required' });
            }

            const themeData = await ThemeData.findById(themeId);
            if (!themeData) {
                return res.status(404).json({ message: 'Theme data not found' });
            }

            return res.json({ message: 'Theme data fetched', data: themeData });
        } catch (err) {
            console.error('fetchThemeById error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    clearAllData: async (req, res) => {
        try {
            // Delete all documents in each collection
            let clear = await Promise.all([
                UserProject.deleteMany({}),
                Service.deleteMany({}),
                WebsiteSection.deleteMany({})
            ]);

            if (clear) {

                return res.status(200).json({
                    message: 'All data in UserProject, Service and WebsiteSection collections has been deleted.'
                });
            }
        } catch (error) {
            console.error('Error clearing all data:', error);
            return res.status(500).json({ message: 'Internal server error while clearing data.' });
        }
    },





    getUserProjects: async (req, res) => {
        try {
            // 1. Extract pagination and search params from query, with defaults
            let { page = 1, limit = 10, search } = req.query;
            page = parseInt(page, 10);
            limit = parseInt(limit, 10);
            if (isNaN(page) || page < 1) page = 1;
            if (isNaN(limit) || limit < 1) limit = 10;
            const skip = (page - 1) * limit;

            // 2. Get authenticated userId
            const userId = req.user.userId;
            if (!userId) {
                return res.status(400).json({ message: "userId is required" });
            }

            // 3. Verify user exists
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // 4. Build base filter:
            const baseFilter = {};
            if (user.isSuper === 0) {
                baseFilter.userId = userId;
            }

            // 5. If a search term is provided, match against projectName or serviceType
            if (search) {
                const regex = { $regex: search, $options: "i" };
                baseFilter.$or = [
                    { projectName: regex },
                    { serviceType: regex }
                ];
            }

            // 6. Compute totalProjects (no status filter)
            const totalProjects = await UserProject.countDocuments(baseFilter);

            // 7. Compute totalActiveProjects (status === 2)
            const activeFilter = { ...baseFilter, status: 2 };
            const totalActiveProjects = await UserProject.countDocuments(activeFilter);

            // 8. Fetch paginated projects matching baseFilter
            const rawProjects = await UserProject
                .find(baseFilter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            // 9. Enrich each project with deployment status
            const enrichedProjects = await Promise.all(
                rawProjects.map(async (project) => {
                    const deployment = await ProjectDeployment.findOne({ projectId: project._id }).sort({ createdAt: -1 });
                    const deploymentStatus = deployment?.deploymentStatus || "Not deployed yet";
                    return {
                        ...project.toObject(),
                        deploymentStatus
                    };
                })
            );

            const totalPages = Math.ceil(totalProjects / limit);

            // 10. Return response
            return res.status(200).json({
                message: enrichedProjects.length
                    ? "Projects retrieved successfully"
                    : "No projects found",
                data: enrichedProjects,
                count: enrichedProjects.length,
                page,
                limit,
                total: totalProjects,
                totalActiveProjects,
                totalPages
            });
        } catch (error) {
            console.error("Error occurred while fetching user projects:", error);
            return res.status(500).json({
                message: "An error occurred while fetching projects",
                error: error.message
            });
        }
    }
    ,



    // 2. Update Country in Project API
    // controller/AdminController.js

    // controllers/AdminController.js

    // 1. Update Country
    updateCountryInProject: async (req, res) => {
        try {
            let { projectId, countries, manualCountries } = req.body;
            if (typeof countries === 'string') countries = JSON.parse(countries);
            if (typeof manualCountries === 'string') manualCountries = JSON.parse(manualCountries);

            if (
                !projectId ||
                (!(Array.isArray(countries) && countries.length)) &&
                (!(Array.isArray(manualCountries) && manualCountries.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one country (selected or manual) are required!'
                });
            }

            // 1a) Handle manualCountries
            if (Array.isArray(manualCountries) && manualCountries.length) {
                const all = await Country.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let mc of manualCountries) {
                    const rawName = mc.name.trim();
                    const words = rawName.split(/\s+/);
                    const name = words
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');
                    const sortname = words.map(w => w[0].toUpperCase()).join('');
                    const status = mc.status === 0 ? 0 : 1;

                    let existing = await Country.findOne({ name, manual: 1 });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new Country({ id: idStr, sortname, name, manual: 1 }).save();
                    }

                    countries.push({ countryId: idStr, name, status });
                }
            }

            // 1b) Enrich lat/lng
            const enriched = [];
            for (let c of countries) {
                let { countryId, name } = c;
                let status = c.status === 0 ? 0 : 1;
                let doc = await Country.findOne({ id: countryId });
                let lat = doc?.lat ?? null;
                let lng = doc?.lng ?? null;

                if (lat == null || lng == null) {
                    try {
                        const geo = await axios.get('https://us1.locationiq.com/v1/search.php', {
                            params: {
                                key: process.env.LOCATIONIQ_API_KEY,
                                q: name,
                                format: 'json',
                                limit: 1
                            }
                        });
                        const loc = geo.data[0];
                        lat = loc.lat; lng = loc.lon;
                        if (lat && lng) {
                            await Country.updateOne({ id: countryId }, { $set: { lat, lng } });
                        }
                    } catch (err) {
                        console.error(`Geocode failed for ${name}:`, err.message);
                    }
                }

                enriched.push({ countryId, name, lat, lng, bounds: { southwest: null, northeast: null }, status });
            }

            // 1c) Persist to project
            const isCountry = enriched.some(e => e.status === 1) ? 1 : 0;
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.country': enriched, isCountry } },
                { new: true }
            );
            if (!project) return res.status(404).json({ message: 'Project not found!' });

            // 1d) Upsert slugs
            for (let entry of enriched) {
                if (entry.status !== 1) continue;
                const slugText = slugify(entry.name, { lower: true });
                // Create showName by capitalizing the first letter of the country name
                const showName = entry.name.charAt(0).toUpperCase() + entry.name.slice(1).toLowerCase();


                const exists = await Slug.findOne({
                    slug: slugText,
                    slugService: slugText,
                    slugType: 'country',
                    locationId: entry.countryId,
                    showName: showName,
                    projectId
                });

                if (!exists) {
                    await Slug.create({
                        slug: slugText,
                        slugService: slugText,

                        slugType: 'country',
                        locationId: entry.countryId,
                        projectId,
                        showName: showName,

                    });
                }
                else { console.log("slug already exists", slugText) }
            }

            return res.status(200).json({
                message: 'Countries updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateCountryInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 2. Update State
    updateStateInProject: async (req, res) => {
        try {
            let { projectId, states, manualStates } = req.body;
            if (typeof states === 'string') states = JSON.parse(states);
            if (typeof manualStates === 'string') manualStates = JSON.parse(manualStates);

            if (
                !projectId ||
                ((!Array.isArray(states) || !states.length) &&
                    (!Array.isArray(manualStates) || !manualStates.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one state (selected or manual) are required!'
                });
            }

            // 2a) Manual states
            if (Array.isArray(manualStates) && manualStates.length) {
                const all = await State.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let ms of manualStates) {
                    const { countryId, name: rawName } = ms;
                    const status = ms.status === 0 ? 0 : 1;
                    const words = rawName.trim().split(/\s+/);
                    const name = words
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');

                    let existing = await State.findOne({ name, manual: 1, country_id: countryId });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new State({ id: idStr, name, country_id: countryId, manual: 1 }).save();
                    }
                    states.push({ countryId, stateId: idStr, name, status });
                }
            }

            // 2b) Persist to project
            const isState = (states || []).some(s => s.status === 1) ? 1 : 0;
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.state': states, isState } },
                { new: true }
            );
            if (!project) return res.status(404).json({ message: 'Project not found!' });

            // 2c) Upsert slugs (parent = country)
            for (let entry of states) {
                const countryEntry = project.locations.country.find(c => c.countryId === entry.countryId);

                // Fetch the sortName of the country
                const country = await Country.findOne({ id: entry.countryId }).select('sortname name');
                const sortName = country && country.sortname ? country.sortname : null;
                const countryName = country && country.name ? country.name : (countryEntry ? countryEntry.name : '');

                // Create showName: "StateName, countrySortName" OR "StateName, countryName" if no sortName
                let showName;
                if (sortName && sortName.trim()) {
                    showName = `${entry.name}, ${sortName}`;
                } else if (countryName && countryName.trim()) {
                    showName = `${entry.name}, ${countryName}`;
                } else {
                    showName = entry.name; // Fallback to just state name if no country info
                }



                const prefix = countryEntry?.status === 1
                    ? slugify(countryEntry.name, { lower: true }) + '/'
                    : '';
                const fullSlug = prefix + slugify(entry.name, { lower: true });

                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'state',
                    locationId: entry.stateId,
                    showName: showName,

                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'state',
                        locationId: entry.stateId,
                        showName: showName,
                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'States updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateStateInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 3. Update City
    updateCityInProject: async (req, res) => {
        try {
            let { projectId, cities, manualCities } = req.body;
            if (typeof cities === 'string') cities = JSON.parse(cities);
            if (typeof manualCities === 'string') manualCities = JSON.parse(manualCities);

            if (
                !projectId ||
                ((!Array.isArray(cities) || !cities.length) &&
                    (!Array.isArray(manualCities) || !manualCities.length))
            ) {
                return res.status(400).json({
                    message: 'Project ID and at least one city (selected or manual) are required!'
                });
            }

            // 1) Handle any manualCities
            if (Array.isArray(manualCities) && manualCities.length) {
                const all = await City.find().select('id').lean();
                const nums = all.map(c => parseInt(c.id, 10)).filter(n => !isNaN(n));
                let nextId = nums.length ? Math.max(...nums) + 1 : 1;

                for (let mc of manualCities) {
                    const { stateId, name: rawName } = mc;
                    const status = mc.status === 0 ? 0 : 1;
                    const name = rawName
                        .trim()
                        .split(/\s+/)
                        .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                        .join(' ');

                    let existing = await City.findOne({ name, state_id: stateId, manual: 1 });
                    let idStr = existing ? existing.id : (nextId++).toString();
                    if (!existing) {
                        await new City({
                            id: idStr,
                            name,
                            state_id: stateId,
                            manual: 1
                        }).save();
                    }

                    cities.push({ stateId, cityId: idStr, name, status });
                }
            }

            // 2) Persist the city list to the project
            const cityData = (cities || []).map(c => ({
                stateId: c.stateId,
                cityId: c.cityId,
                name: c.name,
                status: c.status === 0 ? 0 : 1
            }));
            const isCity = cityData.some(c => c.status === 1) ? 1 : 0;

            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.city': cityData, isCity } },
                { new: true }
            );
            if (!project) {
                return res.status(404).json({ message: 'Project not found!' });
            }

            // 3) Upsert slugs for each city entry
            for (let entry of cityData) {
                // Find parent state and country records
                const stateEntry = project.locations.state.find(
                    s => String(s.stateId) === String(entry.stateId)
                );
                const countryEntry = stateEntry
                    ? project.locations.country.find(
                        c => String(c.countryId) === String(stateEntry.countryId)
                    )
                    : null;



                // Fetch the sortName and name of the state
                const state = await State.findOne({ id: entry.stateId }).select('sortname name');
                const sortNameOfState = state && state.sortname ? state.sortname : null;
                const stateName = state && state.name ? state.name : (stateEntry ? stateEntry.name : '');

                // Create showName: "CityName, stateSortName" OR "CityName, stateName" if no sortName
                let showName;
                if (sortNameOfState && sortNameOfState.trim()) {
                    showName = `${entry.name}, ${sortNameOfState}`;
                } else if (stateName && stateName.trim()) {
                    showName = `${entry.name}, ${stateName}`;
                } else {
                    showName = entry.name; // Fallback to just city name if no state info
                }

                // Build slug parts in hierarchy, skipping any with status!==1
                const slugParts = [];
                if (countryEntry && countryEntry.status === 1) {
                    slugParts.push(slugify(countryEntry.name, { lower: true }));
                }
                if (stateEntry && stateEntry.status === 1) {
                    slugParts.push(slugify(stateEntry.name, { lower: true }));
                }
                // Always include city itself
                slugParts.push(slugify(entry.name, { lower: true }));

                const fullSlug = slugParts.join('/');

                // Upsert the slug record
                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'city',
                    locationId: entry.cityId,
                    showName: showName,
                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'city',
                        locationId: entry.cityId,
                        showName: showName,

                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'Cities updated successfully!',
                data: project
            });
        } catch (error) {
            console.error('Error in updateCityInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // 4. Update Local Area
    updateLocalAreaInProject: async (req, res) => {
        try {
            const { projectId, localAreas } = req.body;
            if (!projectId || !Array.isArray(localAreas)) {
                return res.status(400).json({
                    message: 'projectId and localAreas (array) are required'
                });
            }

            // 4a) Upsert AdminLocalArea
            const existing = await AdminLocalArea.find().select('id').lean();
            const nums = existing
                .map(a => parseInt(a.id, 10))
                .filter(n => !isNaN(n));
            let nextId = nums.length ? Math.max(...nums) + 1 : 1;
            const payload = [];

            for (let la of localAreas) {
                const { name: rawName, cityId } = la;
                const name = rawName
                    .trim()
                    .split(/\s+/)
                    .map(w => w[0].toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ');

                let area = await AdminLocalArea.findOne({
                    name,
                    city_id: cityId,
                    manual: 1
                });
                if (!area) {
                    const idStr = (nextId++).toString();
                    area = await new AdminLocalArea({
                        id: idStr,
                        name,
                        city_id: cityId,
                        manual: 1
                    }).save();
                }
                payload.push({
                    localAreaId: area.id,
                    name,
                    cityId
                });
            }

            // 4b) Persist to project
            const project = await UserProject.findByIdAndUpdate(
                projectId,
                { $set: { 'locations.localArea': payload, isLocal: 1 } },
                { new: true }
            );
            if (!project) {
                return res.status(404).json({ message: 'Project not found!' });
            }

            // 4c) Upsert slugs (hierarchy: country → state → city → local area)
            for (let area of project.locations.localArea) {
                // find city, state, and country entries
                const cityEntry = project.locations.city.find(
                    c => String(c.cityId) === String(area.cityId)
                );
                const stateEntry = cityEntry
                    ? project.locations.state.find(
                        s => String(s.stateId) === String(cityEntry.stateId)
                    )
                    : null;
                const countryEntry = stateEntry
                    ? project.locations.country.find(
                        c => String(c.countryId) === String(stateEntry.countryId)
                    )
                    : null;

                // build slug parts dynamically, including only status===1
                const slugParts = [];
                if (countryEntry && countryEntry.status === 1) {
                    slugParts.push(slugify(countryEntry.name, { lower: true }));
                }
                if (stateEntry && stateEntry.status === 1) {
                    slugParts.push(slugify(stateEntry.name, { lower: true }));
                }
                if (cityEntry && cityEntry.status === 1) {
                    slugParts.push(slugify(cityEntry.name, { lower: true }));
                }
                // always include the local area itself
                slugParts.push(slugify(area.name, { lower: true }));

                const fullSlug = slugParts.join('/');

                // Fetch city sortName and name
                let citySortName = null;
                let cityName = null;

                if (cityEntry && cityEntry.cityId) {
                    const city = await City.findOne({ id: cityEntry.cityId }).select('sortname name').lean();
                    citySortName = city && city.sortname ? city.sortname : null;
                    cityName = city && city.name ? city.name : (cityEntry.name || null);
                }

                // Create showName: "LocalAreaName, citySortName" OR "LocalAreaName, cityName" if no sortName
                let showName;
                if (citySortName && citySortName.trim()) {
                    showName = `${area.name}, ${citySortName}`;
                } else if (cityName && cityName.trim()) {
                    showName = `${area.name}, ${cityName}`;
                } else {
                    showName = area.name; // Fallback to just area name if no city info
                }



                // upsert the slug
                const exists = await Slug.findOne({
                    slug: fullSlug,
                    slugType: 'local_area',
                    locationId: area.localAreaId,
                    showName: showName,
                    projectId
                });
                if (!exists) {
                    await Slug.create({
                        slug: fullSlug,
                        slugType: 'local_area',
                        locationId: area.localAreaId,
                        showName: showName,

                        projectId
                    });
                }
            }

            return res.status(200).json({
                message: 'Local areas updated successfully',
                data: project
            });
        } catch (error) {
            console.error('Error in updateLocalAreaInProject:', error);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },


    makeEachLocaionPage: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const { locations } = project;

            let allLocations = [];

            // Country
            if (locations.country && Array.isArray(locations.country)) {
                allLocations = allLocations.concat(
                    locations.country.map(c => ({
                        id: c.countryId,
                        name: c.name,
                        lat: c.lat || null,
                        lng: c.lng || null,
                        areaType: 'country'
                    }))
                );
            }
            // State
            if (locations.state && Array.isArray(locations.state)) {
                allLocations = allLocations.concat(
                    locations.state.map(s => ({
                        id: s.stateId,
                        name: s.name,
                        lat: s.lat || null,
                        lng: s.lng || null,
                        areaType: 'state'
                    }))
                );
            }
            // City
            if (locations.city && Array.isArray(locations.city)) {
                allLocations = allLocations.concat(
                    locations.city.map(ci => ({
                        id: ci.cityId,
                        name: ci.name,
                        lat: ci.lat || null,
                        lng: ci.lng || null,
                        areaType: 'city'
                    }))
                );
            }
            // LocalArea
            if (locations.localArea && Array.isArray(locations.localArea)) {
                allLocations = allLocations.concat(
                    locations.localArea.map(la => ({
                        id: la.localAreaId,
                        name: la.name,
                        lat: la.lat || null,
                        lng: la.lng || null,
                        areaType: 'local_area'
                    }))
                );
            }

            // Optional: remove duplicates by id & areaType (if needed)
            // allLocations = _.uniqBy(allLocations, loc => `${loc.areaType}_${loc.id}`);

            await projectBackgroundQueue.add({
                projectId,
                worktype: "areapages",
                locations: allLocations
            });

            return res.status(200).json({
                message: 'Locations fetched',
                data: allLocations
            });
        } catch (err) {
            console.error('Error in getAllLocationsForProject:', err);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },

    // New endpoint: trigger area service page generation for a single location
    makeEachLocationServicePage: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const { locations } = project;
            let allLocations = [];

            // Country
            if (locations.country && Array.isArray(locations.country)) {
                allLocations = allLocations.concat(
                    locations.country.map(c => ({
                        id: c.countryId,
                        name: c.name,
                        lat: c.lat || null,
                        lng: c.lng || null,
                        areaType: 'country',
                        slug: c.slug || undefined
                    }))
                );
            }
            // State
            if (locations.state && Array.isArray(locations.state)) {
                allLocations = allLocations.concat(
                    locations.state.map(s => ({
                        id: s.stateId,
                        name: s.name,
                        lat: s.lat || null,
                        lng: s.lng || null,
                        areaType: 'state',
                        slug: s.slug || undefined
                    }))
                );
            }
            // City
            if (locations.city && Array.isArray(locations.city)) {
                allLocations = allLocations.concat(
                    locations.city.map(ci => ({
                        id: ci.cityId,
                        name: ci.name,
                        lat: ci.lat || null,
                        lng: ci.lng || null,
                        areaType: 'city',
                        slug: ci.slug || undefined
                    }))
                );
            }
            // Local Area
            if (locations.localArea && Array.isArray(locations.localArea)) {
                allLocations = allLocations.concat(
                    locations.localArea.map(la => ({
                        id: la.localAreaId,
                        name: la.name,
                        lat: la.lat || null,
                        lng: la.lng || null,
                        areaType: 'local_area',
                        slug: la.slug || undefined
                    }))
                );
            }

            // Optional: Remove duplicates by id & areaType (if needed)
            // allLocations = _.uniqBy(allLocations, loc => `${loc.areaType}_${loc.id}`);

            if (!allLocations.length) {
                return res.status(404).json({ message: 'No locations found for this project.' });
            }


            // console.log(allLocations,"all locations are here");return 

            // Trigger queue for ALL locations in bulk
            await generateServiceDescQueue.add({
                projectId,
                worktype: "areapages",
                locations: allLocations
            });

            return res.status(200).json({
                message: 'Area Service Page generation triggered for ALL locations of the project.',
                count: allLocations.length,
                data: allLocations
            });
        } catch (err) {
            console.error('Error in createOrUpdateAllAreaServicePages:', err);
            return res.status(500).json({ message: 'An error occurred.' });
        }
    },



    generateServices: async (req, res) => {
        try {
            // Get projectId from request body



            let { projectId, wantAiServices = 1, servicesCount = 2 } = req.body;

            console.log(servicesCount, "<><><>><><><>servicesCount")

            // console.log(req.body);return


            // Validate wantAiServices flag
            if (![0, 1].includes(Number(wantAiServices))) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }


            // Validate servicesCount, if AI services are enabled (wantAiServices is 1)
            if (wantAiServices === 1) {
                // Check if servicesCount is a string and try to convert it to a number
                if (typeof servicesCount === 'string' && !isNaN(servicesCount)) {
                    // Convert to number
                    servicesCount = Number(servicesCount);
                }

                // Validate if servicesCount is now a valid number
                if (typeof servicesCount !== 'number' || servicesCount <= 0) {
                    return res.status(400).json({ message: 'servicesCount must be a positive number' });
                }
                console.log("SERVICE COUNT TO SEND FROM API", servicesCount)
            }



            // Validate the project ID
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // Fetch the project data
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Extract data from the project (locations could be arrays of objects)
            const countries = project.locations.country || [];
            const states = project.locations.state || [];
            const cities = project.locations.city || [];
            const localAreas = project.locations.localArea || [];
            const homepage = [
                {
                    "countryId": "100001",
                    "name": "Homepage",
                    "_id": {
                        "$oid": "681471bdf400e439bec4c990"
                    }
                }
            ];

            console.log(`Received location data: Countries(${countries.length}), States(${states.length}), Cities(${cities.length}), LocalAreas(${localAreas.length})}`);

            // Send the success response immediately after validating the project and extracting the data
            res.status(200).json({
                message: 'All services and documents are being processed in the background!',
            });

            // Function to process jobs sequentially in different Redis queues
            async function processJobsSequentially(dataArray, queueName, type, projectId, wantAiServices, servicesCount) {
                console.log(`Starting to add ${type} jobs to ${queueName}. Total ${type} count: ${dataArray.length}, Want services is ${wantAiServices}`);
                for (const data of dataArray) {
                    // Add job to the Redis queue
                    await redisQueue.add({
                        queueName,  // Specific queue name (e.g., 'countryQueue')
                        type,       // 'country', 'state', 'city', 'local_area'
                        data,
                        projectId,
                        wantAiServices,
                        servicesCount // Include the servicesCount in the Redis job
                    });
                    console.log(`Added ${type} job for: ${JSON.stringify(data)}`);
                }
                console.log(`All ${type} jobs added to ${queueName}.`);
            }

            // Function to wait for a queue to complete processing its pending jobs
            async function waitForQueueCompletion(queueName) {
                let isQueueEmpty = false;
                while (!isQueueEmpty) {
                    // Get the count of jobs in the queue
                    const jobCount = await redisQueue.getJobCounts();
                    // Sum pending jobs: waiting, active, delayed
                    const pendingJobs = jobCount.waiting + jobCount.active + jobCount.delayed;

                    console.log(`Queue ${queueName}: Pending jobs count: ${pendingJobs}`);

                    // If there are no pending jobs, the queue is empty
                    if (pendingJobs === 0) {
                        isQueueEmpty = true;
                    } else {
                        // Wait for 1 second before checking again
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                console.log(`All jobs in ${queueName} have been processed!`);
            }

            // Process jobs in sequence, waiting for the previous one to complete before moving to the next
            await processJobsSequentially(homepage, 'homepageQueue', 'homepage', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('homepageQueue');

            await processJobsSequentially(countries, 'countryQueue', 'country', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('countryQueue');

            await processJobsSequentially(states, 'stateQueue', 'state', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('stateQueue');

            await processJobsSequentially(cities, 'cityQueue', 'city', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('cityQueue');

            await processJobsSequentially(localAreas, 'localAreaQueue', 'local_area', projectId, wantAiServices, servicesCount);
            await waitForQueueCompletion('localAreaQueue');

            // Generate Privacy Policy, Terms & Conditions, and About Us content in the background
            const projectName = project.projectName;
            const serviceType = project.serviceType;





            // Generate Service Description
            await generateServiceDescQueue.add({ projectId });



        } catch (error) {
            console.error('Error in addServicesToLocation:', error);
            return res.status(500).json({ message: 'An error occurred while processing your request.' });
        }
    },


    //6. Add services to location API
    addServicesToLocation: async (req, res) => {
        try {
            console.log("Request Body:", req.body);
            // 1) VALIDATION (unchanged)
            let { projectId, wantAiServices = 1, services = [], servicesCount = 2 } = req.body;
            const userId = req.user.userId;

            if (![0, 1].includes(Number(wantAiServices))) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }
            if (wantAiServices === 0 && typeof services === 'string') {
                services = JSON.parse(services);
            }
            if (wantAiServices === 0 && (!Array.isArray(services) || services.length === 0)) {
                return res.status(400).json({
                    message: 'When wantAiServices is 0, you must provide a non-empty services array'
                });
            }

            // Validate servicesCount, if AI services are enabled (wantAiServices is 1)
            if (wantAiServices === 1) {
                // Check if servicesCount is a string and try to convert it to a number
                if (typeof servicesCount === 'string' && !isNaN(servicesCount)) {
                    // Convert to number
                    servicesCount = Number(servicesCount);
                }

                // Validate if servicesCount is now a valid number
                if (typeof servicesCount !== 'number' || servicesCount <= 0) {
                    return res.status(400).json({ message: 'servicesCount must be a positive number' });
                }
                console.log("SERVICE COUNT TO SEND FROM API", servicesCount)
            }

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // 2) FILTER OUT ALREADY-GENERATED PAGES
            const doSite = !project.siteContentGenerated;
            const homepage = doSite
                ? [{ countryId: '100001', name: 'Homepage', _id: { $oid: '681471bdf400e439bec4c990' } }]
                : [];

            // Check if this is a business website (projectType = 1)
            const isBusinessWebsite = project.projectType === 1;

            let countries = [];
            let states = [];
            let cities = [];
            let localAreas = [];
            let businessLocations = []; // Parent locations (type = 0)
            let businessLocalAreas = []; // Child/local areas (type = 1)

            if (isBusinessWebsite) {
                // For business websites, fetch from BusinessLocation model
                const allBusinessLocations = await BusinessLocation.find({
                    projectId: projectId,
                    status: 1 // Active
                }).lean();

                // Separate parent locations (type = 0) and child/local areas (type = 1)
                businessLocations = allBusinessLocations
                    .filter(loc => loc.type === 0 && !loc.pageGenerated)
                    .map(loc => ({
                        _id: loc._id,
                        name: loc.areaName,
                        areaName: loc.areaName,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        country: loc.country || null,
                        state: loc.state || null,
                        city: loc.city || null,
                        googlePlaceId: loc.googlePlaceId || null,
                        formattedAddress: loc.formattedAddress || null,
                        bounds: loc.bounds || null
                    }));

                businessLocalAreas = allBusinessLocations
                    .filter(loc => loc.type === 1 && !loc.pageGenerated)
                    .map(loc => ({
                        _id: loc._id,
                        name: loc.areaName,
                        areaName: loc.areaName,
                        parentId: loc.parentId,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        country: loc.country || null,
                        state: loc.state || null,
                        city: loc.city || null,
                        googlePlaceId: loc.googlePlaceId || null,
                        formattedAddress: loc.formattedAddress || null,
                        bounds: loc.bounds || null
                    }));
            } else {
                // For location-based websites, use existing logic
                countries = project.locations.country
                    .filter(c => c.status === 1 && !c.pageGenerated);

                states = project.locations.state
                    .filter(s => s.status === 1 && !s.pageGenerated);

                cities = project.locations.city
                    .filter(c => c.status === 1 && !c.pageGenerated);

                localAreas = project.locations.localArea
                    .filter(l => l.status === 1 && !l.pageGenerated);
            }

            // 3) IF NOTHING TO DO → EARLY EXIT
            if (
                homepage.length === 0 &&
                countries.length === 0 &&
                states.length === 0 &&
                cities.length === 0 &&
                localAreas.length === 0 &&
                businessLocations.length === 0 &&
                businessLocalAreas.length === 0
            ) {
                return res.status(200).json({ message: 'All pages already generated—nothing to do.' });
            }

            // 4) ACK IMMEDIATE RESPONSE
            res.status(200).json({
                message: 'All services and documents are being processed in the background!',
            });
            console.log(servicesCount, "<><><>><><><>servicesCount")

            // 5) QUEUE HELPERS (unchanged)
            async function processJobsSequentially(dataArray, queueName, type) {
                console.log(`Adding ${type} jobs (${dataArray.length}) to ${queueName}`);
                for (const data of dataArray) {
                    await redisQueue.add({ queueName, type, data, projectId, wantAiServices, services, servicesCount });
                    console.log(` → added ${type} job for`, data);
                }
            }
            async function waitForQueueCompletion(queueName) {
                let pending = true;
                while (pending) {
                    const counts = await redisQueue.getJobCounts();
                    const total = counts.waiting + counts.active + counts.delayed;
                    console.log(`[${queueName}] pending jobs:`, total);
                    if (total === 0) pending = false;
                    else await new Promise(r => setTimeout(r, 1000));
                }
            }

            // 6) ENQUEUE IN ORDER
            await processJobsSequentially(homepage, 'homepageQueue', 'homepage');
            await waitForQueueCompletion('homepageQueue');

            if (isBusinessWebsite) {
                // For business websites: process business locations and local areas
                await processJobsSequentially(businessLocations, 'businessLocationQueue', 'business_location');
                await waitForQueueCompletion('businessLocationQueue');

                await processJobsSequentially(businessLocalAreas, 'businessLocalareaQueue', 'business_local_area');
                await waitForQueueCompletion('businessLocalareaQueue');
            } else {
                // For location-based websites: process country, state, city, local area
                await processJobsSequentially(countries, 'countryQueue', 'country');
                await waitForQueueCompletion('countryQueue');

                await processJobsSequentially(states, 'stateQueue', 'state');
                await waitForQueueCompletion('stateQueue');

                await processJobsSequentially(cities, 'cityQueue', 'city');
                await waitForQueueCompletion('cityQueue');

                await processJobsSequentially(localAreas, 'localAreaQueue', 'local_area');
                await waitForQueueCompletion('localAreaQueue');
            }

            // 7) GLOBAL SITE CONTENT (only once)
            if (doSite) {
                const projectName = project.projectName;
                const serviceType = project.serviceType;

                const privacyPolicyPrompt = `
                Write a privacy policy for the website of "${projectName}", which provides "${serviceType}" services. The policy should include:
                - Information about the types of personal data collected (e.g., name, email, payment details).
                - How this data is used (e.g., for service provision, marketing, customer support).
                - Details on how the data is protected and the security measures taken.
                - How users can manage their data preferences (e.g., opt-out, data deletion).
                - The company's stance on sharing data with third parties, and any exceptions (e.g., with partners or for legal purposes).
                - A mention of compliance with relevant laws (e.g., GDPR, CCPA).
                - A statement on cookie usage, if applicable.
                The content should be concise but cover all important aspects of a privacy policy, making it clear and transparent for users.
                Keep the content around 300-400 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

                const termsAndConditionsPrompt = `
                Write terms and conditions for the website of "${projectName}", which offers "${serviceType}" services. The terms and conditions should include:
                - An introduction explaining the agreement between the company and the user.
                - A description of the services provided by the website.
                - Rules and obligations for users when accessing the website or using services (e.g., account creation, content usage).
                - A disclaimer of liability (e.g., for service interruptions or content errors).
                - The company's right to modify the terms and conditions and the notification process.
                - Information about the refund and cancellation policies, if applicable.
                - The governing law and jurisdiction in case of disputes.
                - A mention of the website's right to terminate accounts for violations of the terms.
                The content should be clear, legally sound, and professional. Aim for around 400-500 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

                const aboutUsPrompt = `
                Write an "About Us" section for the website of "${projectName}", which offers "${serviceType}" services. The content should include:
                - An introduction to the company, its mission, and the services it provides.
                - A brief history of the company and its growth.
                - Key values or principles that drive the company (e.g., customer satisfaction, innovation, integrity).
                - The team behind the company, highlighting expertise or leadership.
                - A mention of any partnerships or unique selling points.
                The content should reflect the company's vision and its impact in the "${serviceType}" space.
                Keep the content around 300-400 words
                -make sure i want it in html tags format like heading and p tags.
            `;

                const updateOrCreateContent = async (sectionTitle, content) => {
                    await WebsiteSection.findOneAndUpdate(
                        { projectId, sectionTitle },
                        { $set: { sectionContent: content } },
                        { new: true, upsert: true }
                    );
                };

                const privacyPolicyContent = await fetchStringFromOpenAI(privacyPolicyPrompt, "privacypolicy", { userId, projectId, pageId: "privacy", promptFrom: "addServicesTolocationAPI", promptFor: "privacyPolicy" });
                await updateOrCreateContent('privacyPolicyContent', privacyPolicyContent);

                const tncContent = await fetchStringFromOpenAI(termsAndConditionsPrompt, "termsAndConditions", { userId, projectId, pageId: "terms", promptFrom: "addServicesTolocationAPI", promptFor: "termsAndConditions" });
                await updateOrCreateContent('termsAndConditionsContent', tncContent);

                const aboutUsContent = await fetchStringFromOpenAI(aboutUsPrompt, "aboutUs", { userId, projectId, pageId: "about", promptFrom: "addServicesTolocationAPI", promptFor: "aboutUs" });
                await updateOrCreateContent('aboutUsContent', aboutUsContent);

                project.siteContentGenerated = true;
            }

            // 8) ENQUEUE SERVICE-DESC AND AREA PAGES
            if (isBusinessWebsite) {
                // For business websites, send business locations to queues
                const allBusinessLocationsForQueues = [
                    ...businessLocations.map(loc => ({
                        id: loc._id.toString(),
                        name: loc.areaName || loc.name,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        areaType: 'business_location'
                    })),
                    ...businessLocalAreas.map(loc => ({
                        id: loc._id.toString(),
                        name: loc.areaName || loc.name,
                        lat: loc.lat || null,
                        lng: loc.lng || null,
                        areaType: 'business_local_area'
                    }))
                ];

                console.log(`[addServicesToLocation] Business website detected. Preparing ${allBusinessLocationsForQueues.length} locations for queues:`,
                    allBusinessLocationsForQueues.map(l => ({ id: l.id, name: l.name, areaType: l.areaType })));

                // Send to generateServiceDescQueue for service pages
                if (allBusinessLocationsForQueues.length > 0) {
                    console.log(`[addServicesToLocation] Sending ${allBusinessLocationsForQueues.length} locations to generateServiceDescQueue`);
                    await generateServiceDescQueue.add({
                        projectId,
                        worktype: "areapages",
                        locations: allBusinessLocationsForQueues
                    });
                    console.log(`[addServicesToLocation] ✅ Successfully added to generateServiceDescQueue`);
                }

                // Send to projectBackgroundQueue for area pages
                if (allBusinessLocationsForQueues.length > 0) {
                    console.log(`[addServicesToLocation] Sending ${allBusinessLocationsForQueues.length} locations to projectBackgroundQueue`);
                    await projectBackgroundQueue.add({
                        projectId,
                        worktype: "areapages",
                        locations: allBusinessLocationsForQueues
                    });
                    console.log(`[addServicesToLocation] ✅ Successfully added to projectBackgroundQueue`);
                }

                // Mark business locations as pageGenerated
                const businessLocationIds = businessLocations.map(loc => loc._id);
                const businessLocalAreaIds = businessLocalAreas.map(loc => loc._id);

                await BusinessLocation.updateMany(
                    { _id: { $in: [...businessLocationIds, ...businessLocalAreaIds] } },
                    { $set: { pageGenerated: true } }
                );
            } else {
                // For location-based websites, use existing logic
                await generateServiceDescQueue.add({ projectId });

                // Mark location-based pages as pageGenerated
                project.locations.country.forEach(c => { if (!c.pageGenerated) c.pageGenerated = true; });
                project.locations.state.forEach(s => { if (!s.pageGenerated) s.pageGenerated = true; });
                project.locations.city.forEach(c => { if (!c.pageGenerated) c.pageGenerated = true; });
                project.locations.localArea.forEach(l => { if (!l.pageGenerated) l.pageGenerated = true; });
            }

            await project.save();

        } catch (error) {
            console.error('Error in addServicesToLocation:', error);
            return res.status(500).json({ message: 'An error occurred while processing your request.' });
        }
    },

    addNewServices: async (req, res) => {
        try {
            let { projectId, wantAiServices = 1, services = [] } = req.body;
            wantAiServices = Number(wantAiServices);

            // Validate inputs
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }
            if (![0, 1].includes(wantAiServices)) {
                return res.status(400).json({ message: 'wantAiServices must be 0 or 1' });
            }
            if (wantAiServices === 0) {
                if (typeof services === 'string') {
                    try { services = JSON.parse(services); }
                    catch { return res.status(400).json({ message: 'services must be JSON array' }); }
                }
                if (!Array.isArray(services) || services.length === 0) {
                    return res.status(400).json({ message: 'When wantAiServices=0, provide non-empty services array' });
                }
            }

            // Immediately respond so caller is not blocked
            res.status(200).json({
                message: 'New services will be added in background; description generation will follow.'
            });

            // Enqueue the add-new-services job
            await addNewServicesQueue.add({
                projectId,
                wantAiServices,
                services
            });

        } catch (err) {
            console.error('Error in addNewServices API:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    },

    generateTnC_Au_Pp: async (req, res) => {
        try {
            const { projectId } = req.body;

            // Validate the project ID
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // Fetch the project data
            const project = await UserProject.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }
            let projectName = project.projectName;
            let serviceType = project.serviceType;

            // Define prompts for Privacy Policy and Terms & Conditions
            const privacyPolicyPrompt = `
                Write a privacy policy for the website of "${projectName}", which provides "${serviceType}" services. The policy should include:
                - Information about the types of personal data collected (e.g., name, email, payment details).
                - How this data is used (e.g., for service provision, marketing, customer support).
                - Details on how the data is protected and the security measures taken.
                - How users can manage their data preferences (e.g., opt-out, data deletion).
                - The company's stance on sharing data with third parties, and any exceptions (e.g., with partners or for legal purposes).
                - A mention of compliance with relevant laws (e.g., GDPR, CCPA).
                - A statement on cookie usage, if applicable.
                The content should be concise but cover all important aspects of a privacy policy, making it clear and transparent for users.
                Keep the content around 300-400 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

            const termsAndConditionsPrompt = `
                Write terms and conditions for the website of "${projectName}", which offers "${serviceType}" services. The terms and conditions should include:
                - An introduction explaining the agreement between the company and the user.
                - A description of the services provided by the website.
                - Rules and obligations for users when accessing the website or using services (e.g., account creation, content usage).
                - A disclaimer of liability (e.g., for service interruptions or content errors).
                - The company's right to modify the terms and conditions and the notification process.
                - Information about the refund and cancellation policies, if applicable.
                - The governing law and jurisdiction in case of disputes.
                - A mention of the website's right to terminate accounts for violations of the terms.
                The content should be clear, legally sound, and professional. Aim for around 400-500 words.
                -make sure i want it in html tags format like heading and p tags.
                `;

            const aboutUsPrompt = `
                Write an "About Us" section for the website of "${projectName}", which offers "${serviceType}" services. The content should include:
                - An introduction to the company, its mission, and the services it provides.
                - A brief history of the company and its growth.
                - Key values or principles that drive the company (e.g., customer satisfaction, innovation, integrity).
                - The team behind the company, highlighting expertise or leadership.
                - A mention of any partnerships or unique selling points.
                The content should reflect the company's vision and its impact in the "${serviceType}" space.
                Keep the content around 300-400 words
                -make sure i want it in html tags format like heading and p tags.
            `;

            // Update or create content sections
            const updateOrCreateContent = async (sectionTitle, content) => {
                try {
                    const updatedContent = await WebsiteSection.findOneAndUpdate(
                        {
                            projectId: projectId,
                            sectionTitle: sectionTitle
                        },
                        {
                            $set: {
                                sectionContent: content
                            }
                        },
                        {
                            new: true,        // Return the modified document
                            upsert: true      // Create a new document if not found
                        });

                    console.log(`Successfully ${updatedContent ? 'updated' : 'created'} ${sectionTitle}`);
                    return updatedContent;
                } catch (error) {
                    console.error(`Error updating or creating ${sectionTitle}:`, error);
                    return null;
                }
            };

            // Generate Privacy Policy, Terms & Conditions, and About Us content
            const userId = req.user?.userId || project.userId?.toString() || 'admin';

            const privacyPolicyContent = await getResponseFromOpenAITracked(
                privacyPolicyPrompt,
                'PrivacyPolicyGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'privacy_policy'
                }
            );
            await updateOrCreateContent('privacyPolicyContent', privacyPolicyContent.text);

            const termsAndConditionsContent = await getResponseFromOpenAITracked(
                termsAndConditionsPrompt,
                'TermsAndConditionsGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'terms_and_conditions'
                }
            );
            await updateOrCreateContent('termsAndConditionsContent', termsAndConditionsContent.text);

            const aboutUsContent = await getResponseFromOpenAITracked(
                aboutUsPrompt,
                'AboutUsGeneration',
                {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'about_us'
                }
            );
            await updateOrCreateContent('aboutUsContent', aboutUsContent.text);

            return helper.sendSuccess(res, 201, 'Project updated successfully', project);

        } catch (error) {
            return helper.sendError(res, 500, error);
        }
    },

    generateServiceDesc: async (req, res) => {
        try {
            const { projectId } = req.body;

            // Validate required fields
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required!' });
            }

            console.log("Adding generateServiceDesc task to the queue for projectId:", projectId);

            // Add task to Redis queue
            await generateServiceDescQueue.add({ projectId });

            // Send immediate response to the client
            return res.status(200).json({
                message: "The service description generation task has been added to the queue. It will process in the background.",
            });
        } catch (error) {
            console.log(error, "Error in generateServiceDesc API");
            return helper.sendError(res, 500, error);
        }
    },

    generateUnsplashImages: async (req, res) => {
        try {
            let query = req.body.query;

            if (!query) {
                return res.status(400).json({ error: "Query parameter is required" });
            }

            const fetchImages = async (prompt) => {
                const apiKey = process.env.UNSPLASH_ACCESS_KEY;
                const url = `https://api.unsplash.com/search/photos`;


                try {
                    const response = await axios.get(url, {
                        params: {
                            query: prompt,
                            per_page: 10, // Number of results per page
                        },
                        headers: {
                            Authorization: `Client-ID ${apiKey}`,
                        },
                    });

                    const images = response.data.results.map((image) => ({
                        description: image.alt_description,
                        url: image.urls.full,
                    }));

                    console.log(images);


                    res.json({
                        images: images,

                    });
                } catch (error) {
                    console.error('Error fetching images:', error.response?.data || error.message);
                }
            };


            // Example usage
            fetchImages(query);

        } catch (error) {
            console.log(error, "error is");


        }
    },

    // Helper function to wait for queue processing completion

    my_site: async (req, res) => {
        try {
            const { projectId } = req.body;

            console.log(req.body, "body data");

            // Validate required field
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }

            // Fetch project information
            const projectInfo = await UserProject.findById(projectId).lean();
            if (!projectInfo) {
                return res.status(404).json({ message: "Project not found!" });
            }

            // Response with only project table data
            res.status(200).json({
                message: "Project data fetched successfully!",
                projectInfo,
            });
        } catch (error) {
            console.error("Error in mySite API:", error);
            res.status(500).json({ error: error.message });
        }
    },

    fetch_countries: async (req, res) => {
        const { page = 1, limit = 1000, search = "", sort = "asc" } = req.query;
        console.log("Fetching countries:", req.query);

        try {
            const query = search ? { name: { $regex: search, $options: "i" } } : {};
            const sortOrder = sort === "desc" ? -1 : 1;

            const countries = await Country.find(query)
                .sort({ name: sortOrder }) // Sorting A-Z or Z-A
            // .skip((page - 1) * limit)
            // .limit(Number(limit));

            const totalCountries = await Country.countDocuments(query);

            res.status(200).json({
                message: "Countries fetched successfully",
                data: countries,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCountries / limit),
                    totalCountries,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    fetch_states: async (req, res) => {
        let { page = 1, limit = 100, search = "", country_ids, sort = "asc" } = req.query;
        console.log("Fetching states:", req.query);

        try {
            // Convert `page` & `limit` to numbers
            page = Number(page);
            limit = Number(limit);

            // Ensure `country_ids` is an array
            if (typeof country_ids === "string") {
                country_ids = [country_ids]; // Convert single value to array
            } else if (!Array.isArray(country_ids)) {
                country_ids = []; // Default to empty array if undefined
            }


            // console.log(country_ids,"country_ids");return

            const query = {
                ...(search && { name: { $regex: search, $options: "i" } }),
                ...(country_ids.length > 0 && { country_id: { $in: country_ids } }), // Use `$in` for multiple IDs
            };

            const sortOrder = sort === "desc" ? -1 : 1;

            const states = await State.find(query)
                .sort({ name: sortOrder })
            // .skip((page - 1) * limit)
            // .limit(limit); // Enable pagination

            const totalStates = await State.countDocuments(query);

            res.status(200).json({
                message: "States fetched successfully",
                data: states,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalStates / limit),
                    totalStates,
                },
            });
        } catch (error) {
            console.error("Error fetching states:", error);
            res.status(500).json({ message: "Server error" });
        }
    },


    fetch_cities: async (req, res) => {
        const { page = 1, limit = 100, search = "", state_ids = [], sort = "asc" } = req.query;
        console.log("Fetching cities:", req.query);

        try {
            const query = {
                ...(search && { name: { $regex: search, $options: "i" } }),
                ...(state_ids.length && { state_id: { $in: state_ids.split(",") } }),
            };
            const sortOrder = sort === "desc" ? -1 : 1;

            const cities = await City.find(query)
                .sort({ name: sortOrder })
            // .skip((page - 1) * limit)
            // .limit(Number(limit));

            const totalCities = await City.countDocuments(query);

            const updatedCities = cities.map(city => {
                const cityObject = city.toObject();  // Convert Mongoose document to plain JavaScript object
                cityObject._id = cityObject.id;     // Set _id to the value of id
                return cityObject;
            });


            res.status(200).json({
                message: "Cities fetched successfully",
                data: updatedCities,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalCities / limit),
                    totalCities,
                },
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Server error" });
        }
    },

    fetchServicesByProjectId: async (req, res) => {

        try {
            const { projectId } = req.params; // Get projectId from URL parameters

            if (!projectId) {
                return res.status(400).json({ message: 'ProjectId is required' });
            }

            // Fetch services from the database for the provided projectId
            const services = await Service.find({ projectId }).populate('projectId', 'projectName') // Optionally populate project details if needed
                .sort({ createdAt: -1 }); // Sort services by creation date (most recent first)

            if (!services.length) {
                return res.status(404).json({ message: 'No services found for this project' });
            }

            // Respond with the services data
            return res.status(200).json({
                message: 'Services fetched successfully',
                data: services
            });
        } catch (error) {
            console.error('Error fetching services:', error);
            return res.status(500).json({ message: 'Server error while fetching services' });
        }
    },


    updateAboutUs: async (req, res) => {
        try {
            const { projectId, email, phone, mainLocation } = req.body;

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Always create a new AboutUs document (no update path)
            const aboutUs = new AboutUs({
                projectId,
                email,
                phone,
                mainLocation
            });

            await aboutUs.save();

            // Generate/Upsert Contact Us FAQs (non-blocking)
            upsertContactUsFAQ({
                project,
                email: aboutUs.email,
                phone: aboutUs.phone,
                mainLocation: aboutUs.mainLocation
            }).catch(err => console.warn('[ContactUs FAQ] async error:', err.message));

            return res.status(201).json({
                message: 'About Us created successfully',
                data: aboutUs
            });
        } catch (error) {
            console.error('Error creating About Us:', error);
            return res.status(500).json({ message: 'Server error while creating About Us' });
        }
    },



    getAboutUs: async (req, res) => {
        try {

            console.log("we are in about converted contact js")
            const { projectId } = req.params;  // Get projectId from URL params

            if (!projectId) { throw "projectId is requiredh" }

            // Check if the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Fetch AboutUs record for the given projectId
            const aboutUs = await AboutUs.findOne({ projectId });

            if (!aboutUs) {
                return res.status(404).json({ message: 'About Us information not found for this project' });
            }

            // Return the AboutUs details
            return res.status(200).json({ message: 'About Us details fetched successfully', data: aboutUs });
        } catch (error) {
            console.error('Error fetching About Us:', error);
            return res.status(500).json({ message: 'Server error while fetching About Us' });
        }
    },


    // Upsert Website Page - name is unique identifier (non-changeable), slug is changeable URL path
    upsertWebsitePage: async (req, res) => {
        try {
            console.log('[upsertWebsitePage] Request received:', req.body);
            console.log('[upsertWebsitePage] Query params:', req.query);
            console.log('[upsertWebsitePage] URL params:', req.params);

            // Try to get projectId from body, query params, or URL params
            let { projectId, name, slug, displayName, description, pageId } = req.body;
            projectId = projectId || req.query.projectId || req.params.projectId;

            // projectId is now required
            if (!projectId) {
                console.error('[upsertWebsitePage] Missing required field: projectId');
                console.error('[upsertWebsitePage] Request body:', req.body);
                console.error('[upsertWebsitePage] Request query:', req.query);
                console.error('[upsertWebsitePage] Request params:', req.params);
                return res.status(400).json({
                    message: 'projectId is required. Please provide projectId in the request body, query parameters, or URL parameters.',
                    received: {
                        body: req.body,
                        query: req.query,
                        params: req.params
                    }
                });
            }

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                console.error('[upsertWebsitePage] Invalid projectId format:', projectId);
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // Verify project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[upsertWebsitePage] Project not found:', projectId);
                return res.status(404).json({ message: 'Project not found' });
            }

            // If pageId is provided, try to find by ID first (and verify it belongs to this project)
            if (pageId) {
                try {
                    const existingPage = await WebsitePage.findOne({
                        _id: pageId,
                        projectId: projectId
                    });
                    if (existingPage) {
                        console.log('[upsertWebsitePage] Page found by ID:', existingPage._id);

                        // IMPORTANT: name is non-changeable once created
                        // Only update slug, displayName, and description
                        let updated = false;
                        let slugChanged = false;
                        const oldSlug = existingPage.slug;

                        // Update slug if provided and different
                        if (slug !== undefined && slug !== null) {
                            const normalizedSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
                            if (normalizedSlug !== existingPage.slug) {
                                existingPage.slug = normalizedSlug;
                                updated = true;
                                slugChanged = true;
                                console.log('[upsertWebsitePage] Slug changed from', oldSlug, 'to', normalizedSlug);
                            }
                        }

                        // Update displayName if provided and different
                        if (displayName && displayName.trim() !== existingPage.displayName) {
                            existingPage.displayName = displayName.trim();
                            updated = true;
                        }

                        // Update description if provided
                        if (description !== undefined && description !== existingPage.description) {
                            existingPage.description = description ? description.trim() : '';
                            updated = true;
                        }

                        if (updated) {
                            await existingPage.save();
                            console.log('[upsertWebsitePage] Page updated:', existingPage._id);

                            // If slug changed, update menu URLs in headers/footers
                            if (slugChanged && oldSlug) {
                                try {
                                    // Helper function to update menu URLs
                                    const updateMenuUrls = async (pageId, newSlug) => {
                                        // Recursive function to update menu items and their children
                                        const updateMenuItems = (menuItems, pageId, newSlug) => {
                                            if (!Array.isArray(menuItems)) return menuItems;

                                            return menuItems.map(item => {
                                                const updatedItem = { ...item };

                                                // If this menu item is linked to the page, update its URL
                                                if (item.pageId && item.pageId.toString() === pageId.toString()) {
                                                    updatedItem.url = `/${newSlug}`;
                                                    console.log(`[updateMenuUrls] Updated menu item "${item.name}" URL to /${newSlug}`);
                                                }

                                                // Recursively update children
                                                if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                                                    updatedItem.children = updateMenuItems(item.children, pageId, newSlug);
                                                }

                                                return updatedItem;
                                            });
                                        };

                                        // Find all headers and footers that have menu items linked to this page
                                        const headersFooters = await SiteHeaderFooter.find({
                                            $or: [
                                                { 'menu.pageId': pageId },
                                                { 'menu.children.pageId': pageId }
                                            ]
                                        });

                                        console.log(`[updateMenuUrls] Found ${headersFooters.length} headers/footers to update`);

                                        let updatedCount = 0;

                                        // Update each header/footer
                                        for (const headerFooter of headersFooters) {
                                            const updatedMenu = updateMenuItems(headerFooter.menu, pageId, newSlug);

                                            // Check if menu actually changed
                                            const menuChanged = JSON.stringify(headerFooter.menu) !== JSON.stringify(updatedMenu);

                                            if (menuChanged) {
                                                headerFooter.menu = updatedMenu;
                                                await headerFooter.save();
                                                updatedCount++;
                                                console.log(`[updateMenuUrls] Updated ${headerFooter.type === 0 ? 'header' : 'footer'} ${headerFooter._id}`);
                                            }
                                        }

                                        console.log(`[updateMenuUrls] Completed updating ${updatedCount} headers/footers`);
                                        return updatedCount;
                                    };

                                    await updateMenuUrls(existingPage._id.toString(), existingPage.slug);
                                    console.log('[upsertWebsitePage] Menu URLs updated successfully');
                                } catch (menuUpdateError) {
                                    console.error('[upsertWebsitePage] Error updating menu URLs:', menuUpdateError);
                                    // Don't fail the request if menu update fails
                                }
                            }
                        }

                        // Ensure page exists in WebsiteDesignsData
                        await ensurePageInDesignData(projectId, existingPage._id);

                        return res.status(200).json({
                            message: 'Page updated successfully',
                            page: existingPage,
                            data: existingPage
                        });
                    } else {
                        console.log('[upsertWebsitePage] Page not found with given ID and projectId, will search by name');
                    }
                } catch (err) {
                    // pageId is not a valid ObjectId, continue with name lookup
                    console.log('[upsertWebsitePage] Invalid pageId format, will search by name');
                }
            }

            // For new pages, name is required
            if (!name || !displayName) {
                console.error('[upsertWebsitePage] Missing required fields:', { name, displayName });
                return res.status(400).json({ message: 'name and displayName are required' });
            }

            // Normalize name to lowercase for comparison (name is unique identifier, non-changeable)
            const normalizedName = name.toLowerCase().trim();
            console.log('[upsertWebsitePage] Normalized name:', normalizedName);

            // IMPORTANT: Check if page exists with SAME projectId + name combination
            // This ensures pages are unique per project, not globally
            let page = await WebsitePage.findOne({
                projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                name: normalizedName
            });

            if (page) {
                // Verify it's the same project (double check)
                if (page.projectId && page.projectId.toString() === projectId.toString()) {
                    console.log('[upsertWebsitePage] Page already exists for this project:', page._id);

                    // Update page if slug/displayName/description changed (name cannot change)
                    let updated = false;
                    let slugChanged = false;
                    const oldSlug = page.slug;

                    // Update slug if provided and different
                    if (slug !== undefined && slug !== null) {
                        const normalizedSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, ''); // Remove leading/trailing slashes
                        if (normalizedSlug !== page.slug) {
                            page.slug = normalizedSlug;
                            updated = true;
                            slugChanged = true;
                            console.log('[upsertWebsitePage] Slug changed from', oldSlug, 'to', normalizedSlug);
                        }
                    }

                    if (displayName && displayName.trim() !== page.displayName) {
                        page.displayName = displayName.trim();
                        updated = true;
                    }
                    if (description !== undefined && description !== page.description) {
                        page.description = description ? description.trim() : '';
                        updated = true;
                    }

                    if (updated) {
                        await page.save();
                        console.log('[upsertWebsitePage] Page updated:', page._id);

                        // If slug changed, update menu URLs in headers/footers
                        if (slugChanged && oldSlug) {
                            try {
                                // Helper function to update menu URLs
                                const updateMenuUrls = async (pageId, newSlug) => {
                                    // Recursive function to update menu items and their children
                                    const updateMenuItems = (menuItems, pageId, newSlug) => {
                                        if (!Array.isArray(menuItems)) return menuItems;

                                        return menuItems.map(item => {
                                            const updatedItem = { ...item };

                                            // If this menu item is linked to the page, update its URL
                                            if (item.pageId && item.pageId.toString() === pageId.toString()) {
                                                updatedItem.url = `/${newSlug}`;
                                                console.log(`[updateMenuUrls] Updated menu item "${item.name}" URL to /${newSlug}`);
                                            }

                                            // Recursively update children
                                            if (item.children && Array.isArray(item.children) && item.children.length > 0) {
                                                updatedItem.children = updateMenuItems(item.children, pageId, newSlug);
                                            }

                                            return updatedItem;
                                        });
                                    };

                                    // Find all headers and footers that have menu items linked to this page
                                    const headersFooters = await SiteHeaderFooter.find({
                                        $or: [
                                            { 'menu.pageId': pageId },
                                            { 'menu.children.pageId': pageId }
                                        ]
                                    });

                                    console.log(`[updateMenuUrls] Found ${headersFooters.length} headers/footers to update`);

                                    let updatedCount = 0;

                                    // Update each header/footer
                                    for (const headerFooter of headersFooters) {
                                        const updatedMenu = updateMenuItems(headerFooter.menu, pageId, newSlug);

                                        // Check if menu actually changed
                                        const menuChanged = JSON.stringify(headerFooter.menu) !== JSON.stringify(updatedMenu);

                                        if (menuChanged) {
                                            headerFooter.menu = updatedMenu;
                                            await headerFooter.save();
                                            updatedCount++;
                                            console.log(`[updateMenuUrls] Updated ${headerFooter.type === 0 ? 'header' : 'footer'} ${headerFooter._id}`);
                                        }
                                    }

                                    console.log(`[updateMenuUrls] Completed updating ${updatedCount} headers/footers`);
                                    return updatedCount;
                                };

                                await updateMenuUrls(page._id.toString(), page.slug);
                                console.log('[upsertWebsitePage] Menu URLs updated successfully');
                            } catch (menuUpdateError) {
                                console.error('[upsertWebsitePage] Error updating menu URLs:', menuUpdateError);
                                // Don't fail the request if menu update fails
                            }
                        }
                    }

                    // Ensure page exists in WebsiteDesignsData
                    await ensurePageInDesignData(projectId, page._id);

                    // Page exists, return it
                    return res.status(200).json({
                        message: 'Page already exists',
                        page: page,
                        data: page
                    });
                } else {
                    // Page exists but for different project - this shouldn't happen, but handle it
                    console.warn('[upsertWebsitePage] Page found but projectId mismatch. This may indicate a data inconsistency.');
                    // Continue to create new page for this project
                }
            }

            // Page doesn't exist for this project, create new one
            console.log('[upsertWebsitePage] Creating new page for project:', projectId);

            // Normalize slug (remove leading/trailing slashes, default to name if not provided)
            let normalizedSlug = slug ? slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '') : normalizedName;
            if (!normalizedSlug) {
                normalizedSlug = normalizedName; // Fallback to name if slug is empty
            }

            page = new WebsitePage({
                projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                name: normalizedName, // name is unique identifier, non-changeable
                slug: normalizedSlug, // slug is changeable URL path
                displayName: displayName.trim(),
                description: description ? description.trim() : ''
            });

            try {
                await page.save();
                console.log('[upsertWebsitePage] Page created successfully:', page._id);
            } catch (saveError) {
                // If save fails due to duplicate key, try to find the existing page
                if (saveError.code === 11000) {
                    console.log('[upsertWebsitePage] Duplicate key error during save, finding existing page with projectId + name...');

                    // Check if it's the old name_1 index causing the issue
                    if (saveError.keyPattern && saveError.keyPattern.name === 1 && !saveError.keyPattern.projectId) {
                        console.warn('[upsertWebsitePage] Old name_1 index detected! This index should be dropped. Run: node backend/scripts/dropWebsitePageNameIndex.js');
                        console.warn('[upsertWebsitePage] Attempting to find existing page by name only (legacy behavior)...');

                        // Try to find by name only (old index behavior)
                        const existingPageByName = await WebsitePage.findOne({ name: normalizedName });

                        if (existingPageByName) {
                            if (existingPageByName.projectId && existingPageByName.projectId.toString() === projectId.toString()) {
                                // Page exists for this project - use it
                                console.log('[upsertWebsitePage] Found existing page for this project (legacy index):', existingPageByName._id);
                                page = existingPageByName;
                            } else {
                                // Page exists for different project - this is the old index issue
                                console.error('[upsertWebsitePage] Page exists for different project due to old name_1 index. Please run migration script to fix.');
                                return res.status(409).json({
                                    message: 'A page with this name already exists for another project. This is due to a legacy database index. Please run the migration script: node backend/scripts/dropWebsitePageNameIndex.js',
                                    error: 'Legacy index conflict',
                                    suggestion: 'Run the migration script to fix this issue permanently.'
                                });
                            }
                        } else {
                            // Page not found - this shouldn't happen, but handle it
                            throw saveError;
                        }
                    } else {
                        // It's the compound index - find by projectId + name
                        const existingPage = await WebsitePage.findOne({
                            projectId: mongoose.Types.ObjectId.isValid(projectId) ? new mongoose.Types.ObjectId(projectId) : projectId,
                            name: normalizedName
                        });

                        if (existingPage && existingPage.projectId.toString() === projectId.toString()) {
                            // Page was created between our check and save - use the existing one
                            console.log('[upsertWebsitePage] Found existing page created concurrently:', existingPage._id);
                            page = existingPage;
                        } else {
                            // This is a real duplicate from another project or index issue - rethrow
                            throw saveError;
                        }
                    }
                } else {
                    throw saveError;
                }
            }

            // Add page to WebsiteDesignsData (for both new and existing pages)
            await ensurePageInDesignData(projectId, page._id);

            return res.status(201).json({
                message: 'Page created successfully',
                page: page,
                data: page
            });
        } catch (error) {
            console.error('Error upserting Website Page:', error);
            if (error.code === 11000) {
                // Duplicate key error - page was created between check and save, or old index conflict
                const normalizedName = (req.body.name || '').toLowerCase().trim();
                const projectId = req.body.projectId || req.query.projectId || req.params.projectId;

                console.log('[upsertWebsitePage] Duplicate key error detected, searching for existing page...');

                if (projectId && normalizedName) {
                    // First, try to find by projectId + name (correct way)
                    let existingPage = await WebsitePage.findOne({
                        projectId: projectId,
                        name: normalizedName
                    });

                    // If not found, try to find by name only (in case of old data or index conflict)
                    if (!existingPage) {
                        console.log('[upsertWebsitePage] Page not found with projectId, searching by name only...');
                        existingPage = await WebsitePage.findOne({
                            name: normalizedName
                        });

                        // If found but belongs to different project, this is due to old index
                        if (existingPage && existingPage.projectId && existingPage.projectId.toString() !== projectId.toString()) {
                            console.log('[upsertWebsitePage] Found page for different project due to old index. Skipping creation.');
                            // Skip this page - it belongs to another project
                            // Return a response indicating the page was skipped
                            return res.status(200).json({
                                message: 'Page with this name already exists for another project. Skipping creation.',
                                page: existingPage,
                                data: existingPage,
                                skipped: true,
                                warning: 'This page belongs to a different project due to legacy database constraints. Please use a different page name.'
                            });
                        }
                    }

                    if (existingPage) {
                        // Check if page belongs to this project
                        const belongsToThisProject = existingPage.projectId && existingPage.projectId.toString() === projectId.toString();

                        if (belongsToThisProject) {
                            // Ensure page exists in WebsiteDesignsData for this project
                            await ensurePageInDesignData(projectId, existingPage._id);

                            // Update page if displayName/description changed
                            let updated = false;
                            if (displayName && displayName.trim() !== existingPage.displayName) {
                                existingPage.displayName = displayName.trim();
                                updated = true;
                            }
                            if (description !== undefined && description !== existingPage.description) {
                                existingPage.description = description ? description.trim() : '';
                                updated = true;
                            }
                            if (updated) {
                                await existingPage.save();
                                console.log('[upsertWebsitePage] Updated existing page:', existingPage._id);
                            }

                            return res.status(200).json({
                                message: 'Page already exists',
                                page: existingPage,
                                data: existingPage
                            });
                        } else {
                            // Page exists but for different project - skip it
                            console.log('[upsertWebsitePage] Page exists for different project, skipping.');
                            return res.status(200).json({
                                message: 'Page with this name already exists for another project. Skipping creation.',
                                page: existingPage,
                                data: existingPage,
                                skipped: true
                            });
                        }
                    }
                }

                // If we can't find the page, it's a real duplicate key error
                console.error('[upsertWebsitePage] Duplicate key error but page not found. This may indicate a database index issue.');
                return res.status(409).json({
                    message: 'A page with this name already exists. Please use a different name.',
                    error: 'Duplicate key error',
                    suggestion: 'This may be due to a legacy database index. Please try a different page name or contact support.'
                });
            }
            return res.status(500).json({ message: 'Server error while upserting Website Page', error: error.message });
        }
    },

    // Bulk upsert and sync pages for a project
    // Accepts array of pages and optionally deletes pages not in the list
    bulkUpsertWebsitePages: async (req, res) => {
        try {
            console.log('[bulkUpsertWebsitePages] Request received:', req.body);
            const { projectId, pages, deleteMissing = false } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            if (!Array.isArray(pages)) {
                return res.status(400).json({ message: 'pages must be an array' });
            }

            // Validate projectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // Verify project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            const results = {
                created: [],
                updated: [],
                errors: [],
                deleted: []
            };

            // Step 1: Upsert all pages in the array
            const pageNames = new Set();
            for (const pageData of pages) {
                const { name, slug, displayName, description, componentIds } = pageData;

                if (!name || !displayName) {
                    results.errors.push({
                        page: name || 'unknown',
                        error: 'name and displayName are required'
                    });
                    continue;
                }

                const normalizedName = name.toLowerCase().trim();
                pageNames.add(normalizedName);

                try {
                    // Process componentIds: ensure components exist and prepare for saving
                    const processedComponentIds = [];
                    if (componentIds && Array.isArray(componentIds) && componentIds.length > 0) {
                        for (const compData of componentIds) {
                            try {
                                let componentName = null;
                                let uniqueId = null;
                                let variant = 'a'; // Default to variant "a"

                                // Handle different input formats
                                if (typeof compData === 'string') {
                                    // If it's a string like "hero" or "hero_a"
                                    if (compData.includes('_')) {
                                        uniqueId = compData.toLowerCase().trim().replace(/-/g, '_');
                                        const parts = uniqueId.split('_');
                                        componentName = parts[0];
                                        variant = parts.slice(1).join('_') || 'a';
                                    } else {
                                        componentName = compData.toLowerCase().trim().replace(/-/g, '_');
                                        uniqueId = `${componentName}_a`;
                                    }
                                } else if (compData && compData.componentName) {
                                    // Object with componentName
                                    componentName = compData.componentName.toLowerCase().trim().replace(/-/g, '_');
                                    variant = compData.variant ? compData.variant.toLowerCase().trim() : 'a';
                                    uniqueId = compData.uniqueId ? compData.uniqueId.toLowerCase().trim().replace(/-/g, '_') : `${componentName}_${variant}`;
                                } else if (compData && compData.uniqueId) {
                                    // Object with uniqueId
                                    uniqueId = compData.uniqueId.toLowerCase().trim().replace(/-/g, '_');
                                    const parts = uniqueId.split('_');
                                    componentName = parts[0];
                                    variant = parts.slice(1).join('_') || 'a';
                                } else if (compData && compData.id) {
                                    // Section ID format (e.g., from frontend)
                                    const sectionId = compData.id.toLowerCase().trim();
                                    // Map section IDs to component names
                                    const sectionToComponentMap = {
                                        'hero': 'hero',
                                        'features': 'features',
                                        'testimonials': 'testimonial',
                                        'testimonial': 'testimonial',
                                        'faq': 'faq',
                                        'process': 'process',
                                        'services': 'services',
                                        'cta': 'cta',
                                        'stats': 'stats',
                                        'partners': 'partners',
                                        'benefits': 'benefits',
                                        'video': 'video',
                                        'pricing-preview': 'pricing',
                                        'newsletter': 'newsletter',
                                        'social-proof': 'socialproof',
                                        'awards': 'awards',
                                        'case-studies': 'casestudies',
                                        'blog-preview': 'blog',
                                        'location-map': 'locationmap',
                                        'contact-info': 'contactinfosection',
                                        'footer-cta': 'footerctasection',
                                    };
                                    componentName = (sectionToComponentMap[sectionId] || sectionId).replace(/-/g, '_');
                                    uniqueId = `${componentName}_a`;
                                    variant = 'a';
                                }

                                if (!componentName) {
                                    console.warn(`[bulkUpsertWebsitePages] Could not determine component name from:`, compData);
                                    continue;
                                }

                                // Ensure component exists in WebsiteComponent (create if not exists)
                                const component = await ensureComponentExists(componentName, uniqueId);

                                // Add to processedComponentIds - save full uniqueId in componentVariant
                                processedComponentIds.push({
                                    componentId: component._id,
                                    componentVariant: uniqueId // Save full uniqueId (e.g., "hero_a") instead of just variant letter
                                });

                            } catch (compError) {
                                console.error(`[bulkUpsertWebsitePages] Error processing component:`, compError);
                                // Continue with other components
                            }
                        }
                    }

                    // Find existing page by projectId + name
                    let page = await WebsitePage.findOne({
                        projectId: projectId,
                        name: normalizedName
                    });

                    if (page) {
                        // Update existing page
                        let updated = false;
                        if (slug !== undefined && slug !== null) {
                            const normalizedSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '');
                            if (normalizedSlug !== page.slug) {
                                page.slug = normalizedSlug;
                                updated = true;
                            }
                        }
                        if (displayName && displayName.trim() !== page.displayName) {
                            page.displayName = displayName.trim();
                            updated = true;
                        }
                        if (description !== undefined && description !== page.description) {
                            page.description = description ? description.trim() : '';
                            updated = true;
                        }

                        // Update componentIds if provided
                        if (componentIds && Array.isArray(componentIds) && componentIds.length > 0) {
                            page.componentIds = processedComponentIds;
                            updated = true;
                        }

                        if (updated) {
                            await page.save();
                        }

                        // Ensure page exists in WebsiteDesignsData
                        await ensurePageInDesignData(projectId, page._id);

                        results.updated.push({
                            name: normalizedName,
                            pageId: page._id,
                            page: page
                        });
                    } else {
                        // Create new page
                        const normalizedSlug = slug ? slug.trim().toLowerCase().replace(/^\/+|\/+$/g, '') : normalizedName;
                        page = new WebsitePage({
                            projectId: projectId,
                            name: normalizedName,
                            slug: normalizedSlug || normalizedName,
                            displayName: displayName.trim(),
                            description: description ? description.trim() : '',
                            componentIds: processedComponentIds // Save componentIds
                        });

                        try {
                            await page.save();
                            await ensurePageInDesignData(projectId, page._id);
                            results.created.push({
                                name: normalizedName,
                                pageId: page._id,
                                page: page
                            });
                        } catch (saveError) {
                            if (saveError.code === 11000) {
                                // Duplicate key - page was created concurrently, find and use it
                                const existingPage = await WebsitePage.findOne({
                                    projectId: projectId,
                                    name: normalizedName
                                });
                                if (existingPage) {
                                    // Update componentIds if provided
                                    if (componentIds && Array.isArray(componentIds) && componentIds.length > 0) {
                                        existingPage.componentIds = processedComponentIds;
                                        await existingPage.save();
                                    }
                                    await ensurePageInDesignData(projectId, existingPage._id);
                                    results.updated.push({
                                        name: normalizedName,
                                        pageId: existingPage._id,
                                        page: existingPage
                                    });
                                } else {
                                    results.errors.push({
                                        page: normalizedName,
                                        error: 'Duplicate key error but page not found'
                                    });
                                }
                            } else {
                                throw saveError;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`[bulkUpsertWebsitePages] Error processing page ${normalizedName}:`, error);
                    results.errors.push({
                        page: normalizedName,
                        error: error.message
                    });
                }
            }

            // Step 2: Delete pages not in the list (if deleteMissing is true)
            if (deleteMissing) {
                try {
                    // Get all pages for this project
                    const allProjectPages = await WebsitePage.find({ projectId: projectId });

                    // Find pages to delete (pages not in the provided list)
                    const pagesToDelete = allProjectPages.filter(page => {
                        const pageName = page.name.toLowerCase().trim();
                        return !pageNames.has(pageName);
                    });

                    if (pagesToDelete.length > 0) {
                        const pageIdsToDelete = pagesToDelete.map(p => p._id);

                        // Delete from WebsitePage
                        const deleteResult = await WebsitePage.deleteMany({
                            _id: { $in: pageIdsToDelete },
                            projectId: projectId
                        });

                        // Also remove from WebsiteDesignsData
                        const designData = await WebsiteDesignsData.findOne({ projectId: projectId });
                        if (designData) {
                            designData.pages = designData.pages.filter(p => {
                                const pageId = p.pageId?._id || p.pageId;
                                return !pageIdsToDelete.some(id => id.toString() === pageId.toString());
                            });
                            await designData.save();
                        }

                        results.deleted = pagesToDelete.map(p => ({
                            name: p.name,
                            pageId: p._id
                        }));

                        console.log(`[bulkUpsertWebsitePages] Deleted ${deleteResult.deletedCount} pages`);
                    }
                } catch (deleteError) {
                    console.error('[bulkUpsertWebsitePages] Error deleting missing pages:', deleteError);
                    results.errors.push({
                        operation: 'deleteMissing',
                        error: deleteError.message
                    });
                }
            }

            return res.status(200).json({
                message: 'Bulk upsert completed',
                results: {
                    created: results.created.length,
                    updated: results.updated.length,
                    deleted: results.deleted.length,
                    errors: results.errors.length
                },
                data: results
            });
        } catch (error) {
            console.error('[bulkUpsertWebsitePages] Error:', error);
            return res.status(500).json({
                message: 'Server error while bulk upserting pages',
                error: error.message
            });
        }
    },


    // Upsert Website Component - if name exists, return existing, else create
    upsertWebsiteComponent: async (req, res) => {
        try {
            console.log('[upsertWebsiteComponent] Request received:', req.body);

            // If request body is empty or has a special flag, register default components
            if (!req.body || (typeof req.body === 'object' && Object.keys(req.body).length === 0) || req.body.registerDefaults === true) {
                console.log('[upsertWebsiteComponent] Registering default homepage components...');

                // Default homepage components to register
                // Only register required components: hero_a/b/c, services_a, cta_a/b/c/d
                const defaultComponents = [
                    // Hero variants
                    {
                        name: "hero",
                        uniqueId: "hero_a",
                        variant: "a"
                    },
                    {
                        name: "hero",
                        uniqueId: "hero_b",
                        variant: "b"
                    },
                    {
                        name: "hero",
                        uniqueId: "hero_c",
                        variant: "c"
                    },
                    // Services
                    {
                        name: "services",
                        uniqueId: "services_a",
                        variant: "a"
                    },
                    // CTA variants
                    {
                        name: "cta",
                        uniqueId: "cta_a",
                        variant: "a"
                    },
                    {
                        name: "cta",
                        uniqueId: "cta_b",
                        variant: "b"
                    },
                    {
                        name: "cta",
                        uniqueId: "cta_c",
                        variant: "c"
                    },
                    {
                        name: "cta",
                        uniqueId: "cta_d",
                        variant: "d"
                    }
                ];

                const defaultResults = [];

                for (const componentData of defaultComponents) {
                    const { name, uniqueId, variant } = componentData;

                    // Normalize
                    const normalizedName = name.toLowerCase().trim();
                    const normalizedUniqueId = uniqueId.toLowerCase().trim();
                    const normalizedVariant = variant.toLowerCase().trim();

                    // Check if component already exists
                    let component = await WebsiteComponent.findOne({ uniqueId: normalizedUniqueId });

                    if (component) {
                        console.log(`[upsertWebsiteComponent] Component ${normalizedUniqueId} already exists`);
                        defaultResults.push({
                            message: 'Component already exists',
                            data: component
                        });
                        continue;
                    }

                    // Create new component
                    component = new WebsiteComponent({
                        name: normalizedName,
                        variant: normalizedVariant,
                        uniqueId: normalizedUniqueId
                    });

                    await component.save();
                    console.log(`[upsertWebsiteComponent] Component ${normalizedUniqueId} created successfully`);

                    defaultResults.push({
                        message: 'Component created successfully',
                        data: component
                    });
                }

                return res.status(201).json({
                    message: 'Default homepage components registered successfully',
                    data: defaultResults,
                    summary: {
                        total: defaultResults.length,
                        created: defaultResults.filter(r => r.message === 'Component created successfully').length,
                        existing: defaultResults.filter(r => r.message === 'Component already exists').length
                    }
                });
            }

            // Support both single component and array of components
            const componentsToProcess = Array.isArray(req.body) ? req.body : [req.body];
            const results = [];

            for (const componentData of componentsToProcess) {
                const { name, variant, uniqueId, pageId } = componentData;

                // Validate required fields
                if (!name) {
                    console.error('[upsertWebsiteComponent] Missing required field: name');
                    results.push({
                        error: 'name is required',
                        data: null
                    });
                    continue;
                }

                // Normalize name
                const normalizedName = name.toLowerCase().trim();

                // Determine variant (default to 'a' if not provided)
                let finalVariant = 'a';
                if (variant) {
                    finalVariant = variant.toLowerCase().trim();
                } else {
                    // Find existing variants for this name (NO pageId - websitecomponents is global)
                    const query = { name: normalizedName };

                    const existingVariants = await WebsiteComponent.find(query).sort({ variant: 1 });

                    if (existingVariants.length > 0) {
                        // Get the last variant and increment
                        const lastVariant = existingVariants[existingVariants.length - 1].variant;
                        const lastVariantCode = lastVariant.charCodeAt(0);
                        if (lastVariantCode >= 97 && lastVariantCode < 122) { // a-z
                            finalVariant = String.fromCharCode(lastVariantCode + 1);
                        } else {
                            // If z is reached, start with aa, ab, etc.
                            finalVariant = 'a' + String.fromCharCode(97 + (existingVariants.length % 26));
                        }
                    }
                }

                // Generate uniqueId: {name}_{variant} e.g., "hero_a", "services_b"
                const generatedUniqueId = `${normalizedName}_${finalVariant}`;
                const finalUniqueId = (uniqueId || generatedUniqueId).toLowerCase().trim();

                console.log('[upsertWebsiteComponent] Processing component:', {
                    name: normalizedName,
                    variant: finalVariant,
                    uniqueId: finalUniqueId,
                    pageId: pageId || 'none'
                });

                // Check if component exists by uniqueId (websitecomponents is global, no pageId)
                const component = await WebsiteComponent.findOne({ uniqueId: finalUniqueId });

                if (component) {
                    console.log('[upsertWebsiteComponent] Component already exists (by uniqueId):', component._id);
                    results.push({
                        message: 'Component already exists',
                        component: component,
                        data: component
                    });
                    continue;
                }

                // Component doesn't exist, create new one
                console.log('[upsertWebsiteComponent] Creating new component (global registry, no pageId)');
                const componentDataToSave = {
                    name: normalizedName,
                    variant: finalVariant,
                    uniqueId: finalUniqueId
                    // NO pageId - websitecomponents is global registry only
                };

                component = new WebsiteComponent(componentDataToSave);

                await component.save();
                console.log('[upsertWebsiteComponent] Component created successfully:', component._id);

                results.push({
                    message: 'Component created successfully',
                    component: component,
                    data: component
                });
            }

            // Return results
            const successCount = results.filter(r => r.data && !r.error).length;
            const errorCount = results.filter(r => r.error).length;

            return res.status(successCount > 0 ? 201 : 400).json({
                message: `Processed ${componentsToProcess.length} component(s): ${successCount} created, ${errorCount} errors`,
                data: results,
                summary: {
                    total: componentsToProcess.length,
                    created: successCount,
                    errors: errorCount,
                    existing: results.filter(r => r.data && r.message === 'Component already exists').length
                }
            });
        } catch (error) {
            console.error('Error upserting Website Component:', error);
            if (error.code === 11000) {
                // Duplicate key error - component was created between check and save
                return res.status(200).json({
                    message: 'Component already exists (duplicate key)',
                    data: null
                });
            }
            return res.status(500).json({ message: 'Server error while upserting Website Component', error: error.message });
        }
    },

    // Get all variants for a component name
    getComponentVariants: async (req, res) => {
        try {
            const { name } = req.query;

            if (!name) {
                return res.status(400).json({ message: 'Component name is required' });
            }

            const normalizedName = name.toLowerCase().trim();
            const variants = await WebsiteComponent.find({ name: normalizedName }).sort({ variant: 1 });

            return res.status(200).json({
                message: 'Component variants retrieved successfully',
                data: variants
            });
        } catch (error) {
            console.error('Error getting component variants:', error);
            return res.status(500).json({ message: 'Server error while getting component variants' });
        }
    },

    // Generate theme by picking random variants for components
    generateTheme: async (req, res) => {
        try {
            const { projectId, componentNames } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            if (!Array.isArray(componentNames) || componentNames.length === 0) {
                return res.status(400).json({ message: 'componentNames array is required' });
            }

            // Get all variants for each component and pick random one
            const selectedComponents = [];

            for (const componentName of componentNames) {
                const normalizedName = componentName.toLowerCase().trim();

                // Find component by name (new structure with variants array)
                const component = await WebsiteComponent.findOne({ name: normalizedName });

                if (!component) {
                    console.warn(`[generateTheme] No component found: ${componentName}`);
                    continue;
                }

                // Get enabled variants from variants array
                const enabledVariants = (component.variants || []).filter(v => v.status === 1);

                if (enabledVariants.length === 0) {
                    console.warn(`[generateTheme] No enabled variants for component: ${componentName}`);
                    // Fallback to legacy uniqueId if variants array is empty
                    if (component.uniqueId) {
                        const parts = component.uniqueId.split('_');
                        selectedComponents.push({
                            componentName: normalizedName,
                            componentId: component._id,
                            variant: parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'A',
                            uniqueId: component.uniqueId
                        });
                    }
                    continue;
                }

                // Pick random enabled variant
                const randomIndex = Math.floor(Math.random() * enabledVariants.length);
                const selectedVariant = enabledVariants[randomIndex];

                // Extract variant letter from uniqueId (e.g., "hero_a" -> "A")
                const variantLetter = selectedVariant.uniqueId.split('_').pop()?.toUpperCase() || 'A';

                selectedComponents.push({
                    componentName: normalizedName,
                    componentId: component._id, // Keep for backward compatibility
                    variant: variantLetter,
                    uniqueId: selectedVariant.uniqueId // Primary field - use this!
                });
            }

            return res.status(200).json({
                message: 'Theme generated successfully',
                data: selectedComponents
            });
        } catch (error) {
            console.error('Error generating theme:', error);
            return res.status(500).json({ message: 'Server error while generating theme' });
        }
    },

    // Save Website Design Data
    saveWebsiteDesignData: async (req, res) => {
        try {
            console.log('[saveWebsiteDesignData] Request received:', {
                projectId: req.body.projectId,
                colorScheme: req.body.colorScheme,
                pagesCount: req.body.pages?.length || 0
            });

            const {
                projectId,
                colorScheme,
                colorPrimary,
                colorSecondary,
                colorAccent,
                pageStyles,  // Default styles for whole website
                pages        // Pages array (replaces selectPages)
            } = req.body;

            if (!projectId) {
                console.error('[saveWebsiteDesignData] projectId is missing');
                return res.status(400).json({ message: 'projectId is required' });
            }

            // colorScheme is now optional - theme data is stored in ThemeSetting table
            // Keep for backward compatibility but don't require it
            if (!colorScheme) {
                console.log('[saveWebsiteDesignData] colorScheme not provided - theme is stored in ThemeSetting table');
            }

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[saveWebsiteDesignData] Project not found:', projectId);
                return res.status(404).json({ message: 'Project not found' });
            }

            console.log('[saveWebsiteDesignData] Project found:', {
                projectId: project._id,
                projectName: project.projectName,
                userId: project.userId
            });

            const userId = project.userId || req.user?.userId;

            if (!userId) {
                console.error('[saveWebsiteDesignData] userId is missing from both project and request');
                return res.status(400).json({ message: 'userId is required' });
            }

            console.log('[saveWebsiteDesignData] Using userId:', userId);

            // Process pageStyles (default styles for whole website) - just a single object with style key
            const processedPageStyles = pageStyles && typeof pageStyles === 'object' && !Array.isArray(pageStyles)
                ? { style: pageStyles.style || {} }
                : { style: {} };

            console.log('[saveWebsiteDesignData] Processing pageStyles (default website styles)');

            // Validate pages structure
            if (pages && !Array.isArray(pages)) {
                console.error('[saveWebsiteDesignData] pages is not an array:', typeof pages);
                return res.status(400).json({ message: 'pages must be an array' });
            }

            console.log('[saveWebsiteDesignData] Processing pages:', pages?.length || 0);

            // Process pages array with pageId, style, componentIds (with style and elementIds with style and data)
            // Note: Using Promise.all because we need async operations inside the map (for component lookups)
            const processedPagesPromises = (pages || []).map(async (pageData, index) => {
                try {
                    const pageId = typeof pageData.pageId === 'string'
                        ? new mongoose.Types.ObjectId(pageData.pageId)
                        : pageData.pageId;

                    // Main style of this whole page
                    const pageStyle = pageData.style || {};

                    // Process components with their styles and elements
                    // Note: Using Promise.all because we need async operations inside the map
                    const processedComponentsPromises = (pageData.componentIds || []).map(async (compData) => {
                        try {
                            // GENIEBUILD FORMAT: variant_uniqueId, componentId, sectionData
                            // OLD FORMAT: uniqueId or componentId (backward compatibility)
                            let uniqueId = null;
                            let componentId = null;
                            let sectionData = null; // GenieBuild section data

                            if (typeof compData === 'string') {
                                // Old format - just componentId string (backward compatibility)
                                try {
                                    componentId = new mongoose.Types.ObjectId(compData);
                                    // Try to get uniqueId from component
                                    // This will be handled later if needed
                                } catch (err) {
                                    // Maybe it's a uniqueId string?
                                    if (compData.includes('_')) {
                                        uniqueId = compData.toLowerCase();
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid componentId string format: ${compData}`, err);
                                        return null;
                                    }
                                }
                            } else if (compData && compData.variant_uniqueId) {
                                // GENIEBUILD FORMAT: variant_uniqueId, componentId, sectionData
                                uniqueId = compData.variant_uniqueId.toLowerCase().trim();
                                sectionData = compData.sectionData || null;
                                
                                if (compData.componentId) {
                                    const compIdValue = compData.componentId;
                                    if (typeof compIdValue === 'string' && mongoose.Types.ObjectId.isValid(compIdValue)) {
                                        componentId = new mongoose.Types.ObjectId(compIdValue);
                                    } else if (compIdValue && typeof compIdValue === 'object' && compIdValue._id) {
                                        componentId = compIdValue._id;
                                    }
                                }
                            } else if (compData && (compData.uniqueId || compData.componentId)) {
                                // Old format - prioritize uniqueId
                                if (compData.uniqueId) {
                                    uniqueId = compData.uniqueId.toLowerCase().trim();
                                }

                                if (compData.componentId) {
                                    // New format - object with componentId
                                    const compIdValue = compData.componentId;

                                    // Log for debugging
                                    console.log(`[saveWebsiteDesignData] Processing componentId:`, {
                                        type: typeof compIdValue,
                                        value: compIdValue,
                                        isObject: typeof compIdValue === 'object',
                                        isString: typeof compIdValue === 'string',
                                        keys: typeof compIdValue === 'object' ? Object.keys(compIdValue) : null
                                    });

                                    // Ensure it's a string before converting to ObjectId
                                    if (typeof compIdValue === 'string') {
                                        try {
                                            // Validate it's a valid ObjectId string format
                                            if (!mongoose.Types.ObjectId.isValid(compIdValue)) {
                                                console.error(`[saveWebsiteDesignData] Invalid ObjectId format: ${compIdValue}`);
                                                return null;
                                            }
                                            componentId = new mongoose.Types.ObjectId(compIdValue);
                                        } catch (err) {
                                            console.error(`[saveWebsiteDesignData] Error creating ObjectId from string: ${compIdValue}`, err);
                                            return null;
                                        }
                                    } else if (compIdValue && typeof compIdValue === 'object') {
                                        // If it's an object, it's invalid - componentId should be a string
                                        // This happens when the entire componentIdsMap[page.id] is passed instead of individual componentId
                                        console.error(`[saveWebsiteDesignData] ERROR: componentId is an object (should be string)!`, {
                                            compIdValue,
                                            keys: Object.keys(compIdValue),
                                            compData
                                        });
                                        return null;
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid componentId type: ${typeof compIdValue}. Value:`, compIdValue);
                                        return null;
                                    }
                                }
                            } else {
                                console.error(`[saveWebsiteDesignData] Invalid compData format:`, compData);
                                return null;
                            }

                            // Validate: must have either uniqueId or componentId
                            if (!uniqueId && !componentId) {
                                console.error(`[saveWebsiteDesignData] Missing both uniqueId and componentId in pageData at index ${index}:`, compData);
                                return null;
                            }

                            // If we have uniqueId but no componentId, try to find component by uniqueId (optional - for backward compatibility)
                            // Note: componentId is deprecated, we only need uniqueId now
                            if (uniqueId && !componentId) {
                                try {
                                    // Try to find component by uniqueId in variants array
                                    const component = await WebsiteComponent.findOne({
                                        'variants.uniqueId': uniqueId
                                    });
                                    if (component) {
                                        componentId = component._id; // Keep for backward compatibility only
                                    } else {
                                        // Fallback: try legacy uniqueId field
                                        const legacyComponent = await WebsiteComponent.findOne({ uniqueId: uniqueId });
                                        if (legacyComponent) {
                                            componentId = legacyComponent._id; // Keep for backward compatibility only
                                        }
                                    }
                                } catch (err) {
                                    // Not an error - componentId is optional now, we only need uniqueId
                                    console.log(`[saveWebsiteDesignData] No component found for uniqueId: ${uniqueId} (this is OK - components are only created via registry refresh)`);
                                }
                            }

                            // If we have componentId but no uniqueId, try to get uniqueId from component (for backward compatibility)
                            if (componentId && !uniqueId) {
                                try {
                                    const component = await WebsiteComponent.findById(componentId);
                                    if (component) {
                                        // Try to get from variants array (new structure)
                                        if (component.variants && component.variants.length > 0) {
                                            // Use first enabled variant or first variant
                                            const variant = component.variants.find(v => v.status === 1) || component.variants[0];
                                            uniqueId = variant?.uniqueId;
                                        }
                                        // Fallback to legacy uniqueId field
                                        if (!uniqueId && component.uniqueId) {
                                            uniqueId = component.uniqueId;
                                        }
                                    }
                                } catch (err) {
                                    console.warn(`[saveWebsiteDesignData] Could not get uniqueId for componentId: ${componentId}`, err);
                                }
                            }

                            // Ensure we have uniqueId (required field)
                            if (!uniqueId) {
                                console.error(`[saveWebsiteDesignData] Missing uniqueId for component. componentId: ${componentId}, compData:`, compData);
                                // Try to generate from componentName if available
                                if (compData.componentName) {
                                    uniqueId = `${compData.componentName.toLowerCase()}_a`; // Default to variant 'a'
                                    console.log(`[saveWebsiteDesignData] Generated uniqueId from componentName: ${uniqueId}`);
                                } else {
                                    console.error(`[saveWebsiteDesignData] Cannot generate uniqueId - missing both uniqueId and componentName`);
                                    return null;
                                }
                            }

                            // Component style (from sectionData.styles for GenieBuild, or compData.style for old format)
                            const componentStyle = sectionData?.styles || compData.style || {};

                            // Process elementIds array (each element has elementId, style, and data)
                            // For GenieBuild, elementIds come from sectionData.elements if available
                            const elementIdsSource = sectionData?.elements || compData.elementIds || [];
                            const processedElements = elementIdsSource.map((elementData) => {
                                try {
                                    // Handle both old format (just elementId string) and new format (object with elementId, style, data)
                                    if (typeof elementData === 'string') {
                                        // Old format - just elementId
                                        return {
                                            elementId: elementData,
                                            style: {},
                                            data: {}
                                        };
                                    } else if (elementData && elementData.elementId) {
                                        // New format - object with elementId, style, data, elementType, order, parentElId
                                        return {
                                            elementId: elementData.elementId,
                                            elementType: elementData.elementType || 'text',
                                            style: elementData.style || {},
                                            data: elementData.data || {},
                                            order: elementData.order !== undefined ? elementData.order : 0,
                                            parentElId: elementData.parentElId || null
                                        };
                                    } else {
                                        console.error(`[saveWebsiteDesignData] Invalid elementData:`, elementData);
                                        return null;
                                    }
                                } catch (err) {
                                    console.error(`[saveWebsiteDesignData] Error processing element:`, err);
                                    return null;
                                }
                            }).filter(el => el !== null);

                            // Build the component object
                            const componentObj = {
                                variant_uniqueId: compData.variant_uniqueId || uniqueId, // GenieBuild format
                                uniqueId: uniqueId, // Required field (lowercase)
                                componentId: componentId, // Keep for backward compatibility (deprecated)
                                style: componentStyle,
                                elementIds: processedElements
                            };

                            // Add sectionData for GenieBuild format (single source of truth)
                            if (sectionData) {
                                componentObj.sectionData = sectionData;
                            }

                            return componentObj;
                        } catch (err) {
                            console.error(`[saveWebsiteDesignData] Error processing component:`, err);
                            return null;
                        }
                    });

                    // Wait for all promises to resolve
                    const processedComponents = await Promise.all(processedComponentsPromises);

                    return {
                        pageId,
                        style: pageStyle,
                        componentIds: processedComponents.filter(comp => comp !== null)
                    };
                } catch (err) {
                    console.error(`[saveWebsiteDesignData] Error processing pageData at index ${index}:`, err);
                    return null;
                }
            });

            // Wait for all page processing promises to resolve
            const processedPages = (await Promise.all(processedPagesPromises)).filter(page => page !== null);

            console.log('[saveWebsiteDesignData] Processed pages:', processedPages.length);
            console.log('[saveWebsiteDesignData] Processed pageStyles (default website styles)');

            // Check if design data already exists for this project
            let designData = await WebsiteDesignsData.findOne({ projectId });

            if (designData) {
                console.log('[saveWebsiteDesignData] Updating existing design data');
                // Update existing design data
                // Theme colors are now in ThemeSetting table, but keep these for backward compatibility
                designData.colorScheme = colorScheme || 'default';
                designData.colorPrimary = colorPrimary || '';
                designData.colorSecondary = colorSecondary || '';
                designData.colorAccent = colorAccent || '';
                designData.pageStyles = processedPageStyles;
                designData.pages = processedPages;
                await designData.save();
                console.log('[saveWebsiteDesignData] Design data updated successfully');
            } else {
                console.log('[saveWebsiteDesignData] Creating new design data');
                // Create new design data
                // Theme colors are now in ThemeSetting table, but keep these for backward compatibility
                designData = new WebsiteDesignsData({
                    projectId: new mongoose.Types.ObjectId(projectId),
                    userId: new mongoose.Types.ObjectId(userId),
                    colorScheme: colorScheme || 'default',
                    colorPrimary: colorPrimary || '',
                    colorSecondary: colorSecondary || '',
                    colorAccent: colorAccent || '',
                    pageStyles: processedPageStyles,
                    pages: processedPages
                });
                await designData.save();
                console.log('[saveWebsiteDesignData] Design data created successfully:', designData._id);
            }

            return res.status(200).json({
                message: 'Website design data saved successfully',
                data: designData
            });
        } catch (error) {
            console.error('Error saving Website Design Data:', error);
            return res.status(500).json({ message: 'Server error while saving Website Design Data' });
        }
    },

    // Update Website Design Data (similar to saveWebsiteDesignData but ensures pages/components exist)
    updateWebsiteDesignData: async (req, res) => {
        try {
            console.log('[updateWebsiteDesignData] Request received:', {
                projectId: req.body.projectId,
                pageId: req.body.pageId,
                componentIdsCount: req.body.componentIds?.length || 0
            });

            const { projectId, pageId, componentIds, layout } = req.body;

            if (!projectId) {
                console.error('[updateWebsiteDesignData] projectId is missing');
                return res.status(400).json({ success: false, message: 'projectId is required' });
            }

            if (!pageId) {
                console.error('[updateWebsiteDesignData] pageId is missing');
                return res.status(400).json({ success: false, message: 'pageId is required' });
            }

            // Ensure the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                console.error('[updateWebsiteDesignData] Project not found:', projectId);
                return res.status(404).json({ success: false, message: 'Project not found' });
            }

            // Find or create the page (project-specific)
            let page;
            let finalPageId;
            try {
                // Try to find page by ID and projectId (project-specific)
                if (mongoose.Types.ObjectId.isValid(pageId)) {
                    page = await WebsitePage.findOne({
                        _id: pageId,
                        projectId: projectId
                    });
                }

                if (!page) {
                    console.log('[updateWebsiteDesignData] Page not found, will try to find by name or create');
                    // Try to find by name and projectId if pageId looks like a name
                    const pageName = typeof pageId === 'string' && !mongoose.Types.ObjectId.isValid(pageId)
                        ? pageId.toLowerCase().trim()
                        : null;

                    if (pageName) {
                        page = await WebsitePage.findOne({
                            projectId: projectId,
                            name: pageName
                        });
                    }

                    if (!page) {
                        // Page doesn't exist, create it with a default name (project-specific)
                        const defaultName = pageName || `page-${Date.now()}`;
                        page = new WebsitePage({
                            projectId: projectId,
                            name: defaultName,
                            displayName: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
                            description: ''
                        });
                        await page.save();
                        console.log('[updateWebsiteDesignData] Page created:', page._id);
                    } else {
                        console.log('[updateWebsiteDesignData] Page found by name:', page._id);
                    }
                } else {
                    console.log('[updateWebsiteDesignData] Page found by ID:', page._id);
                }

                finalPageId = page._id;
            } catch (err) {
                console.error('[updateWebsiteDesignData] Error finding/creating page:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error finding or creating page',
                    error: err.message
                });
            }

            // Process componentIds - ensure each component exists
            const processedComponentIds = [];
            for (const compData of componentIds || []) {
                try {
                    let componentId = compData.componentId?._id || compData.componentId;

                    // If componentId is provided, verify it exists
                    if (componentId) {
                        let component;
                        if (mongoose.Types.ObjectId.isValid(componentId)) {
                            component = await WebsiteComponent.findById(componentId);
                        }

                        if (!component) {
                            console.log(`[updateWebsiteDesignData] Component ${componentId} not found`);
                            // Component doesn't exist - skip it (frontend should create it first via upsertWebsiteComponent)
                            console.warn(`[updateWebsiteDesignData] Component ${componentId} not found, skipping. Frontend should create it first.`);
                            continue;
                        }

                        processedComponentIds.push({
                            componentId: component._id,
                            variant: compData.variant || component.variant || 'A',
                            style: compData.style || {},
                            elementIds: compData.elementIds || []
                        });
                    } else {
                        // No componentId provided - component should be created by frontend first
                        console.warn('[updateWebsiteDesignData] No componentId provided, skipping component');
                        continue;
                    }
                } catch (err) {
                    console.error('[updateWebsiteDesignData] Error processing component:', err);
                    continue;
                }
            }

            // Find or create WebsiteDesignsData for this project
            let designData = await WebsiteDesignsData.findOne({ projectId });

            if (designData) {
                console.log('[updateWebsiteDesignData] Updating existing design data');
                // Find the page in pages array
                const pageIndex = designData.pages.findIndex(p =>
                    String(p.pageId?._id || p.pageId) === String(finalPageId)
                );

                if (pageIndex >= 0) {
                    // Update existing page
                    designData.pages[pageIndex].componentIds = processedComponentIds;
                    // Update layout if provided (for element-only pages)
                    if (layout && Array.isArray(layout)) {
                        designData.pages[pageIndex].layout = layout;
                    }
                } else {
                    // Add new page
                    designData.pages.push({
                        pageId: finalPageId,
                        style: {},
                        componentIds: processedComponentIds,
                        layout: (layout && Array.isArray(layout)) ? layout : []
                    });
                }
                await designData.save();
                console.log('[updateWebsiteDesignData] Design data updated successfully');
            } else {
                console.log('[updateWebsiteDesignData] Creating new design data');
                // Create new design data
                const userId = project.userId || req.user?.userId;
                designData = new WebsiteDesignsData({
                    projectId: new mongoose.Types.ObjectId(projectId),
                    userId: new mongoose.Types.ObjectId(userId || project.userId),
                    colorScheme: 'default',
                    colorPrimary: '',
                    colorSecondary: '',
                    colorAccent: '',
                    pageStyles: { style: {} },
                    pages: [{
                        pageId: finalPageId,
                        style: {},
                        componentIds: processedComponentIds,
                        layout: (layout && Array.isArray(layout)) ? layout : []
                    }]
                });
                await designData.save();
                console.log('[updateWebsiteDesignData] Design data created successfully:', designData._id);
            }

            return res.status(200).json({
                success: true,
                message: 'Website design data updated successfully',
                data: designData
            });
        } catch (error) {
            console.error('Error updating Website Design Data:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while updating Website Design Data',
                error: error.message
            });
        }
    },

    // Update Component Elements (for saving individual section changes)
    updateComponentElements: async (req, res) => {
        try {
            const {
                projectId,
                pageId,
                componentId,
                style, // Component-level styles (only changed values)
                elementIds // Array of { elementId, elementType, style, data, order }
            } = req.body;

            if (!projectId || !pageId || !componentId) {
                return res.status(400).json({
                    success: false,
                    message: 'projectId, pageId, and componentId are required'
                });
            }

            console.log('[updateComponentElements] Updating component:', {
                projectId,
                pageId,
                componentId,
                elementIdsCount: elementIds?.length || 0,
                hasStyle: !!style
            });

            // Debug: Log first few elements being sent
            if (elementIds && elementIds.length > 0) {
                console.log('[updateComponentElements] First 3 elements being sent:',
                    elementIds.slice(0, 3).map(el => ({
                        elementId: el.elementId,
                        elementType: el.elementType,
                        hasChildren: !!(el.children && el.children.length > 0)
                    }))
                );
            }

            // Find the design data
            const designData = await WebsiteDesignsData.findOne({ projectId });
            if (!designData) {
                return res.status(404).json({
                    success: false,
                    message: 'Website design data not found'
                });
            }

            // Find the page
            const pageIndex = designData.pages.findIndex(
                (p) => {
                    const pageIdValue = p.pageId?._id?.toString() || p.pageId?.toString() || p.pageId;
                    return pageIdValue === pageId.toString();
                }
            );
            if (pageIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Page not found in design data'
                });
            }

            const page = designData.pages[pageIndex];

            // Find the component in the page
            const componentIndex = page.componentIds.findIndex(
                (comp) => {
                    const compId = comp.componentId?._id?.toString() || comp.componentId?.toString() || comp.componentId;
                    return compId === componentId.toString();
                }
            );

            if (componentIndex === -1) {
                return res.status(404).json({
                    success: false,
                    message: 'Component not found in page'
                });
            }

            // Update the component's style and elementIds
            if (style !== undefined) {
                // Merge with existing style (only update changed values)
                page.componentIds[componentIndex].style = {
                    ...(page.componentIds[componentIndex].style || {}),
                    ...style
                };
            }

            if (elementIds !== undefined) {
                // Debug: Log raw incoming data
                console.log('[updateComponentElements] Raw elementIds received:', JSON.stringify(elementIds.slice(0, 2), null, 2));

                // Replace elementIds array (hierarchical structure with children)
                // Recursive function to process elements and their children (supports infinite nesting)
                const processElement = (el) => {
                    // Debug: Log if elementType is missing
                    if (!el.elementType) {
                        console.warn(`[updateComponentElements] INCOMING element missing elementType:`, {
                            elementId: el.elementId,
                            hasStyle: !!el.style,
                            hasData: !!el.data,
                            hasChildren: !!(el.children && el.children.length > 0),
                            keys: Object.keys(el)
                        });
                    }
                    // Validate required fields
                    if (!el.elementId) {
                        console.error(`[updateComponentElements] Missing elementId, skipping element:`, el);
                        return null;
                    }

                    // Ensure elementType is always present - it's required by the schema
                    if (!el.elementType) {
                        console.warn(`[updateComponentElements] Missing elementType for elementId: ${el.elementId}, using 'text' as fallback`);
                    }

                    const processed = {
                        elementId: el.elementId,
                        elementType: el.elementType || 'text', // Always include elementType (required field)
                        style: el.style || {},
                        data: el.data || {},
                        order: el.order !== undefined ? el.order : 0 // Ensure order is saved
                    };

                    // Process children recursively if they exist (supports infinite nesting)
                    if (el.children && Array.isArray(el.children) && el.children.length > 0) {
                        processed.children = el.children
                            .map(child => processElement(child))
                            .filter(child => child !== null); // Remove any null entries
                    }

                    return processed;
                };

                // Filter out any null entries from processing
                const processedElements = elementIds
                    .map(el => processElement(el))
                    .filter(el => el !== null);

                // Debug: Verify all processed elements have elementType
                const missingElementType = processedElements.filter(el => !el.elementType);
                if (missingElementType.length > 0) {
                    console.error(`[updateComponentElements] ERROR: ${missingElementType.length} processed elements still missing elementType:`,
                        missingElementType.map(el => el.elementId)
                    );
                } else {
                    console.log(`[updateComponentElements] ✓ All ${processedElements.length} processed elements have elementType`);
                }

                page.componentIds[componentIndex].elementIds = processedElements;
            }

            // CRITICAL: Before saving, ensure ALL elements in ALL components have elementType
            // This fixes existing data that might be missing elementType
            const ensureElementType = (element) => {
                // Convert to plain object if it's a Mongoose document
                if (element && typeof element.toObject === 'function') {
                    Object.assign(element, element.toObject());
                }

                if (!element.elementType) {
                    // Try to infer from elementId or use default
                    const inferredType = element.elementId
                        ? element.elementId.split('-')[0].toLowerCase()
                        : 'text';
                    element.elementType = inferredType === 'element' ? 'text' : inferredType;
                    console.log(`[updateComponentElements] Added missing elementType '${element.elementType}' to elementId: ${element.elementId}`);
                }

                // Process children recursively
                if (element.children && Array.isArray(element.children)) {
                    element.children.forEach(child => ensureElementType(child));
                }
            };

            // Clean up ALL components in ALL pages to ensure elementType exists
            let totalElementsFixed = 0;
            designData.pages.forEach((page, pageIdx) => {
                if (page.componentIds && Array.isArray(page.componentIds)) {
                    page.componentIds.forEach((component, compIdx) => {
                        if (component.elementIds && Array.isArray(component.elementIds)) {
                            component.elementIds.forEach(element => {
                                const hadElementType = !!element.elementType;
                                ensureElementType(element);
                                if (!hadElementType && element.elementType) {
                                    totalElementsFixed++;
                                }
                            });
                        }
                    });
                }
            });

            if (totalElementsFixed > 0) {
                console.log(`[updateComponentElements] ✓ Fixed ${totalElementsFixed} elements missing elementType across all components`);
                // Mark the document as modified so Mongoose saves the changes
                designData.markModified('pages');
            }

            // Save the updated design data
            await designData.save();

            console.log('[updateComponentElements] Component updated successfully');

            return res.status(200).json({
                success: true,
                message: 'Component elements updated successfully',
                data: {
                    componentId,
                    elementIdsCount: elementIds?.length || 0
                }
            });
        } catch (error) {
            console.error('[updateComponentElements] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Server error while updating component elements',
                error: error.message
            });
        }
    },

    // Get Website Design Data
    getWebsiteDesignData: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Fetch design data with populated page and component references
            // Note: Mongoose populate for nested arrays can be tricky, so we'll use lean() and manual population
            let designData = await WebsiteDesignsData.findOne({ projectId })
                .populate({
                    path: 'pages.pageId',
                    select: 'name displayName description'
                })
                .lean(); // Use lean() for better performance and to get plain objects

            if (!designData) {
                return res.status(404).json({ message: 'Website design data not found for this project' });
            }

            // Manually populate componentIds for each page (fetch all in parallel for better performance)
            if (designData.pages && Array.isArray(designData.pages)) {
                // Collect all unique componentIds that need to be populated
                const componentIdsToPopulate = new Set();
                designData.pages.forEach((page) => {
                    if (page.componentIds && Array.isArray(page.componentIds)) {
                        page.componentIds.forEach((compData) => {
                            if (compData.componentId) {
                                const compId = compData.componentId._id || compData.componentId;
                                if (compId) {
                                    componentIdsToPopulate.add(compId.toString());
                                }
                            }
                        });
                    }
                });

                // Fetch all components in parallel
                const componentsMap = new Map();
                if (componentIdsToPopulate.size > 0) {
                    const componentIdsArray = Array.from(componentIdsToPopulate).map(id => {
                        try {
                            return mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
                        } catch (err) {
                            return id;
                        }
                    });

                    const components = await WebsiteComponent.find({
                        _id: { $in: componentIdsArray }
                    })
                        .select('name displayName description category variant uniqueId')
                        .lean();

                    // Create a map for quick lookup
                    components.forEach((comp) => {
                        componentsMap.set(comp._id.toString(), comp);
                    });
                }

                // Replace ObjectIds with populated objects
                designData.pages.forEach((page) => {
                    if (page.componentIds && Array.isArray(page.componentIds)) {
                        page.componentIds.forEach((compData) => {
                            if (compData.componentId) {
                                const compId = compData.componentId._id || compData.componentId;
                                const compIdStr = compId?.toString() || compId;
                                const populatedComponent = componentsMap.get(compIdStr);
                                if (populatedComponent) {
                                    compData.componentId = populatedComponent;
                                }
                            }
                        });
                    }
                });
            }

            // Safe debug logging (only if pages exist and have componentIds)
            if (designData.pages && designData.pages.length > 0) {
                const firstPage = designData.pages[0];
                if (firstPage.componentIds && Array.isArray(firstPage.componentIds) && firstPage.componentIds.length > 0) {
                    console.log('[getWebsiteDesignData] First page componentIds[0].elementIds:', firstPage.componentIds[0].elementIds);
                } else if (firstPage.layout && Array.isArray(firstPage.layout) && firstPage.layout.length > 0) {
                    console.log('[getWebsiteDesignData] First page has layout JSON (element-only page):', firstPage.layout.length, 'sections');
                } else {
                    console.log('[getWebsiteDesignData] First page has no componentIds or layout');
                }
            }

            return res.status(200).json({
                message: 'Website design data fetched successfully',
                data: designData
            });
        } catch (error) {
            console.error('Error fetching Website Design Data:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Design Data' });
        }
    },

    // Get pages list for a project (for page selection dialog)
    getWebsitePages: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // Fetch all pages for this project directly from WebsitePage (project-specific)
            const websitePages = await WebsitePage.find({ projectId })
                .select('name slug displayName description')
                .sort({ createdAt: -1 })
                .lean();

            // Also fetch design data to get component counts
            const designData = await WebsiteDesignsData.findOne({ projectId })
                .select('pages.pageId pages.componentIds')
                .lean();

            // Create a map of pageId to component count from designData
            const componentCountMap = new Map();
            if (designData && designData.pages) {
                designData.pages.forEach(page => {
                    const pageId = page.pageId?._id || page.pageId;
                    if (pageId) {
                        componentCountMap.set(pageId.toString(), page.componentIds?.length || 0);
                    }
                });
            }

            // Map website pages to response format
            const pages = websitePages.map(page => ({
                pageId: page._id,
                _id: page._id,
                name: page.name || '', // Unique identifier, non-changeable
                slug: page.slug || page.name || '', // Changeable URL path
                displayName: page.displayName || '',
                description: page.description || '',
                componentCount: componentCountMap.get(page._id.toString()) || 0
            }));

            return res.status(200).json({
                message: 'Website pages fetched successfully',
                data: pages
            });
        } catch (error) {
            console.error('Error fetching Website Pages:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Pages', error: error.message });
        }
    },

    // Check if project is a business website (has WebsiteDesignsData)
    isBusinessWebsite: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            const designData = await WebsiteDesignsData.findOne({ projectId });

            return res.status(200).json({
                message: 'Business website check completed',
                data: {
                    isBusinessWebsite: !!designData,
                    hasPages: designData ? (designData.pages?.length > 0) : false
                }
            });
        } catch (error) {
            console.error('Error checking business website:', error);
            return res.status(500).json({ message: 'Server error while checking business website' });
        }
    },

    // Save or Update Website Element
    saveWebsiteElement: async (req, res) => {
        try {
            const { projectId, componentId, pageId, elementId, elementType, order, props, style, defaultCode, defaultStyle } = req.body;

            if (!projectId || !componentId || !pageId || !elementId || !elementType) {
                return res.status(400).json({
                    message: 'projectId, componentId, pageId, elementId, and elementType are required'
                });
            }

            // Check if element already exists
            let element = await WebsiteElement.findOne({
                projectId,
                componentId,
                pageId,
                elementId
            });

            if (element) {
                // Update existing element
                element.elementType = elementType;
                element.order = order !== undefined ? order : element.order;
                element.props = props || element.props;
                element.style = style || element.style;
                if (defaultCode !== undefined) element.defaultCode = defaultCode;
                if (defaultStyle !== undefined) element.defaultStyle = defaultStyle;
                await element.save();
            } else {
                // Create new element
                element = new WebsiteElement({
                    projectId: new mongoose.Types.ObjectId(projectId),
                    componentId: new mongoose.Types.ObjectId(componentId),
                    pageId: new mongoose.Types.ObjectId(pageId),
                    elementId,
                    elementType,
                    order: order || 0,
                    props: props || {},
                    style: style || {},
                    defaultCode: defaultCode || '',
                    defaultStyle: defaultStyle || {}
                });
                await element.save();
            }

            return res.status(200).json({
                message: 'Website element saved successfully',
                data: element
            });
        } catch (error) {
            console.error('Error saving Website Element:', error);
            return res.status(500).json({ message: 'Server error while saving Website Element' });
        }
    },

    // Get Website Elements for a component
    getWebsiteElements: async (req, res) => {
        try {
            const { projectId, componentId, pageId } = req.query;

            if (!projectId || !componentId || !pageId) {
                return res.status(400).json({
                    message: 'projectId, componentId, and pageId are required'
                });
            }

            const elements = await WebsiteElement.find({
                projectId,
                componentId,
                pageId
            }).sort({ order: 1 });

            return res.status(200).json({
                message: 'Website elements fetched successfully',
                data: elements
            });
        } catch (error) {
            console.error('Error fetching Website Elements:', error);
            return res.status(500).json({ message: 'Server error while fetching Website Elements' });
        }
    },

    // Delete Website Element
    deleteWebsiteElement: async (req, res) => {
        try {
            const { elementId } = req.params;
            const { projectId, componentId, pageId } = req.query;

            if (!elementId) {
                return res.status(400).json({ message: 'elementId is required' });
            }

            const query = { elementId };
            if (projectId) query.projectId = projectId;
            if (componentId) query.componentId = componentId;
            if (pageId) query.pageId = pageId;

            const element = await WebsiteElement.findOneAndDelete(query);

            if (!element) {
                return res.status(404).json({ message: 'Website element not found' });
            }

            return res.status(200).json({
                message: 'Website element deleted successfully',
                data: element
            });
        } catch (error) {
            console.error('Error deleting Website Element:', error);
            return res.status(500).json({ message: 'Server error while deleting Website Element' });
        }
    },

    // Upsert Builder Elements
    upsertBuilderElements: async (req, res) => {
        try {
            // Get current count for ordering
            const existingCount = await BuilderElement.countDocuments();

            // Process elements from request body
            let elementsToAdd = [];
            if (req.body.elements) {
                let elements = req.body.elements;

                // If not array, try to parse as JSON
                if (!Array.isArray(elements)) {
                    try {
                        if (typeof elements === 'string') {
                            elements = JSON.parse(elements);
                        } else {
                            elements = [elements];
                        }
                    } catch (parseErr) {
                        return res.status(400).json({
                            message: 'Invalid elements format. Expected array or JSON string.',
                            error: parseErr.message
                        });
                    }
                }

                // Convert array of strings to element objects
                elementsToAdd = elements.map((el, index) => {
                    if (typeof el === 'string') {
                        // If string, create element object with elementId
                        const elementId = el.toLowerCase().trim();
                        return {
                            elementId: elementId,
                            elementType: elementId,
                            displayName: el.charAt(0).toUpperCase() + el.slice(1),
                            description: `${el} element`,
                            category: "basic",
                            order: existingCount + index + 1,
                            isActive: true
                        };
                    } else if (typeof el === 'object' && el.elementId) {
                        // If object, use it as is (with defaults)
                        return {
                            elementId: el.elementId.toLowerCase().trim(),
                            elementType: el.elementType || el.elementId.toLowerCase().trim(),
                            displayName: el.displayName || el.elementId.charAt(0).toUpperCase() + el.elementId.slice(1),
                            description: el.description || `${el.elementId} element`,
                            category: el.category || "basic",
                            order: el.order || existingCount + index + 1,
                            defaultCode: el.defaultCode || '',
                            defaultStyle: el.defaultStyle || {},
                            defaultProps: el.defaultProps || {},
                            isActive: el.isActive !== undefined ? el.isActive : true
                        };
                    } else {
                        return null;
                    }
                }).filter(el => el !== null);
            }

            // Check for existing elements and insert only new ones
            const insertedElements = [];
            const skippedElements = [];

            if (elementsToAdd.length > 0) {
                for (const elementData of elementsToAdd) {
                    try {
                        // Check if element already exists
                        const existing = await BuilderElement.findOne({
                            elementId: elementData.elementId
                        });

                        if (existing) {
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: 'Already exists'
                            });
                            console.log(`[upsertBuilderElements] Element "${elementData.elementId}" already exists, skipping`);
                        } else {
                            // Insert new element
                            const newElement = new BuilderElement(elementData);
                            await newElement.save();
                            insertedElements.push(newElement);
                            console.log(`[upsertBuilderElements] Element "${elementData.elementId}" inserted successfully`);
                        }
                    } catch (err) {
                        if (err.code === 11000) {
                            // Duplicate key error
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: 'Duplicate key'
                            });
                        } else {
                            console.error(`[upsertBuilderElements] Error inserting element "${elementData.elementId}":`, err);
                            skippedElements.push({
                                elementId: elementData.elementId,
                                reason: err.message
                            });
                        }
                    }
                }
            }

            // Get all elements
            const allElements = await BuilderElement.find({ isActive: true })
                .sort({ order: 1 });

            return res.status(200).json({
                message: 'Elements processed successfully',
                data: {
                    totalElements: allElements.length,
                    inserted: insertedElements.length,
                    skipped: skippedElements.length,
                    insertedElements: insertedElements,
                    skippedElements: skippedElements,
                    allElements: allElements
                }
            });
        } catch (error) {
            console.error('Error upserting Builder Elements:', error);
            return res.status(500).json({
                message: 'Server error while upserting Builder Elements',
                error: error.message
            });
        }
    },

    // Get All Builder Elements
    getBuilderElements: async (req, res) => {
        try {
            const { category, isActive } = req.query;

            console.log(req.query, req.body, "there are the logs")

            const query = {};
            if (category) query.category = category;
            if (isActive !== undefined) query.isActive = isActive === 'true';

            const elements = await BuilderElement.find(query)
                .sort({ order: 1 });

            return res.status(200).json({
                message: 'Builder elements fetched successfully',
                data: elements
            });
        } catch (error) {
            console.error('Error fetching Builder Elements:', error);
            return res.status(500).json({ message: 'Server error while fetching Builder Elements' });
        }
    },

    updateProjectTheme: async (req, res) => {
        try {
            console.log("we are in updateProjectTheme", req.body); // Debugging the incoming request

            // Extract projectId, theme, presetId, themeSubColor, customColors, defaultStyles, defaultFont, defaultSizes, and defaultTypography from request body
            const { projectId, theme, presetId, themeSubColor, customColors, defaultStyles, defaultFont, defaultSizes, defaultTypography } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            if (!theme) {
                return res.status(400).json({ message: "theme is required" });
            }

            // Check if the project exists
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Look up presetId from Theme collection if not provided but theme name is provided
            let finalPresetId = presetId;
            if (!finalPresetId && theme && theme !== 'custom') {
                // Convert theme name to match themeName format (e.g., "crimson-jet" -> "Crimson Jet")
                const themeNameForLookup = theme.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                const themeDoc = await Theme.findOne({ themeName: themeNameForLookup });
                if (themeDoc) {
                    finalPresetId = themeDoc._id;
                }
            }

            // Fetch the current theme settings for the project
            let themeSettings = await ThemeSetting.findOne({ projectId });

            if (themeSettings) {
                // If theme settings exist, update them
                themeSettings.theme = theme;
                // Update presetId (null if custom theme)
                themeSettings.presetId = finalPresetId || null;
                if (themeSubColor) {
                    themeSettings.themeSubColor = themeSubColor; // Update the sub color if provided
                }
                // Update custom colors if provided (for custom theme)
                if (customColors && theme === 'custom') {
                    themeSettings.customColors = customColors;
                } else if (theme !== 'custom' && customColors) {
                    // For preset themes, still save font/size settings in customColors
                    // Only save headingSizes, buttonSizes, textSizes, and fontFamily
                    themeSettings.customColors = {
                        headingSizes: customColors.headingSizes,
                        buttonSizes: customColors.buttonSizes,
                        textSizes: customColors.textSizes,
                        fontFamily: customColors.fontFamily
                    };
                }
                // Save defaultStyles array for all themes
                if (defaultStyles && Array.isArray(defaultStyles)) {
                    themeSettings.defaultStyles = defaultStyles;
                }
                // Save defaultFont (separate key)
                if (defaultFont !== undefined) {
                    themeSettings.defaultFont = defaultFont || "Inter, sans-serif";
                }
                // Save defaultSizes if provided
                if (defaultSizes) {
                    themeSettings.defaultSizes = { ...themeSettings.defaultSizes, ...defaultSizes };
                }
                // Save defaultTypography if provided
                if (defaultTypography) {
                    themeSettings.defaultTypography = { ...themeSettings.defaultTypography, ...defaultTypography };
                }
                await themeSettings.save();
            } else {
                // If no theme settings exist, create new theme settings
                const newThemeData = {
                    projectId,
                    userId: req.user?.userId || req.body.userId, // Ensure the userId is included
                    theme, // Set the theme
                    presetId: finalPresetId || null, // Set presetId (looked up from theme name if needed)
                    themeSubColor: themeSubColor || null, // Set the sub color if provided
                };

                // Set custom colors based on theme type
                if (theme === 'custom' && customColors) {
                    newThemeData.customColors = customColors;
                } else if (customColors) {
                    // For preset themes, save only font/size settings
                    newThemeData.customColors = {
                        headingSizes: customColors.headingSizes,
                        buttonSizes: customColors.buttonSizes,
                        textSizes: customColors.textSizes,
                        fontFamily: customColors.fontFamily
                    };
                }

                // Save defaultStyles array
                if (defaultStyles && Array.isArray(defaultStyles)) {
                    newThemeData.defaultStyles = defaultStyles;
                }

                // Save defaultFont (separate key)
                if (defaultFont !== undefined) {
                    newThemeData.defaultFont = defaultFont || "Inter, sans-serif";
                }
                // Save defaultSizes if provided
                if (defaultSizes) {
                    newThemeData.defaultSizes = defaultSizes;
                }
                // Save defaultTypography if provided
                if (defaultTypography) {
                    newThemeData.defaultTypography = defaultTypography;
                }

                themeSettings = new ThemeSetting(newThemeData);
                await themeSettings.save();
            }

            console.log("[updateProjectTheme] Theme saved to ThemeSetting table:", {
                projectId,
                theme: themeSettings.theme,
                hasCustomColors: !!themeSettings.customColors,
                hasDefaultStyles: !!themeSettings.defaultStyles
            });

            // Send success response
            return res.status(200).json({ message: "Theme and sub color saved successfully!", data: themeSettings });
        } catch (error) {
            console.error("Error updating project theme:", error);
            return res.status(500).json({ message: "Server error while updating project theme" });
        }
    },

    getThemeSettings: async (req, res) => {
        try {
            const { projectId } = req.query;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            // Fetch theme settings for the project
            const themeSettings = await ThemeSetting.findOne({ projectId });

            if (!themeSettings) {
                // Return default theme if not found
                return res.status(200).json({
                    success: true,
                    message: "Theme settings not found, returning default",
                    data: {
                        theme: 'crimson-jet',
                        customColors: null
                    }
                });
            }


            // console.log(themeSettings, "fetched theme settings");return

            // Return theme settings
            return res.status(200).json({
                success: true,
                message: "Theme settings retrieved successfully",
                data: {
                    theme: themeSettings.theme,
                    presetId: themeSettings.presetId || null,
                    themeSubColor: themeSettings.themeSubColor,
                    themeSecondaryColor: themeSettings.themeSecondaryColor,
                    customColors: themeSettings.customColors || null,
                    defaultStyles: themeSettings.defaultStyles || null,
                    defaultFont: themeSettings.defaultFont || "Inter, sans-serif",
                    defaultSizes: themeSettings.defaultSizes || null,
                    defaultTypography: themeSettings.defaultTypography || null
                }
            });
        } catch (error) {
            console.error("Error fetching theme settings:", error);
            return res.status(500).json({ message: "Server error while fetching theme settings" });
        }
    },

    create_theme: async (req, res) => {
        try {
            const {
                themeName,
                supportThemeSubColor = false,
                supportSecondaryColor = false,
                themeDemoUrl,
                themeImageUrl,
                isActive = false
            } = req.body;

            if (!themeName || !themeDemoUrl || !themeImageUrl) {
                return res.status(400).json({ message: 'themeName, themeDemoUrl, themeImageUrl are required' });
            }

            if (isActive) {
                await Theme.updateMany({}, { $set: { isActive: false } });
            }

            const newTheme = new Theme({
                themeName,
                supportThemeSubColor,
                supportSecondaryColor,
                themeDemoUrl,
                themeImageUrl,
                isActive
            });

            await newTheme.save();

            return res.status(201).json({
                message: 'Theme created successfully!',
                theme: newTheme
            });
        } catch (error) {
            console.error('Error creating theme:', error);
            return res.status(500).json({ message: 'Error creating theme' });
        }
    },

    // EDIT / UPDATE
    update_theme: async (req, res) => {
        try {

            const {
                themeName,
                supportThemeSubColor,
                supportSecondaryColor,
                themeDemoUrl,
                themeImageUrl,
                themeId
            } = req.body;



            console.log(req.body, "update theme api data")
            const theme = await Theme.findById(themeId);
            if (!theme) {
                return res.status(404).json({ message: 'Theme not found' });
            }

            if (themeName !== undefined) theme.themeName = themeName;
            if (supportThemeSubColor !== undefined) theme.supportThemeSubColor = supportThemeSubColor;
            if (supportSecondaryColor !== undefined) theme.supportSecondaryColor = supportSecondaryColor;
            if (themeDemoUrl !== undefined) theme.themeDemoUrl = themeDemoUrl;
            if (themeImageUrl !== undefined) theme.themeImageUrl = themeImageUrl;

            await theme.save();

            return res.status(200).json({
                message: 'Theme updated successfully!',
                theme
            });
        } catch (error) {
            console.error('Error updating theme:', error);
            return res.status(500).json({ message: 'Error updating theme' });
        }
    },

    // CHANGE STATUS (activate/deactivate)
    change_theme_status: async (req, res) => {
        try {
            const { themeId, isActive } = req.body;

            if (!themeId) {
                return res.status(400).json({ message: 'themeId is required' });
            }

            // accept boolean or string "true"/"false"
            if (![true, false, 'true', 'false'].includes(isActive)) {
                return res.status(400).json({ message: 'isActive must be boolean (true/false)' });
            }

            const activate = (isActive === true || isActive === 'true');

            const theme = await Theme.findById(themeId);
            if (!theme) {
                return res.status(404).json({ message: 'Theme not found' });
            }

            theme.isActive = activate;
            await theme.save();

            return res.status(200).json({
                message: `Theme ${activate ? 'activated' : 'deactivated'} successfully!`,
                theme
            });
        } catch (error) {
            console.error('Error changing theme status:', error);
            return res.status(500).json({ message: 'Error changing theme status' });
        }
    },

    // LIST (optional filters ?active=true/false&search=xyz)
    list_themes: async (req, res) => {
        try {
            const { active, search } = req.query;

            const filter = {};
            if (active === 'true') filter.isActive = true;
            if (active === 'false') filter.isActive = false;
            if (search) filter.themeName = { $regex: search, $options: 'i' };

            const themes = await Theme.find(filter).sort({ createdAt: -1 });

            return res.status(200).json({
                message: 'Themes fetched successfully!',
                count: themes.length,
                themes
            });
        } catch (error) {
            console.error('Error listing themes:', error);
            return res.status(500).json({ message: 'Error listing themes' });
        }
    },

    seed_themes: async (req, res) => {
        try {
            console.log('🔄 Manual theme seeding triggered...');
            const seedThemes = require('../config/seedThemes');
            await seedThemes();

            // Small delay to ensure all saves are complete
            await new Promise(resolve => setTimeout(resolve, 300));

            // Fetch updated themes list
            const themes = await Theme.find().sort({ createdAt: -1 });

            console.log(`✅ Seeding complete. Total themes in database: ${themes.length}`);
            themes.forEach(t => {
                console.log(`   - ${t.themeName} (Active: ${t.isActive})`);
            });

            return res.status(200).json({
                message: 'Themes seeded successfully!',
                count: themes.length,
                themes
            });
        } catch (error) {
            console.error('❌ Error seeding themes:', error);
            return res.status(500).json({
                message: 'Error seeding themes',
                error: error.message
            });
        }
    },

    fetch_services: async (req, res) => {
        try {
            const { projectId, page = 1, limit = 10 } = req.body; // Accept page and limit from the request body

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            let project_info = await userProjects.findById(projectId).lean()
                .select('_id projectName fas_fa_icon');

            if (!project_info) {
                return res.status(400).json({ message: 'Project with this ID does not exist' });
            }

            // Calculate skip value for pagination
            const skip = (page - 1) * limit;

            // Fetch services with pagination
            const services = await Service.find({ projectId, is_main: true })
                .select('_id service_name fas_fa_icon service_description')
                .skip(skip) // Skip previous records
                .limit(limit); // Limit the number of services returned

            // Get the total count of services for pagination
            const totalServices = await Service.countDocuments({ projectId, is_main: true });


            return res.json({
                project_info,
                services,
                totalServices,
            });
        } catch (error) {
            console.error('Error fetching content:', error);
            return res.status(500).json({ message: 'Error fetching content' });
        }
    },

    fetch_ordered_services: async (req, res) => {
        try {
            const { projectId } = req.body;
            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required' });
            }

            // 1) Verify project exists
            const project_info = await userProjects
                .findById(projectId)
                .lean()
                .select('_id projectName fas_fa_icon');
            if (!project_info) {
                return res
                    .status(400)
                    .json({ message: 'Project with this ID does not exist' });
            }

            // 2) Aggregation: match → sort → group → sort buckets → project shape
            const services = await Service.aggregate([
                {
                    $match: {
                        projectId: new mongoose.Types.ObjectId(projectId),
                        is_main: true,
                    }
                },
                {
                    $project: {
                        // include only these fields in the pipeline
                        _id: 1,
                        service_name: 1,
                        fas_fa_icon: 1,
                        // compute uppercase first letter
                        firstLetter: {
                            $toUpper: { $substr: ["$service_name", 0, 1] }
                        }
                    }
                },
                { $sort: { service_name: 1 } },    // A→Z overall
                {
                    $group: {
                        _id: "$firstLetter",
                        services: {
                            $push: {
                                _id: "$_id",
                                service_name: "$service_name",
                                fas_fa_icon: "$fas_fa_icon"
                            }
                        }
                    }
                },
                { $sort: { _id: 1 } },             // A→Z buckets
                {
                    $project: {
                        _id: 0,
                        letter: "$_id",
                        services: 1
                    }
                }
            ]);

            // 3) Send down project + grouped services
            return res.json({
                project_info,
                services
            });

        } catch (error) {
            console.error('Error fetching services:', error);
            return res.status(500).json({ message: 'Error fetching services' });
        }
    },

    create_service: async (req, res) => {
        try {
            const { projectId, service_name, service_description, fas_fa_icon } = req.body;

            // Validate required fields
            if (!projectId || !service_name || !service_description || !fas_fa_icon) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Find the project by ID
            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: 'Project not found' });
            }

            // Create the new service in the database
            const newService = new Service({
                projectId,
                service_name,
                service_description,
                fas_fa_icon,
                is_main: true, // assuming the service should be marked as main by default
            });

            // Save the service to the database
            await newService.save();

            // Trigger OpenAI processing for the new service
            const prompts = {
                whyChooseUs: `
                  Write a persuasive "Why Choose Us" section for a service called "${service_name}" offered as part of the "${project.projectName}" project. 
                  Highlight the key benefits, expertise, and customer satisfaction according to this service description: "${service_description}". 
                  Add professional heading tags for headings and p tags for paragraphs. Do not add the title "Why Choose Us" as it is already in my static HTML structure.
                `,
                ourProcess: `
                  Create a structured "Our Process" section for the service "${service_name}" under the "${project.projectName}" project. 
                  Include step-by-step instructions based on "${service_description}". 
                  Add professional heading tags for headings and p tags for paragraphs. Do not add the title "Our Process" as it is already in my static HTML structure.
                `,
                scheduleService: `
                  Generate a compelling "Schedule Service" section for "${service_name}" in the "${project.projectName}" project. 
                  Focus on ease of booking and emphasize quick response times.
                  Add professional heading tags for headings and p tags for paragraphs. Do not add the title "Schedule Service" as it is already in my static HTML structure.
                  Make sure to dont create any form just type for more information visit contactus page.
                `,
                ourGuarantees: `
                  Write an "Our Guarantees" section for "${service_name}" in the "${project.projectName}" project. 
                  Emphasize trustworthiness and reliability. 
                  Add professional heading tags for headings and p tags for paragraphs. Do not add the title "Our Guarantees" as it is already in my static HTML structure.
                `,
            };

            const userId = req.user?.userId || project.userId?.toString() || 'admin';

            const responses = await Promise.allSettled([
                getResponseFromOpenAITracked(prompts.whyChooseUs, 'WhyChooseUs', {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'why_choose_us'
                }),
                getResponseFromOpenAITracked(prompts.ourProcess, 'OurProcess', {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'our_process'
                }),
                getResponseFromOpenAITracked(prompts.scheduleService, 'ScheduleService', {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'schedule_service'
                }),
                getResponseFromOpenAITracked(prompts.ourGuarantees, 'OurGuarantees', {
                    userId,
                    projectId,
                    pageId: projectId,
                    promptFrom: 'admin_panel',
                    promptFor: 'our_guarantees'
                }),
            ]);

            const [whyChooseUsContent, ourProcessContent, scheduleServiceContent, ourGuaranteesContent] = responses.map((response) =>
                response.status === 'fulfilled' ? response.value.text : null
            );

            if (!whyChooseUsContent || !ourProcessContent || !scheduleServiceContent || !ourGuaranteesContent) {
                console.error(`Skipping service "${service_name}" due to failed OpenAI responses.`);
                return res.status(500).json({ message: `Failed to generate content for service "${service_name}"` });
            }

            const query = `Image of ${service_name}`;
            const apiKey = process.env.UNSPLASH_ACCESS_KEY;
            const url = `https://api.unsplash.com/search/photos`;
            const heroImageWidth = 1200;
            const heroImageHeight = 800;

            let images = [];
            try {
                const response = await axios.get(url, {
                    params: { query, per_page: 1 },
                    headers: { Authorization: `Client-ID ${apiKey}` },
                });

                images = response.data.results.map((image) => ({
                    description: image.alt_description,
                    url: `${image.urls.raw}?w=${heroImageWidth}&h=${heroImageHeight}&fit=crop`,
                }));
            } catch (error) {
                console.error(`Error fetching images for service "${service_name}":`, error.response?.data || error.message);
            }

            const formatContentForHTML = (text) => text.replace(/\n/g, '<br>');

            const serviceStepsPrompt = formatContentForHTML(ourProcessContent);

            let formattedStepsIcons = [];
            let attempts = 0;

            while (attempts < 3) {
                try {
                    const newPrompt = `
                      Based on the following dynamic steps describing a process, generate a valid JSON Array of objects. 
                      Each object should have three keys: "stepName" (service step name), "iconClass" (Font Awesome icon class), and "serviceDescription" (detailed description of that particular step of the process).
          
                      Steps:
                      ${serviceStepsPrompt}
          
                      Output Format:
                      [
                         { "stepName": "Initial Assessment", "iconClass": "fas fa-laptop-medical", "serviceDescription": "valid description according to the process step of the service" },
                         { "stepName": "Quotation", "iconClass": "fas fa-file-invoice-dollar", "serviceDescription": "valid description according to the process step of the service" }
                      ]
          
                      Ensure all icons are valid "fas fa" or "fa fa" classes.
                    `;
                    const userId = req.user?.userId || project?.userId?.toString() || 'admin';
                    const openAIResponse = await getResponseFromOpenAITracked(
                        newPrompt,
                        'ServiceStepsIcons',
                        {
                            userId,
                            projectId: projectId || 'system',
                            pageId: projectId || 'system',
                            promptFrom: 'admin_panel',
                            promptFor: 'service_steps_icons'
                        }
                    );
                    const cleanedResponse = openAIResponse.text.replace(/```json|```/g, '').trim();
                    formattedStepsIcons = JSON.parse(cleanedResponse);

                    if (Array.isArray(formattedStepsIcons)) break;
                } catch (error) {
                    console.error(`Error parsing OpenAI JSON response for service "${service_name}" (attempt ${attempts + 1}):`, error.message);
                }
                attempts++;
            }

            if (formattedStepsIcons.length === 0) {
                console.error(`Skipping service "${service_name}" due to failed steps icons generation.`);
                return res.status(500).json({ message: `Failed to generate steps for service "${service_name}"` });
            }

            // Update the newly created service with the generated content
            await Service.findByIdAndUpdate(newService._id, {
                $set: {
                    ourGuarantees: formatContentForHTML(ourGuaranteesContent),
                    ourProcess: formatContentForHTML(ourProcessContent),
                    scheduleService: formatContentForHTML(scheduleServiceContent),
                    whyChooseUs: formatContentForHTML(whyChooseUsContent),
                    images,
                    steps_process: formattedStepsIcons,
                },
            });

            return res.status(201).json({
                message: 'Service created and processed successfully!',
                service: newService,
            });

        } catch (error) {
            console.error('Error creating service:', error);
            return res.status(500).json({ message: 'Error creating service' });
        }
    },

    update_service: async (req, res) => {
        try {
            const { serviceId } = req.params; // Get serviceId from URL parameter
            const { service_name, service_description, fas_fa_icon, projectId } = req.body;

            // Validate required fields
            if (!service_name || !service_description || !fas_fa_icon || !projectId) {
                return res.status(400).json({ message: 'All fields are required' });
            }

            // Find the service by ID
            const service = await Service.findById(serviceId);
            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Check if the projectId matches the service's projectId (optional check)
            if (service.projectId.toString() !== projectId) {
                return res.status(403).json({ message: 'You do not have permission to update this service' });
            }

            // Update the service with the new data
            service.service_name = service_name;
            service.service_description = service_description;
            service.fas_fa_icon = fas_fa_icon;

            // Save the updated service
            await service.save();

            // Respond with the updated service
            return res.status(200).json({
                message: 'Service updated successfully!',
                service,
            });
        } catch (error) {
            console.error('Error updating service:', error);
            return res.status(500).json({ message: 'Error updating service' });
        }
    },

    delete_service: async (req, res) => {

        try {
            const { serviceId } = req.params; // Get serviceId from URL parameter

            // Validate serviceId
            if (!serviceId) {
                return res.status(400).json({ message: 'Service ID is required' });
            }

            // Find the service by ID and delete it
            const service = await Service.findByIdAndDelete(serviceId);

            if (!service) {
                return res.status(404).json({ message: 'Service not found' });
            }

            // Respond with success message
            return res.status(200).json({
                message: 'Service deleted successfully!',
            });
        } catch (error) {
            console.error('Error deleting service:', error);
            return res.status(500).json({ message: 'Error deleting service' });
        }


    },

    clear_redis: async (req, res) => {
        try {
            // 1. Pause the queue so no new jobs are processed
            await redisQueue.pause(/* shouldPauseAll = */ true);

            // 2. Remove every job from every state
            //    force:true is required to remove delayed jobs
            await redisQueue.obliterate({ force: true });

            return res
                .status(200)
                .json({ success: true, message: 'All Redis queue tasks have been permanently cleared.' });
        } catch (err) {
            console.error('Error clearing Redis queue:', err);
            return res
                .status(500)
                .json({ success: false, error: err.message });
        }
    },

    // 1) Create or update SEO data for a specific page
    updateSeoSettings: async (req, res) => {
        try {
            const { pageUrl, metaTitle, metaDescription, metaKeywords, metaImage, canonicalUrl } = req.body;

            // Validate required fields
            if (!pageUrl || !metaTitle || !metaDescription || !metaKeywords) {
                return res.status(400).json({
                    message: 'Page URL, Title, Description, and Keywords are required!'
                });
            }

            // Find existing SEO data for the page
            let seoData = await SeoSettings.findOne({ page_url: pageUrl });

            if (seoData) {
                // If SEO data exists, update it
                seoData.meta_title = metaTitle;
                seoData.meta_description = metaDescription;
                seoData.meta_keywords = metaKeywords;
                seoData.meta_image = metaImage || '';
                seoData.canonical_url = canonicalUrl || '';

                await seoData.save();
                return res.status(200).json({
                    message: 'SEO data updated successfully!',
                    data: seoData
                });
            }

            // If no SEO data exists for the page, create new
            seoData = new SeoSettings({
                page_url: pageUrl,
                meta_title: metaTitle,
                meta_description: metaDescription,
                meta_keywords: metaKeywords,
                meta_image: metaImage || '',
                canonical_url: canonicalUrl || '',
            });

            await seoData.save();
            return res.status(201).json({
                message: 'SEO data created successfully!',
                data: seoData
            });
        } catch (error) {
            console.error('Error in updateSeoSettings:', error);
            return res.status(500).json({ message: 'An error occurred while updating SEO settings.' });
        }
    },

    // Get SEO settings for builder page (by projectId and pageId)
    getBuilderSeoSettings: async (req, res) => {
        try {
            const { projectId, pageId } = req.query;

            // Validate inputs
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }

            // Find SEO settings by projectId and pageId (if provided)
            let query = { projectId: projectId };
            if (pageId) {
                query.builderPageId = pageId;
            }

            const seoSettings = await SeoSettings.findOne(query);

            if (!seoSettings) {
                return res.status(200).json({
                    message: 'SEO settings not found',
                    data: null
                });
            }

            return res.status(200).json({
                message: 'SEO settings retrieved successfully',
                data: seoSettings
            });
        } catch (error) {
            console.error('Error in getBuilderSeoSettings:', error);
            return res.status(500).json({ message: 'An error occurred while fetching SEO settings.' });
        }
    },

    // Update or create SEO settings for builder page
    updateBuilderSeoSettings: async (req, res) => {
        try {
            const { projectId, pageId, metaTitle, metaDescription, metaKeywords, metaImage, canonicalUrl } = req.body;

            // Validate required fields
            if (!projectId) {
                return res.status(400).json({
                    message: 'Project ID is required!'
                });
            }

            if (!metaTitle || !metaDescription || !metaKeywords) {
                return res.status(400).json({
                    message: 'Meta Title, Description, and Keywords are required!'
                });
            }

            // Build query to find existing SEO data
            let query = { projectId: projectId };
            if (pageId) {
                query.builderPageId = pageId;
            }

            // Find existing SEO data for the page
            let seoData = await SeoSettings.findOne(query);

            if (seoData) {
                // If SEO data exists, update it
                seoData.meta_title = metaTitle;
                seoData.meta_description = metaDescription;
                seoData.meta_keywords = metaKeywords;
                seoData.meta_image = metaImage || '';
                seoData.canonical_url = canonicalUrl || '';
                if (pageId) {
                    seoData.builderPageId = pageId;
                }

                await seoData.save();
                return res.status(200).json({
                    message: 'SEO settings updated successfully!',
                    data: seoData
                });
            }

            // If no SEO data exists for the page, create new
            seoData = new SeoSettings({
                projectId: projectId,
                builderPageId: pageId || '',
                page_url: pageId ? `builder-page-${pageId}` : `builder-project-${projectId}`, // Fallback URL
                meta_title: metaTitle,
                meta_description: metaDescription,
                meta_keywords: metaKeywords,
                meta_image: metaImage || '',
                canonical_url: canonicalUrl || '',
            });

            await seoData.save();
            return res.status(201).json({
                message: 'SEO settings created successfully!',
                data: seoData
            });
        } catch (error) {
            console.error('Error in updateBuilderSeoSettings:', error);
            return res.status(500).json({ message: 'An error occurred while updating SEO settings.' });
        }
    },

    // 2) Fetch SEO data for a specific page
    getSeoSettings: async (req, res) => {
        try {
            let { pageUrl, projectId } = req.body;

            console.log(req.body, "req.body<<<<<<<<<>>>>>>>>>>>")


            // 1) Validate inputs
            if (!projectId) {
                return res.status(400).json({ message: "Project ID is required!" });
            }
            console.log("project id found on seo")
            if (!pageUrl) {
                return res.status(400).json({ message: "pageUrl is required!" });
            }

            console.log("Page url found on seo")

            // 2) Normalize the URL string
            if (!pageUrl.startsWith('/')) {
                pageUrl = '/' + pageUrl;
            }
            if (pageUrl === '/home') {
                pageUrl = '/';
            }
            console.log(pageUrl, "pageUrl", projectId, "projectId")

            // 3) Fetch the SEO settings matching both pageUrl AND projectId
            const seoData = await SeoSettings.findOne({
                page_url: pageUrl,
                projectId: projectId
            }).lean();

            if (!seoData) {
                return res
                    .status(404)
                    .json({ message: 'SEO data not found for this page & project!' });
            }

            console.log(seoData, "THIS is SEO DATA")

            // 4) Return
            return res.status(200).json({ data: seoData });

        } catch (error) {
            console.error('Error in getSeoSettings:', error);
            return res
                .status(500)
                .json({ message: 'An error occurred while fetching SEO settings.' });
        }
    },

    getPerPageSeo: async (req, res) => {

        try {
            return res.status(200).json({ message: 'SEO data deleted successfully!' });

        }
        catch (error) {
            console.error('Error in deleteSeoSettings:', error);
            return res.status(500).json({ message: 'An error occurred while deleting SEO settings.' });

        }
    },

    // 3) Delete SEO data for a specific page
    deleteSeoSettings: async (req, res) => {
        try {
            const { pageUrl } = req.params;

            // Find and delete the SEO data for the page
            const seoData = await SeoSettings.findOneAndDelete({ page_url: pageUrl });

            if (!seoData) {
                return res.status(404).json({ message: 'SEO data not found!' });
            }

            // Delete the slug entry for the page
            await Slug.deleteMany({ locationId: seoData._id, slugType: 'city' });

            return res.status(200).json({ message: 'SEO data deleted successfully!' });
        } catch (error) {
            console.error('Error in deleteSeoSettings:', error);
            return res.status(500).json({ message: 'An error occurred while deleting SEO settings.' });
        }
    },

    // ALL HOsting APIs
    addHosting: async (req, res) => {
        try {
            let { connectionType, connectionConfig } = req.body;

            // Validate the input fields
            if (!connectionType || !connectionConfig) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            // If connectionConfig is a string, parse it to JSON
            if (typeof connectionConfig === 'string') {
                connectionConfig = JSON.parse(connectionConfig);
            }

            // Test the connection based on the type
            switch (connectionType) {
                case 'ftp':
                    await testFTPConnection(connectionConfig);
                    break;
                case 'ssh':
                    await testSSHConnection(connectionConfig); // Test SSH for both SSH and VPS
                    break;
                case 'cpanel':
                    await testCpanelConnection(connectionConfig);
                    break;
                case 'vps': // Use SSH test for VPS
                    await testSSHConnection(connectionConfig);  // Use the same function for VPS
                    break;
                default:
                    return res.status(400).json({ message: 'Invalid connectionType' });
            }

            const userId = req.user.userId;
            const configString = JSON.stringify(connectionConfig);

            // Check for an existing connection in the database
            const existing = await HostingConnection.findOne({
                userId,
                connectionType,
                connectionConfig: configString
            });

            if (existing) {
                // If the connection already exists, update its status and updatedAt fields
                existing.status = 'success';
                existing.updatedAt = new Date();
                await existing.save();

                return res.status(200).json({
                    message: 'Connection already exists. Timestamp and status updated.',
                    data: existing
                });
            }

            // If the connection does not exist, create a new entry
            const saved = await HostingConnection.create({
                userId,
                connectionType,
                connectionConfig: configString,
                status: 'success'
            });

            // Create notification for super admins (only for own server types: vps, ssh, ftp, sftp)
            try {
                const ownServerTypes = ['vps', 'ssh', 'ftp', 'sftp'];
                if (ownServerTypes.includes(connectionType)) {
                    const user = await Users.findById(userId).select('email username').lean();
                    await Notification.create({
                        userFromId: userId,
                        isSuperAdminNotification: true,
                        message: `${user?.username || user?.email || 'User'} registered new ${connectionType.toUpperCase()} hosting on their own server`,
                        type: 'hosting_added',
                        relatedId: saved._id
                    });
                }
            } catch (notifError) {
                console.error('Error creating hosting notification:', notifError);
            }

            return res.status(200).json({
                message: 'Hosting connection added successfully.',
                data: saved
            });

        } catch (error) {
            console.error('Connection failed:', error);

            try {
                // Only log the failure without using 'unknown' or any extra fields
                await HostingConnection.create({
                    userId: req.user?.userId || null,
                    connectionType: req.body.connectionType, // Use the provided connectionType from the request
                    connectionConfig: typeof req.body.connectionConfig === 'string'
                        ? req.body.connectionConfig
                        : JSON.stringify(req.body.connectionConfig),
                    status: 'failed'
                });
            } catch (logError) {
                console.error('Failed to log failed hosting:', logError.message);
            }

            return res.status(500).json({
                message: 'Failed to add hosting connection.',
                error: error.message
            });
        }
    },

    getMyHostings: async (req, res) => {
        try {
            const hostings = await HostingConnection.find({
                userId: req.user.userId
            }).sort({ createdAt: -1 });

            console.log(hostings, "hostings")

            return res.status(200).json({
                message: 'Hosting connections fetched.',
                data: hostings
            });
        } catch (error) {
            console.error('Error in getMyHostings:', error);
            return res.status(500).json({ message: 'Failed to fetch hostings.', error: error.message });
        }
    }
    ,

    updateHosting: async (req, res) => {
        try {
            const { id } = req.params;
            let { connectionType, connectionConfig } = req.body;

            if (typeof connectionConfig === 'string') {
                connectionConfig = JSON.parse(connectionConfig);
            }

            const updateFields = {
                ...(connectionType && { connectionType }),
                ...(connectionConfig && { connectionConfig: JSON.stringify(connectionConfig) })
            };

            const updated = await HostingConnection.findByIdAndUpdate(id, updateFields, { new: true });

            if (!updated) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            return res.status(200).json({
                message: 'Hosting connection updated successfully.',
                data: updated
            });

        } catch (error) {
            console.error('Error in updateHosting:', error);
            return res.status(500).json({ message: 'Failed to update hosting.', error: error.message });
        }
    }
    ,
    deleteHosting: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await HostingConnection.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            return res.status(200).json({ message: 'Hosting connection deleted successfully.' });

        } catch (error) {
            console.error('Error in deleteHosting:', error);
            return res.status(500).json({ message: 'Failed to delete hosting.', error: error.message });
        }
    }
    ,

    setCurrentHostingForProject: async (req, res) => {
        try {
            const { projectId, hostingId } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing required fields (projectId or hostingId).' });
            }

            // Find the project by projectId
            const project = await UserProject.findById(projectId);

            if (!project) {
                return res.status(404).json({ message: 'Project not found.' });
            }

            // Update the hostingId for the project
            project.hostingId = hostingId;
            const updatedProject = await project.save();

            return res.status(200).json({
                message: 'Project hosting updated successfully.',
                data: updatedProject
            });

        } catch (error) {
            console.error('Error in setCurrentHostingForProject:', error);
            return res.status(500).json({
                message: 'Failed to update project hosting.',
                error: error.message
            });
        }
    }
    ,
    getCurrentHostingForProject: async (req, res) => {
        try {
            const { projectId } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: 'Missing projectId.' });
            }

            // Find the project by projectId and only select the hostingId field
            const project = await UserProject.findById(projectId).select('hostingId');

            if (!project) {
                return res.status(404).json({ message: 'Project not found.' });
            }

            // Return the hostingId of the project
            return res.status(200).json({
                message: 'Current hosting fetched successfully.',
                data: { hostingId: project.hostingId }
            });

        } catch (error) {
            console.error('Error in getCurrentHostingForProject:', error);
            return res.status(500).json({
                message: 'Failed to fetch current hosting for project.',
                error: error.message
            });
        }
    },

    getProjectConfiguration: async (req, res) => {
        try {
            const { projectId, hostingId, environment } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing required fields: projectId or hostingId.' });
            }

            const finalEnvironment = environment || 'development'; // Default to 'development' if no environment is provided

            // Fetch configurations for the given projectId and hostingId
            const configurations = await ProjectDeployment.findOne({
                projectId,
                hostingId,
                environment: finalEnvironment
            });

            // If no configurations are found, send a message saying so
            if (!configurations) {
                return res.status(404).json({ message: 'No configurations found for the given projectId and hostingId.' });
            }

            // Return the configurations if found
            return res.status(200).json({
                message: 'Configurations fetched successfully.',
                data: configurations
            });
        } catch (error) {
            console.error('Error in getProjectConfiguration:', error);
            return res.status(500).json({
                message: 'Failed to fetch configurations.',
                error: error.message
            });
        }
    }
    ,

    linkProjectToHosting: async (req, res) => {
        try {
            const { hostingId, projectId, domainName, rootPath, environment } = req.body;

            if (!hostingId || !projectId || !domainName) {
                return res.status(400).json({ message: 'Missing required fields.' });
            }

            const finalRootPath = rootPath || '/';
            const finalEnvironment = environment || 'development';

            // Check for duplicate project deployment
            const existing = await ProjectDeployment.findOne({
                hostingId,
                projectId,
                domainName,
                rootPath: finalRootPath,
                environment: finalEnvironment
            });

            if (existing) {
                existing.updatedAt = new Date();
                await existing.save();

                // Update the hostingId in UserProject
                const updatedProject = await UserProject.findByIdAndUpdate(
                    projectId,
                    { hostingId }, // Update the hostingId field
                    { new: true } // To return the updated project
                );

                return res.status(200).json({
                    message: 'Project already linked. Timestamp updated and hostingId updated in UserProject.',
                    data: existing,
                    updatedProject: updatedProject
                });
            }

            // Create new project deployment if not found
            const saved = await ProjectDeployment.create({
                hostingId,
                projectId,
                domainName,
                rootPath: finalRootPath,
                environment: finalEnvironment
            });

            // Update the hostingId in UserProject
            const updatedProject = await UserProject.findByIdAndUpdate(
                projectId,
                { hostingId },
                { new: true } // To return the updated project
            );

            return res.status(200).json({
                message: 'Project linked to hosting successfully. HostingId updated in UserProject.',
                data: saved,
                updatedProject: updatedProject
            });

        } catch (error) {
            console.error('Error in linkProjectToHosting:', error);
            return res.status(500).json({ message: 'Failed to link project.', error: error.message });
        }
    },

    getProjectDeploymentId: async (req, res) => {
        try {
            const { projectId, hostingId } = req.body;

            if (!projectId || !hostingId) {
                return res.status(400).json({ message: 'Missing projectId or hostingId.' });
            }

            console.log('Step 1: Searching for ProjectDeployment...');
            console.log(`Received projectId: ${projectId}, hostingId: ${hostingId}`);

            const deployment = await ProjectDeployment.findOne({ projectId, hostingId });

            if (!deployment) {
                console.log('Project deployment not found');
                return res.status(404).json({ message: 'Project deployment not found.' });
            }

            console.log('Project deployment found:', deployment._id);

            return res.status(200).json({
                message: 'Project deployment found.',
                data: {
                    projectDeploymentId: deployment._id,
                    domainName: deployment.domainName,
                    rootPath: deployment.rootPath,
                    environment: deployment.environment
                }
            });

        } catch (error) {
            console.error('Error in getProjectDeploymentId:', error);
            return res.status(500).json({ message: 'Failed to fetch project deployment.', error: error.message });
        }
    },


    getLinkedHostings: async (req, res) => {
        try {
            const { projectId } = req.params;

            if (!projectId) {
                return res.status(400).json({ message: 'Project ID is required.' });
            }

            const deployments = await ProjectDeployment.find({ projectId }).populate('hostingId');

            return res.status(200).json({
                message: 'Linked hostings/domains fetched.',
                data: deployments
            });

        } catch (error) {
            console.error('Error in getLinkedHostings:', error);
            return res.status(500).json({ message: 'Failed to fetch linked hostings.', error: error.message });
        }
    }
    ,
    updateLinkedHosting: async (req, res) => {
        try {
            const { id } = req.params;
            const { domainName, rootPath, environment } = req.body;

            const updateFields = {};
            if (domainName) updateFields.domainName = domainName;
            if (rootPath) updateFields.rootPath = rootPath;
            if (environment) updateFields.environment = environment;

            const updated = await ProjectDeployment.findByIdAndUpdate(id, updateFields, { new: true });

            if (!updated) {
                return res.status(404).json({ message: 'Linked hosting not found.' });
            }

            return res.status(200).json({
                message: 'Linked hosting updated successfully.',
                data: updated
            });

        } catch (error) {
            console.error('Error in updateLinkedHosting:', error);
            return res.status(500).json({ message: 'Failed to update linked hosting.', error: error.message });
        }
    },

    deleteLinkedHosting: async (req, res) => {
        try {
            const { id } = req.params;

            const deleted = await ProjectDeployment.findByIdAndDelete(id);

            if (!deleted) {
                return res.status(404).json({ message: 'Linked hosting not found.' });
            }

            return res.status(200).json({ message: 'Linked hosting deleted successfully.' });

        } catch (error) {
            console.error('Error in deleteLinkedHosting:', error);
            return res.status(500).json({ message: 'Failed to delete linked hosting.', error: error.message });
        }
    },

    uploadToHosting: async (req, res) => {
        try {
            const { projectDeploymentId } = req.body;

            if (!projectDeploymentId || !req.files || !req.files.zipFile) {
                return res.status(400).json({ message: 'Missing projectDeploymentId or zipFile.' });
            }

            const zipFile = req.files.zipFile;

            const tempZipPath = path.join(__dirname, '..', 'uploads', `${Date.now()}-${zipFile.name}`);
            await zipFile.mv(tempZipPath);

            const extractDir = tempZipPath.replace('.zip', '');
            await fs.promises.mkdir(extractDir, { recursive: true });
            await fs.createReadStream(tempZipPath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .promise();

            const deployment = await ProjectDeployment.findById(projectDeploymentId);
            if (!deployment) return res.status(404).json({ message: 'Project deployment not found.' });

            const hosting = await HostingConnection.findById(deployment.hostingId);
            if (!hosting) return res.status(404).json({ message: 'Hosting connection not found.' });

            const config = JSON.parse(hosting.connectionConfig);
            const rootPath = deployment.rootPath || '/';

            if (hosting.connectionType === 'ftp') {
                const client = new ftp.Client();
                await client.access({
                    host: config.host,
                    user: config.username,
                    password: config.password,
                    port: config.port || 21,
                    secure: config.secure || false
                });
                await uploadFolderFTP(client, extractDir, rootPath);
                client.close();

            } else if (hosting.connectionType === 'ssh') {
                const sftp = new SftpClient();
                await sftp.connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password
                });
                await uploadFolderSFTP(sftp, extractDir, rootPath);
                await sftp.end();

            } else if (hosting.connectionType === 'cpanel') {

                await uploadToCPanel(config, extractDir, deployment.rootPath || '/public_html');


            } else {
                return res.status(400).json({ message: 'Only FTP, SSH and cPanel are supported for upload.' });
            }

            fs.unlinkSync(tempZipPath);
            fs.rmSync(extractDir, { recursive: true, force: true });

            return res.status(200).json({ message: 'Upload and deployment successful.' });

        } catch (error) {
            console.error('Upload error:', error);
            return res.status(500).json({ message: 'Upload failed.', error: error.message });
        }
    },

    browseHostingDirectories: async (req, res) => {
        let { hostingId, path: browsePath } = req.body;

        // Handle empty path or "/"
        if (browsePath === "" || browsePath === "/") {
            browsePath = undefined; // Set path to undefined or omit it from the operations
        }

        console.log(browsePath);

        console.log(req.body, "browseHostingDirectories console");

        if (!hostingId) {
            return res.status(400).json({ message: 'Missing hostingId.' });
        }

        try {
            const hosting = await HostingConnection.findById(hostingId);
            if (!hosting) {
                return res.status(404).json({ message: 'Hosting not found.' });
            }

            const config = JSON.parse(hosting.connectionConfig);

            if (hosting.connectionType === 'ftp') {
                const client = new ftp.Client();
                await client.access({
                    host: config.host,
                    user: config.username,
                    password: config.password,
                    port: config.port || 21,
                    secure: config.secure || false
                });

                // If browsePath is undefined, use the default root path
                browsePath = browsePath || '/';
                const list = await client.list(browsePath);
                const directories = list.filter(item => item.isDirectory).map(dir => ({
                    name: dir.name,
                    fullPath: path.posix.join(browsePath, dir.name) // Using path.posix
                }));

                client.close();

                return res.status(200).json({
                    message: 'Directories fetched successfully.',
                    data: directories
                });

            } else if (hosting.connectionType === 'ssh' || hosting.connectionType === "vps") {
                const sftp = new SftpClient();
                await sftp.connect({
                    host: config.host,
                    port: config.port || 22,
                    username: config.username,
                    password: config.password,
                    privateKey: config.privateKey // optional if provided
                });

                // If browsePath is undefined, use the default root path
                browsePath = browsePath || '/';
                const list = await sftp.list(browsePath);
                const directories = list.filter(item => item.type === 'd').map(dir => ({
                    name: dir.name,
                    fullPath: path.posix.join(browsePath, dir.name) // Using path.posix
                }));

                await sftp.end();

                return res.status(200).json({
                    message: 'Directories fetched successfully.',
                    data: directories
                });

            } else {
                return res.status(400).json({ message: 'Directory browsing is supported only for FTP and SSH.' });
            }

        } catch (error) {
            console.error('Error in browseHostingDirectories:', error);
            return res.status(500).json({
                message: 'Failed to browse directories.',
                error: error.message
            });
        }
    },
    // AdminController.js
    uploadToHostingFromBuild: async (req, res) => {
        const io = req.app.get('io');

        const { projectDeploymentId, projectId } = req.body;

        if (!projectDeploymentId || !projectId) {
            console.log("[Error] Missing projectDeploymentId or projectId in request body.");
            return res.status(400).json({ message: 'Missing projectDeploymentId or projectId.' });
        }

        // ✅ Immediately respond to the client
        res.status(200).json({ message: 'Deployment started.' });

        // 🚀 Continue deployment in the background
        (async () => {
            try {
                console.log('Step 1: Starting deployment process...');
                console.log(`Received projectDeploymentId: ${projectDeploymentId}, projectId: ${projectId}`);

                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "building" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "building",
                });

                let distPath;
                try {
                    distPath = await deployReactApp(projectDeploymentId, projectId);
                    console.log('Step 2: Deployment completed. dist folder generated at:', distPath);

                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "uploading" });
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "uploading",
                    });
                } catch (buildErr) {
                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "build_failed" });
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "build_failed",
                    });
                    console.error('[Error] During build/deployReactApp:', buildErr);
                    return;
                }

                let deployment;
                try {
                    deployment = await ProjectDeployment.findById(projectDeploymentId);
                    if (!deployment) {
                        console.log("[Error] Project deployment not found for ID:", projectDeploymentId);
                        return;
                    }
                    console.log("Step 3: ProjectDeployment found:", deployment._id);
                } catch (depErr) {
                    console.error('[Error] During ProjectDeployment.findById:', depErr);
                    return;
                }

                let hosting;
                try {
                    hosting = await HostingConnection.findById(deployment.hostingId);
                    if (!hosting) {
                        console.log("[Error] Hosting connection not found for ID:", deployment.hostingId);
                        return;
                    }
                    console.log("Step 4: HostingConnection found:", hosting._id);
                } catch (hostErr) {
                    console.error('[Error] During HostingConnection.findById:', hostErr);
                    return;
                }

                let config, rootPath;
                try {
                    config = JSON.parse(hosting.connectionConfig);
                    // Calculate rootPath from domainName to ensure it's always correct
                    // This fixes the issue where rootPath might point to old domain's directory
                    if (deployment.domainName && hosting.connectionType === 'vps') {
                        // For VPS, use the standard webroot path: /var/www/ai/{domainName}
                        const WEBROOT_BASE = "/var/www/ai";
                        rootPath = path.join(WEBROOT_BASE, deployment.domainName);
                    } else {
                        // For other hosting types, use stored rootPath or default
                        rootPath = deployment.rootPath || '/';
                    }
                    console.log("Step 5: Hosting config and rootPath loaded.", { rootPath, domainName: deployment.domainName });
                } catch (confErr) {
                    console.error('[Error] Parsing connectionConfig:', confErr);
                    return;
                }

                // Step 6: Upload based on connection type
                try {
                    console.log('Step 6: Uploading dist folder content to hosting...');

                    if (hosting.connectionType === 'ftp') {
                        const client = new ftp.Client();
                        try {
                            await client.access({
                                host: config.host,
                                user: config.username,
                                password: config.password,
                                secure: config.secure || false,
                                port: config.port || 21
                            });
                            console.log("FTP connection established.");
                            await uploadFolderFTP(client, distPath, rootPath);
                            console.log("FTP upload complete.");
                        } catch (ftpErr) {
                            console.error('[Error] During FTP upload:', ftpErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        } finally {
                            client.close();
                        }

                    } else if (hosting.connectionType === 'ssh' || hosting.connectionType === 'vps') {
                        const sftp = new SftpClient();
                        try {
                            await sftp.connect({
                                host: config.host,
                                port: config.port || 22,
                                username: config.username,
                                password: config.password
                            });
                            console.log("SFTP connection established.");
                            await uploadFolderSFTP(sftp, distPath, rootPath);
                            console.log("SFTP upload complete.");
                        } catch (sftpErr) {
                            console.error('[Error] During SFTP upload:', sftpErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        } finally {
                            await sftp.end().catch(() => { });
                        }

                    } else if (hosting.connectionType === 'cpanel') {
                        try {
                            await uploadFolderCPanel(config, distPath, rootPath);
                            console.log("cPanel upload complete.");
                        } catch (cpanelErr) {
                            console.error('[Error] During cPanel upload:', cpanelErr);
                            await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                            io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                                projectId,
                                status: "upload_failed",
                            });
                            return;
                        }

                    } else {
                        console.log("[Error] Unsupported hosting type:", hosting.connectionType);
                        return;
                    }

                } catch (uploadErr) {
                    console.error('[Error] During upload process:', uploadErr);
                    await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                    io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                        projectId,
                        status: "upload_failed",
                    });
                    return;
                }

                // Step 7: Cleanup
                try {
                    await fs.remove(path.resolve(__dirname, '..', 'deploy-temp', projectDeploymentId));
                    console.log("Temporary folder deleted after deployment.");
                } catch (deleteErr) {
                    console.warn('[Warning] Temp folder deletion failed:', deleteErr);
                }

                // Final Success
                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "success" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "success",
                });
                console.log("Step 8: Build, upload, and deployment successful!");

                // Create success notification for user
                try {
                    const project = await userProjects.findById(projectId).select('userId projectName domainName').lean();
                    if (project && project.userId) {
                        await Notification.create({
                            userToId: project.userId,
                            message: `Your project "${project.projectName}" is now live${project.domainName ? ' on ' + project.domainName : ''}!`,
                            type: 'project_live',
                            relatedId: projectId
                        });
                    }
                } catch (notifError) {
                    console.error('Error creating project live notification:', notifError);
                }

            } catch (fatalError) {
                console.error('[Fatal Error] Unexpected failure during deployment:', fatalError);
                await ProjectDeployment.findByIdAndUpdate(projectDeploymentId, { deploymentStatus: "upload_failed" });
                io.to(`project_${projectId}`).emit('projectStatusUpdate', {
                    projectId,
                    status: "upload_failed",
                });

                // Create failure notification for user
                try {
                    const project = await userProjects.findById(projectId).select('userId projectName').lean();
                    if (project && project.userId) {
                        await Notification.create({
                            userToId: project.userId,
                            message: `Your project "${project.projectName}" failed to publish. Please check the deployment logs.`,
                            type: 'project_failed',
                            relatedId: projectId
                        });
                    }
                } catch (notifError) {
                    console.error('Error creating project failed notification:', notifError);
                }
            }
        })();
    },



    // Assume uploadFileCPanel is defined similarly to uploadFolderCPanel but for a single file
    // If not, implement it based on cPanel API or treat as FTP

    updateHostingSitemap: async (req, res) => {
        const io = req.app.get('io');
        const { projectId } = req.body;

        if (!projectId) {
            return res.status(400).json({ message: 'projectId is required' });
        }




        try {
            await axios.post(
                'https://apis.smartlybuild.dev/admin/v1/generateSitemap',
                { projectId }, // JSON body
                {

                    timeout: 10000
                }
            );
        } catch (e) {
            console.warn('Generate sitemap update call failed from updatehostingsitemap api:', e?.response?.data || e.message);
        }


        // Immediately respond to the client
        res.status(200).json({ message: 'Sitemap update started.' });

        // Continue in the background
        (async () => {
            try {
                // Fetch UserProject details
                const project = await UserProject.findById(projectId).select('hostingId siteHostRootPath siteMapFilePath');
                if (!project) {
                    console.log("[Error] Project not found for ID:", projectId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }
                if (!project.hostingId) {
                    console.log("[Error] No hostingId found for project:", projectId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }

                // Update ProjectDeployment status
                const deployment = await ProjectDeployment.findOne({ projectId, deploymentStatus: 'success' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'uploading' });
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'uploading' });
                }

                // Fetch HostingConnection
                const hosting = await HostingConnection.findById(project.hostingId);
                if (!hosting) {
                    console.log("[Error] Hosting connection not found for ID:", project.hostingId);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    return;
                }

                let config;
                try {
                    config = JSON.parse(hosting.connectionConfig);
                } catch (parseErr) {
                    console.error('[Error] Parsing connectionConfig:', parseErr);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                // Calculate rootPath from domainName for VPS to ensure it's always correct
                let rootPath;
                if (deployment && deployment.domainName && hosting.connectionType === 'vps') {
                    // For VPS, use the standard webroot path: /var/www/ai/{domainName}
                    const WEBROOT_BASE = "/var/www/ai";
                    rootPath = path.join(WEBROOT_BASE, deployment.domainName);
                } else {
                    // For other hosting types, use stored siteHostRootPath or default
                    rootPath = project.siteHostRootPath || '/';
                }

                // Local sitemap path
                const sitemapRelativePath = project.siteMapFilePath ? project.siteMapFilePath.replace(/^\//, '') : `sitemaps/${projectId}/sitemap.xml`;
                const sitemapLocalPath = path.join(__dirname, '..', 'public', sitemapRelativePath);

                // Console log for where we are fetching the sitemap from
                console.log(`[Info] Fetching sitemap from: ${sitemapLocalPath}`);

                if (!fs.existsSync(sitemapLocalPath)) {
                    console.log("[Error] Sitemap file not found locally at:", sitemapLocalPath);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                // Remote destination path
                const remoteSitemapPath = path.posix.join(rootPath, 'sitemap.xml');

                // Console log for where we are uploading the sitemap to
                console.log(`[Info] Uploading sitemap to: ${remoteSitemapPath}`);

                // Upload based on connection type
                console.log('Uploading sitemap.xml to hosting...');

                if (hosting.connectionType === 'ftp') {
                    const client = new ftp.Client();
                    try {
                        await client.access({
                            host: config.host,
                            user: config.username,
                            password: config.password,
                            secure: config.secure || false,
                            port: config.port || 21
                        });
                        await client.uploadFrom(sitemapLocalPath, remoteSitemapPath);
                        console.log("FTP upload complete.");
                    } catch (ftpErr) {
                        console.error('[Error] During FTP upload:', ftpErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    } finally {
                        client.close();
                    }

                } else if (hosting.connectionType === 'ssh' || hosting.connectionType === 'vps') {
                    const sftp = new SftpClient();
                    try {
                        await sftp.connect({
                            host: config.host,
                            port: config.port || 22,
                            username: config.username,
                            password: config.password
                        });
                        await sftp.put(sitemapLocalPath, remoteSitemapPath);
                        console.log("SFTP upload complete.");
                    } catch (sftpErr) {
                        console.error('[Error] During SFTP upload:', sftpErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    } finally {
                        await sftp.end().catch(() => { });
                    }

                } else if (hosting.connectionType === 'cpanel') {
                    try {
                        await uploadFileCPanel(config, sitemapLocalPath, remoteSitemapPath);
                        console.log("cPanel upload complete.");
                    } catch (cpanelErr) {
                        console.error('[Error] During cPanel upload:', cpanelErr);
                        io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                        if (deployment) {
                            await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                        }
                        return;
                    }

                } else {
                    console.log("[Error] Unsupported hosting type:", hosting.connectionType);
                    io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                    if (deployment) {
                        await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                    }
                    return;
                }

                console.log("Sitemap update successful!");
                io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'success' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'success' });
                }

            } catch (error) {
                console.error('[Error] During sitemap update:', error);
                io.to(`project_${projectId}`).emit('sitemapUpdate', { projectId, status: 'failed' });
                if (deployment) {
                    await ProjectDeployment.findByIdAndUpdate(deployment._id, { deploymentStatus: 'upload_failed' });
                }
            }
        })();
    },




    generateSitemap: async (req, res) => {
        try {
            const projectId = req.query.projectId || req.body.projectId;
            if (!projectId) {
                return res.status(400).json({ message: 'projectId is required' });
            }

            // Helpers
            const normalizeHostname = (input) => {
                let v = String(input || '').trim();
                if (!v) return null;
                try {
                    if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
                    const { hostname } = new URL(v);
                    if (!hostname || !/^[a-z0-9.-]+$/i.test(hostname)) return null;
                    return hostname.toLowerCase().replace(/\.$/, '');
                } catch {
                    return null

                        ;
                }
            };
            const escapeXml = (str) =>
                String(str)
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&apos;');

            // 0) Get domain from project
            const proj = await UserProject.findById(projectId).select('domainName').lean();
            if (!proj) return res.status(404).json({ message: 'Project not found' });
            const host = normalizeHostname(proj.domainName);
            if (!host) return res.status(400).json({ message: 'Invalid or missing domainName on project' });

            // Validate projectId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ message: 'Invalid projectId format' });
            }

            // 1) Location slugs - with error handling
            let locationSlugs = [];
            try {
                const slugs = await Slug.distinct('slug', { projectId: new mongoose.Types.ObjectId(projectId) });
                locationSlugs = [...new Set(
                    slugs
                        .filter(s => typeof s === 'string' && s.trim())
                        .map(s => `/${s.trim().replace(/^\/+/, '')}`)
                        .sort((a, b) => a.localeCompare(b))
                )];
            } catch (err) {
                console.error('Error fetching location slugs:', err);
                // Continue with empty array if location slugs fail
                locationSlugs = [];
            }

            // 1a) Blog slugs - with error handling and null checks
            let blogSlugs = [];
            try {
                const blogs = await Blog.find({ projectId: new mongoose.Types.ObjectId(projectId) })
                    .select('slug oldSlugs')
                    .lean();

                blogSlugs = [
                    ...new Set(
                        blogs
                            .filter(blog => blog && blog.slug) // Filter out null/undefined blogs
                            .flatMap(blog => {
                                const slugs = [`/blog/${blog.slug}`];
                                // Safely handle oldSlugs - might be null, undefined, or empty array
                                if (blog.oldSlugs && Array.isArray(blog.oldSlugs) && blog.oldSlugs.length > 0) {
                                    slugs.push(...blog.oldSlugs
                                        .filter(oldSlug => oldSlug && typeof oldSlug === 'string' && oldSlug.trim())
                                        .map(oldSlug => `/blog/${oldSlug.trim()}`)
                                    );
                                }
                                return slugs;
                            })
                    )
                ];
            } catch (err) {
                console.error('Error fetching blog slugs:', err);
                // Continue with empty array if blog slugs fail
                blogSlugs = [];
            }

            console.log('Blog slugs:', blogSlugs);

            // 2) Static pages
            const staticSlugs = [
                "/",
                "/privacy-policy",
                "/about",
                "/contact",
                "/terms-conditions",
                "/services",
                "/areas"
            ];

            // 3) Service slugs - with error handling
            let serviceSlugs = [];
            try {
                const serviceNames = await Service.distinct('service_name', { projectId: new mongoose.Types.ObjectId(projectId) });
                serviceSlugs = serviceNames
                    .map(s => String(s).trim())
                    .filter(Boolean)
                    .map(name => slugify(name));
            } catch (err) {
                console.error('Error fetching service slugs:', err);
                // Continue with empty array if service slugs fail
                serviceSlugs = [];
            }

            // 3a) /services/<service>
            const servicePageSlugs = serviceSlugs.map(s => `/services/${s}`);

            // 3b) <location>/services/<service>
            const locationServiceSlugs = locationSlugs.flatMap(loc =>
                serviceSlugs.map(s => `${loc.replace(/\/$/, '')}/services/${s}`)
            );

            // 4) Combine and de-dupe - ensure all arrays are valid
            const allSlugs = [...new Set([
                ...staticSlugs,
                ...(locationSlugs || []),
                ...(blogSlugs || []),
                ...(servicePageSlugs || []),
                ...(locationServiceSlugs || [])
            ].filter(Boolean))]; // Filter out any null/undefined values


            console.log('All slugs for sitemap:', allSlugs);

            // 5) Generate sitemap.xml - with validation
            const baseUrl = `https://${host}`;
            const now = new Date().toISOString();

            // Filter out invalid routes and generate XML
            const urlsXml = allSlugs
                .filter(route => route && typeof route === 'string' && route.trim()) // Ensure route is valid string
                .map(route => {
                    try {
                        const cleanRoute = route.trim();
                        const loc = cleanRoute === '/' ? baseUrl : `${baseUrl}${cleanRoute}`;
                        const priority = cleanRoute === '/' ? '1.0' : '0.8';
                        return (
                            `<url>` +
                            `<loc>${escapeXml(loc)}</loc>` +
                            `<lastmod>${escapeXml(now)}</lastmod>` +
                            `<changefreq>weekly</changefreq>` +
                            `<priority>${escapeXml(priority)}</priority>` +
                            `</url>`
                        );
                    } catch (err) {
                        console.error(`Error generating XML for route ${route}:`, err);
                        return ''; // Skip invalid routes
                    }
                })
                .filter(Boolean) // Remove empty strings from failed routes
                .join('');

            const xml =
                `<?xml version="1.0" encoding="UTF-8"?>` +
                `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
                urlsXml +
                `</urlset>`;

            // 6) Upload sitemap.xml - convert XML string to Buffer
            // uploadFile expects Buffer, not a string stream
            const xmlBuffer = Buffer.from(xml, 'utf8');
            const file = {
                name: 'sitemap.xml',
                mimetype: 'application/xml',
                buffer: xmlBuffer // Pass Buffer directly instead of stream
            };
            const folderPath = `public/sitemaps/${projectId}`; // project-specific folder
            const fileName = 'sitemap.xml'; // Fixed filename
            await helper.uploadFile(file, folderPath, res, { overwrite: true }); // Modified to allow overwrite

            const filePath = `/sitemaps/${projectId}/${fileName}`;

            // 7) Save sitemap path to UserProject
            await UserProject.findByIdAndUpdate(
                projectId,
                { siteMapFilePath: filePath },
                { new: true }
            );

            return res.status(200).json({
                message: 'Sitemap generated',
                slugs: allSlugs,
                sitemap: {
                    fileName,
                    filePath
                }
            });
        } catch (err) {
            console.error('Error fetching sitemap slugs:', err);
            return res.status(500).json({ message: 'Server error while fetching sitemap slugs' });
        }
    },

    updateProjectDomain: async (req, res) => {
        try {
            function normalizeDomain(input) {
                let v = String(input || '').trim();
                if (!v) return null;
                try {
                    if (!/^https?:\/\//i.test(v)) v = `http://${v}`;
                    const { hostname } = new URL(v);
                    if (!hostname || !/^[a-z0-9.-]+$/i.test(hostname)) return null;
                    return hostname.toLowerCase().replace(/\.$/, '');
                } catch {
                    return null;
                }
            }
            const { projectId, domainName } = req.body;
            if (!projectId) return res.status(400).json({ message: 'projectId is required' });
            if (!domainName) return res.status(400).json({ message: 'domainName is required' });

            const project = await UserProject.findById(projectId);
            if (!project) return res.status(404).json({ message: 'Project not found' });

            const normalized = normalizeDomain(domainName);
            if (!normalized) return res.status(400).json({ message: 'Invalid domain format' });

            // Optional uniqueness check (uncomment if you want domain to be unique)
            // const exists = await UserProject.findOne({ domainName: normalized, _id: { $ne: projectId } });
            // if (exists) return res.status(409).json({ message: 'Domain already in use' });

            project.domainName = normalized;
            await project.save();

            return res.status(200).json({
                message: 'Domain updated successfully',
                data: { projectId: project._id, domainName: project.domainName }
            });
        } catch (err) {
            console.error('Error updating project domain:', err);
            return res.status(500).json({ message: 'Server error while updating domain' });
        }
    },


    getOurHostedDetails: async (req, res) => {
        try {
            let { id } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Project id is required' });
            }

            // If not already ObjectId but is valid string, convert
            if (!isValidObjectId(id)) {
                return res.status(400).json({ error: 'Invalid project id' });
            }
            if (!(id instanceof Types.ObjectId)) {
                id = new Types.ObjectId(id);
            }

            const proj = await UserProject.findById(id)
                .select('domainName siteHostRootPath')
                .lean();

            if (!proj) {
                return res.status(404).json({ error: 'Project not found' });
            }

            const domain = proj.domainName || null;
            const root = proj.siteHostRootPath || '/';

            return res.json({ domain, root });
        } catch (err) {
            console.error('getOurHostedDetails error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getDeployInfo: async (req, res) => {
        try {
            const { projectId } = req.body;
            const { environment } = req.body;

            if (!mongoose.Types.ObjectId.isValid(projectId)) {
                return res.status(400).json({ error: 'Invalid projectId' });
            }

            // Build the query for ProjectDeployment
            const query = { projectId };
            if (environment) query.environment = environment; // optional filter

            // Get the latest deployment for this project (optionally per environment)
            const deployment = await ProjectDeployment.findOne(query)
                .sort({ createdAt: -1 }) // latest if multiple exist
                .select('domainName rootPath hostingId _id')
                .populate({ path: 'hostingId', select: 'isOur connectionType' })
                .lean();

            if (!deployment) {
                return res.status(404).json({ error: 'No deployment found for the given projectId' });
            }

            const hosting = deployment.hostingId || {};

            return res.json({
                projectId,
                projectDeploymentId: deployment._id,


                domainName: deployment.domainName,
                rootPath: deployment.rootPath,
                connectionType: hosting.connectionType ?? null,
                isOur: typeof hosting.isOur === 'boolean' ? hosting.isOur : null,
            });
        } catch (err) {
            console.error('deployment-info error:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    },
    checkDomain: async (req, res) => {
        try {

            const { domainName } = req.body;




            // Get the latest deployment for this project (optionally per environment)
            const deployment = await ProjectDeployment.findOne({
                domainName: domainName.trim(),
            }).populate('projectId', 'projectName').lean();

            if (!deployment) {
                return res.status(200).json({ message: 'This domain is available to use' });
            }

            // Domain exists in another project - return conflict with options
            const conflictingProjectId = deployment.projectId?._id || deployment.projectId;
            const existingProjectName = deployment.projectId?.projectName || 'Unknown Project';

            // Convert to string if it's an ObjectId
            const existingProjectIdString = String(conflictingProjectId);

            return res.status(409).json({
                ok: false,
                error: 'Domain already exists in another project',
                domain: domainName.trim(),
                existingProject: {
                    projectId: existingProjectIdString,
                    projectName: existingProjectName
                },
                options: {
                    unlink: {
                        action: 'unlink',
                        message: 'Unlink this domain from the other project and connect it here',
                        api: '/admin/v1/unlinkDomain',
                        requiredParams: { projectId: existingProjectIdString, domainName: domainName.trim() }
                    },
                    useAnother: {
                        action: 'useAnother',
                        message: 'Use a different domain for this project'
                    }
                }
            });



        } catch (error) {
            console.log(error, "hey error!!")
            return res.status(500).json({ error: 'Server error' });

        }
    },

    getProjectLocationsHierarchy: async (req, res) => {
        try {
            const projectId = req.query.projectId || req.body.projectId;
            if (!projectId) return res.status(400).json({ message: "projectId is required" });

            const proj = await UserProject.findById(projectId, {
                "locations.country": 1,
                "locations.state": 1,
                "locations.city": 1,
                "locations.localArea": 1,
            }).lean();

            if (!proj) return res.status(404).json({ message: "Project not found" });

            const loc = proj.locations || {};
            const countries = Array.isArray(loc.country) ? loc.country : [];
            const states = Array.isArray(loc.state) ? loc.state : [];
            const cities = Array.isArray(loc.city) ? loc.city : [];
            const locals = Array.isArray(loc.localArea) ? loc.localArea : [];

            // Only treat explicit status===1 (or "1"/true) as active.
            const isActive = (x) => x?.status === 1 || x?.status === "1" || x?.status === true;
            const hasName = (x) => typeof x?.name === "string" && x.name.trim().length > 0;

            // Maps of ALL (for parent lookup even if parent is inactive)
            const allStatesById = states.reduce((m, s) => {
                const id = String(s.stateId || "");
                if (id) m[id] = s;
                return m;
            }, {});
            const allCitiesById = cities.reduce((m, c) => {
                const id = String(c.cityId || "");
                if (id) m[id] = c;
                return m;
            }, {});

            // Active, named only (these are the nodes we will show)
            const A_COUNTRY = countries.filter((c) => isActive(c) && hasName(c));
            const A_STATE = states.filter((s) => isActive(s) && hasName(s));
            const A_CITY = cities.filter((c) => isActive(c) && hasName(c));
            const A_LOCAL = locals.filter((l) => isActive(l) && hasName(l));

            // Node registries
            const countryNodesById = {};
            const stateNodesById = {};
            const cityNodesById = {};
            const roots = [];

            // Countries → roots
            for (const c of A_COUNTRY) {
                const node = { name: c.name, id: String(c.countryId || ""), children: [] };
                countryNodesById[node.id] = node;
                roots.push(node);
            }

            // States → attach to active country if exists; else become root
            for (const s of A_STATE) {
                const node = { name: s.name, id: String(s.stateId || ""), children: [] };
                stateNodesById[node.id] = node;
                const parentCountry = countryNodesById[String(s.countryId || "")];
                if (parentCountry) parentCountry.children.push(node);
                else roots.push(node);
            }

            // Cities → attach to active state; else to active country via its (possibly inactive) state; else root
            for (const c of A_CITY) {
                const node = { name: c.name, id: String(c.cityId || ""), children: [] };
                cityNodesById[node.id] = node;

                const sId = String(c.stateId || "");
                const activeState = stateNodesById[sId];
                if (activeState) {
                    activeState.children.push(node);
                    continue;
                }

                const stateRec = allStatesById[sId]; // may be inactive
                const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
                if (activeCountry) activeCountry.children.push(node);
                else roots.push(node);
            }

            // Locals → attach to active city; else climb to state (active) or country (active); else root
            for (const l of A_LOCAL) {
                const node = { name: l.name, id: String(l.localAreaId || ""), children: [] };

                const cId = String(l.cityId || "");
                const activeCity = cityNodesById[cId];
                if (activeCity) {
                    activeCity.children.push(node);
                    continue;
                }

                const cityRec = allCitiesById[cId]; // may be inactive
                const sId = String(cityRec?.stateId || "");
                const activeState = stateNodesById[sId];
                if (activeState) {
                    activeState.children.push(node);
                    continue;
                }

                const stateRec = allStatesById[sId]; // may be inactive
                const activeCountry = stateRec && countryNodesById[String(stateRec.countryId || "")];
                if (activeCountry) activeCountry.children.push(node);
                else roots.push(node);
            }

            // Sort by name at every level
            const sortRec = (n) => {
                if (!n.children?.length) return;
                n.children.sort((a, b) => a.name.localeCompare(b.name));
                n.children.forEach(sortRec);
            };
            roots.sort((a, b) => a.name.localeCompare(b.name));
            roots.forEach(sortRec);

            return res.status(200).json({ message: "OK", data: roots });
        } catch (err) {
            console.error("getProjectLocationsHierarchy error:", err);
            return res.status(500).json({ message: "Failed to fetch project locations" });
        }
    },

    // Generate AI service names (preview only, no DB writes)
    genrateAiProjectServices: async (req, res) => {
        try {
            let { projectId, count } = req.body || {};
            if (!projectId) return res.status(400).json({ message: "projectId is required" });
            const n = Math.max(1, Math.min(Number(count) || 10, 50));

            // Load project context
            const project = await UserProject.findById(projectId).lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            // Existing service names to exclude
            const existingServices = await Service.find({ projectId }).select('serviceName').lean();
            const excludeNames = (existingServices || [])
                .map(s => (s.serviceName || '').toString().trim())
                .filter(Boolean);

            const uniq = (arr) => Array.from(new Set(arr.map(v => (v || '').toString().trim().toLowerCase())));
            const excludeSet = new Set(uniq(excludeNames));

            const focusKeyword = project.focusKeyword || project.focusedKeyword || '';
            const mainKeywords = Array.isArray(project.mainKeywords) ? project.mainKeywords.join(', ') : (project.mainKeywords || '');
            const mainCategory = project.mainCategory || project.serviceType || '';
            const categories = Array.isArray(project.categories) ? project.categories : (project.category ? [project.category] : []);
            const subcategories = Array.isArray(project.subcategories) ? project.subcategories : [];

            const excludeListForPrompt = excludeNames.slice(0, 100); // cap to keep prompt short

            const prompt = `You are an expert content strategist for home/local services websites.
            Project: ${project.projectName || ''}
            Primary Service Type / Main Category: ${mainCategory}
            Focus Keyword: ${focusKeyword}
            Main Keywords: ${mainKeywords}
            Categories: ${categories.join(', ')}
            Subcategories: ${subcategories.join(', ')}
            Exclude service names (avoid duplicates, synonyms, close variants): ${excludeListForPrompt.join(' | ') || 'None'}

            TASK: Generate EXACTLY ${n} unique, concise service names relevant to the project and category.
            Rules:
            - Return ONLY a JSON array of strings (no prose, no keys).
            - No duplicates, no near-duplicates, no trademarked brands.
            - Each name 2–6 words, title case, no punctuation at end.
            - Avoid generic words-only lists; keep them specific to ${mainCategory || 'the niche'}.
            `;

            let services;
            try {
                services = await fetchJSONFromOpenAI(
                    prompt,
                    'GENERATE_AI_SERVICE_NAMES',
                    {
                        userId: project.userId?.toString?.() || '',
                        projectId: project._id?.toString?.() || projectId,
                        promptFrom: 'controller',
                        promptFor: 'Service Names Preview'
                    }
                );
            } catch (e) {
                return res.status(500).json({ message: 'AI generation failed', error: e.message });
            }

            if (!Array.isArray(services)) services = [];
            // Sanitize and enforce uniqueness/excludes
            const cleaned = [];
            const seen = new Set();
            for (const raw of services) {
                const name = (raw || '').toString().trim();
                if (!name) continue;
                const key = name.toLowerCase();
                if (seen.has(key)) continue;
                if (excludeSet.has(key)) continue;
                seen.add(key);
                cleaned.push(name.replace(/\s+/g, ' '));
                if (cleaned.length >= n) break;
            }

            return res.status(200).json({ services: cleaned, countRequested: n, countReturned: cleaned.length });
        } catch (error) {
            console.error('Error in genrateAiProjectServices:', error);
            return res.status(500).json({ message: 'Server error while generating AI services' });
        }
    },

    // Controller: generateBlogTitles (refactored & hardened)
    generateBlogTitles: async (req, res) => {
        try {
            // -------- inputs --------
            let { projectId, style, count, locations } = req.body;
            if (!projectId) return res.status(400).json({ message: "projectId is required" });

            const styleText = String(style || "").trim();
            if (!styleText) {
                return res.status(400).json({ message: "style is required (e.g., 'vs', 'why', 'how to', ...)" });
            }

            // 1..100 (default 8)
            const n = Math.min(Math.max(Number(count) || 8, 1), 100);

            // -------- helpers --------
            const toArray = (val) => {
                if (val == null) return [];
                if (typeof val === "string") {
                    try {
                        const parsed = JSON.parse(val);
                        if (Array.isArray(parsed)) return parsed;
                    } catch { /* fall through */ }
                    return String(val)
                        .split(/[\n,]+/g)
                        .map(s => s.trim())
                        .filter(Boolean);
                }
                return Array.isArray(val) ? val : [val];
            };

            const unique = (arr) => Array.from(new Set(arr));

            const WORDS_MAJOR = new Set([
                // Words to Title Case even if short
                "AI", "API", "SEO", "PPC", "FAQ", "ROI", "KPI", "B2B", "B2C"
            ]);

            const SMALL_WORDS = new Set([
                "a", "an", "and", "as", "at", "but", "by", "for", "in", "nor", "of", "on", "or", "per", "to", "via", "the", "vs", "vs."
            ]);

            const titleCase = (s) => {
                const parts = s.toLowerCase().replace(/\s+/g, " ").trim().split(" ");
                return parts.map((w, i) => {
                    if (WORDS_MAJOR.has(w.toUpperCase())) return w.toUpperCase();
                    if (i === 0 || i === parts.length - 1) return w.charAt(0).toUpperCase() + w.slice(1);
                    if (SMALL_WORDS.has(w)) return w;
                    return w.charAt(0).toUpperCase() + w.slice(1);
                }).join(" ");
            };

            // Detects cut-off endings like "Mainta", "Optimiza", "Configu"
            const isLikelyIncomplete = (t) => {
                const trimmed = t.trim();
                // Ends with a single unfinished token of 3–7 letters and no punctuation
                const m = trimmed.match(/([A-Za-z]{3,7})$/);
                if (!m) return false;
                const last = m[1].toLowerCase();
                // Whitelist common complete words to avoid false positives
                const commonWhole = new Set([
                    "guide", "faq", "tips", "vs", "versus", "case", "study", "checklist", "plan", "guide:", "myth", "myths", "facts"
                ]);
                if (commonWhole.has(last)) return false;

                // If the token looks like a stem of a longer known word, treat as incomplete
                const suspiciousStems = [/maint[a-z]?$/, /optimiza?$/, /configu?$/, /compli?$/, /securi?$/, /perfor?$/, /strateg?$/, /analyt?$/, /marketi?$/, /implementa?$/, /automati?$/];
                return suspiciousStems.some(rx => rx.test(last));
            };

            const wordCount = (t) => t.trim().split(/\s+/).filter(Boolean).length;

            const styleRule = (() => {
                const s = styleText.toLowerCase();
                if (/(^|\s)(vs|versus|comparison|compare)(\s|$)/.test(s)) {
                    return { kind: "vs", note: `ALL titles MUST be comparisons and MUST contain "vs" or "versus" between two clear options.` };
                }
                if (s.startsWith("why") || s.includes("why choose")) {
                    return { kind: "why", note: `ALL titles MUST start with "Why" or "Why Choose".` };
                }
                if (/how/.test(s)) {
                    return { kind: "how", note: `ALL titles MUST start with "How to".` };
                }
                if (/(^|\s)(list|top|best)(\s|$)/.test(s)) {
                    return { kind: "list", note: `ALL titles MUST be listicles that start with "Top <N>" or "Best <N>".` };
                }
                if (/case/.test(s)) return { kind: "case", note: `ALL titles MUST include "Case Study".` };
                if (/beginner/.test(s)) return { kind: "beginner", note: `ALL titles MUST include "Beginner's Guide" (or "Beginner's Guide").` };
                if (/trouble|fix|error|issue/.test(s)) return { kind: "troubleshoot", note: `ALL titles MUST include "Troubleshooting" or "Fix".` };
                if (/myth/.test(s)) return { kind: "myth", note: `ALL titles MUST include "Myth vs Fact" (or "Myths vs Facts").` };
                if (/tip/.test(s)) return { kind: "tips", note: `ALL titles MUST include the word "Tips".` };
                if (/faq|question/.test(s)) return { kind: "faq", note: `ALL titles MUST include "FAQ".` };
                return { kind: "generic", note: `Titles MUST match the requested style: "${styleText}".` };
            })();

            const rawLocs = toArray(locations);
            const locNames = unique(
                rawLocs.flatMap(l => {
                    if (!l) return [];
                    if (typeof l === "string") return [l.trim()].filter(Boolean);
                    if (typeof l === "object" && typeof l.name === "string") return [l.name.trim()].filter(Boolean);
                    return [];
                })
            );
            const hasLocations = locNames.length > 0;

            const enforceLocationExactlyOnce = (t, idx) => {
                if (!hasLocations) {
                    // strip any trailing 'in X' that may sneak in
                    return t
                        .replace(/\s*\((?:in|at|within|across)\s+[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}\)\s*$/i, "")
                        .replace(/\s*[-–:]\s*(?:in|at|within|across)\s+.+$/i, "")
                        .replace(/\s{2,}/g, " ")
                        .replace(/\s*[-–:,]\s*$/, "")
                        .trim();
                }
                const targetLoc = locNames[idx % locNames.length];

                // Remove ANY location-like tail, then add exactly one
                let out = t
                    .replace(/\s*\((?:in|at|within|across)\s+[^)]+\)\s*$/i, "")
                    .replace(/\s*[-–:]\s*(?:in|at|within|across)\s+.+$/i, "")
                    .trim();

                // If location already present elsewhere, keep it (but ensure only once)
                const hasTarget = new RegExp(`\\b${targetLoc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(out);
                if (!hasTarget) {
                    // append with "in X" (choose preposition that fits most cases)
                    out = `${out} in ${targetLoc}`.replace(/\s+/g, " ").trim();
                }

                // ensure not repeated
                const regexDupe = new RegExp(`\\b(in|at|within|across)\\s+(${targetLoc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\s+\\1\\s+\\2\\b`, "i");
                out = out.replace(regexDupe, "$1 $2");
                return out;
            };

            const matchesStyle = (t) => {
                const s = t.trim();
                switch (styleRule.kind) {
                    case "vs": return /\b(vs\.?|versus)\b/i.test(s);
                    case "why": return /^why(\s+choose)?\b/i.test(s);
                    case "how": return /^how to\b/i.test(s);
                    case "list": return /^(top|best)\s+\d+\b/i.test(s);
                    case "case": return /\bcase study\b/i.test(s);
                    case "beginner": return /\bbeginner['']s guide\b/i.test(s);
                    case "troubleshoot": return /\b(troubleshooting|fix)\b/i.test(s);
                    case "myth": return /\bmyth(s)?\s+vs\s+fact(s)?\b/i.test(s);
                    case "tips": return /\btips\b/i.test(s);
                    case "faq": return /\bfaq\b/i.test(s);
                    default: return true;
                }
            };

            const normalizeArtifacts = (t) =>
                t
                    .replace(/\b(in|at|within|across)\s+in\b/gi, "$1 ") // "in in X"
                    .replace(/\s+/g, " ")
                    .replace(/\s*[-–:,]\s*$/, "")
                    .trim();

            const clampWordCount = (t) => {
                const words = t.split(/\s+/);
                if (words.length > 14) {
                    return words.slice(0, 14).join(" ").replace(/\W+$/, ""); // hard cap
                }
                return t;
            };

            // Fallback maker that respects style + location
            const makeFallbackTitle = (idx, serviceName, locationOptional) => {
                const loc = hasLocations ? ` in ${locNames[idx % locNames.length]}` : "";
                const svc = serviceName || "Your Service";
                switch (styleRule.kind) {
                    case "vs":
                        return titleCase(`"${svc} A" vs "${svc} B": Key Differences${loc}`); // generic compare
                    case "why":
                        return titleCase(`Why Choose ${svc}${loc}`);
                    case "how":
                        return titleCase(`How to Get Started with ${svc}${loc}`);
                    case "list":
                        return titleCase(`Top 10 ${svc} Tips${loc}`);
                    case "case":
                        return titleCase(`${svc} Case Study: Real Results${loc}`);
                    case "beginner":
                        return titleCase(`${svc}: Beginner's Guide${loc}`);
                    case "troubleshoot":
                        return titleCase(`${svc} Troubleshooting: Common Issues and Fixes${loc}`);
                    case "myth":
                        return titleCase(`${svc} Myths vs Facts${loc}`);
                    case "tips":
                        return titleCase(`Pro Tips for ${svc}${loc}`);
                    case "faq":
                        return titleCase(`${svc} FAQ: Your Questions Answered${loc}`);
                    default:
                        return titleCase(`Essential Guide to ${svc}${loc}`);
                }
            };

            const enforceStyle = (t, idx, serviceName) => {
                if (matchesStyle(t)) return t;
                return makeFallbackTitle(idx, serviceName);
            };

            // -------- fetch project + main services --------
            const project = await UserProject.findById(projectId).lean();
            if (!project) return res.status(404).json({ message: "Project not found" });

            const projectName = (project.projectName || "Project").trim();
            const serviceType = (project.serviceType || "").trim();

            const services = await Service.find({ projectId, is_main: true })
                .select("service_name")
                .limit(50)
                .lean();

            const serviceNames = unique(
                services
                    .map(s => String(s.service_name || "").trim())
                    .filter(Boolean)
            ).slice(0, 20);

            // -------- prompt --------
            const locBlock = hasLocations
                ? `
Locations: Use EXACTLY ONE of the following per title, rotating round-robin (reuse if fewer than ${n}). 
Do NOT repeat the location twice in a single title; use the location EXACTLY as written.
${locNames.map((x, i) => `- ${i + 1}. ${x}`).join("\n")}
`
                : `
Location rule: DO NOT include any city, state, region, or country in the titles. Keep titles generic with no geographic qualifiers.
`;

            const prompt = `
Return ONLY a JSON array of EXACTLY ${n} UNIQUE blog post titles (strings).

Context:
- Brand/Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Top Services (for topical variety):
${serviceNames.length ? serviceNames.map((s, i) => `  ${i + 1}. ${s}`).join("\n") : "  (none)"}
- Requested style: "${styleText}"
- HARD STYLE RULE: ${styleRule.note}
${locBlock}

Writing rules:
- Each title 6–14 words, Title Case (Capitalize Major Words).
- Helpful, specific, natural language. Avoid emojis and clickbait.
${hasLocations
                    ? `- Include EXACTLY ONE of the provided locations in each title (round-robin).`
                    : `- Since no locations are provided, DO NOT include any location in the titles.`}
- Do NOT write duplicates or near-duplicates.
- Vary phrasing; do not repeat the brand in every title.

Output format (IMPORTANT):
- A pure JSON array of strings only, e.g. ["Title One","Title Two", ...].
- No keys, no objects, no extra text, no markdown.
`.trim();

            // -------- call model --------
            const userId = req.user?.userId;
            const pageId = `blog_titles_${projectId}_${Date.now()}`;

            let result = await fetchJSONFromOpenAI(prompt, "GENERATE_BLOG_TITLES", {
                userId,
                projectId,
                pageId,
                promptFrom: "generateBlogTitles",
                promptFor: `${projectName}::${styleText}`,
            });

            // -------- parse + light cleanup --------
            if (typeof result === "string") {
                try { result = JSON.parse(result); } catch { /* ignore */ }
            }
            if (!Array.isArray(result)) {
                return res.status(502).json({ message: "Model did not return a JSON array." });
            }

            const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

            // Initial normalize
            let titles = result.map(clean).filter(Boolean);

            // De-dupe case-insensitive
            const seen = new Set();
            titles = titles.filter(t => {
                const k = t.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });

            // Artifact fixes
            titles = titles.map(normalizeArtifacts);

            // ---------- VALIDATE + REPAIR PIPELINE ----------
            const repaired = [];
            const servicesCycle = (i) => serviceNames[i % Math.max(serviceNames.length, 1)] || (serviceType || projectName);

            for (let i = 0; i < titles.length; i++) {
                let t = titles[i];

                // Fix incomplete endings by dropping last partial token when detected
                if (isLikelyIncomplete(t)) {
                    t = t.replace(/\s*[A-Za-z]{3,7}$/, "").trim();
                }

                // Title Case and clamp word count
                t = clampWordCount(titleCase(t));

                // Enforce style strictly; if not matched, replace with fallback
                t = enforceStyle(t, i, servicesCycle(i));

                // Enforce location rule exactly once (or none)
                t = enforceLocationExactlyOnce(t, i);

                // Final word-count guard (6–14)
                const wc = wordCount(t);
                if (wc < 6 || wc > 14) {
                    // replace with a compliant fallback
                    t = makeFallbackTitle(i, servicesCycle(i));
                }

                // If still looks incomplete (e.g., single trailing stem), replace
                if (isLikelyIncomplete(t)) {
                    t = makeFallbackTitle(i, servicesCycle(i));
                }

                repaired.push(t);
            }

            // Re-dedupe after repairs
            const seen2 = new Set();
            let finalTitles = repaired.filter(t => {
                const k = t.toLowerCase();
                if (seen2.has(k)) return false;
                seen2.add(k);
                return true;
            });

            // Top up to n with deterministic fallbacks
            while (finalTitles.length < n) {
                const idx = finalTitles.length;
                const fallback = makeFallbackTitle(idx, servicesCycle(idx));
                if (!seen2.has(fallback.toLowerCase())) {
                    finalTitles.push(fallback);
                    seen2.add(fallback.toLowerCase());
                } else {
                    // rare: tweak with "#<n>"
                    finalTitles.push(`${fallback} #${idx + 1}`);
                }
            }

            // Trim down if too many
            if (finalTitles.length > n) finalTitles = finalTitles.slice(0, n);

            return res.status(200).json({
                message: "Blog titles generated successfully",
                data: finalTitles,
                meta: {
                    projectName,
                    style: styleText,
                    requested: n,
                    locationsProvided: locNames,
                    servicesUsed: serviceNames,
                    styleRule: styleRule.kind
                },
            });
        } catch (err) {
            console.error("Error in generateBlogTitles:", err);
            return res.status(500).json({ message: "Failed to generate blog titles" });
        }
    },

    // Save Business Location or Local Area
    saveBusinessLocation: async (req, res) => {
        try {
            const { projectId, areaName, parentId, type, googlePlaceId, formattedAddress, lat, lng, bounds, country, state, city } = req.body;
            const userId = req.user.userId;

            if (!projectId || !areaName) {
                return res.status(400).json({
                    message: 'projectId and areaName are required'
                });
            }

            if (![0, 1].includes(Number(type))) {
                return res.status(400).json({
                    message: 'type must be 0 (parent) or 1 (child/local area)'
                });
            }

            // Validate: if type is 1 (child), parentId must be provided
            if (Number(type) === 1 && !parentId) {
                return res.status(400).json({
                    message: 'parentId is required when type is 1 (child/local area)'
                });
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Check if project is business type
            if (project.projectType !== 1) {
                return res.status(400).json({
                    message: 'This API is only for business websites (projectType = 1)'
                });
            }

            // Create business location
            const businessLocation = new BusinessLocation({
                projectId,
                areaName,
                parentId: Number(type) === 0 ? null : parentId,
                type: Number(type),
                googlePlaceId: googlePlaceId || null,
                formattedAddress: formattedAddress || null,
                lat: lat || null,
                lng: lng || null,
                bounds: bounds || null,
                country: country || null,
                state: state || null,
                city: city || null,
                status: 1,
                pageGenerated: false
            });

            await businessLocation.save();

            // Update userProjects.locations with business location IDs
            if (!project.locations) {
                project.locations = {};
            }
            if (!project.locations.businessLocations) {
                project.locations.businessLocations = [];
            }

            // Add location ID to project
            project.locations.businessLocations.push({
                locationId: businessLocation._id,
                areaName: areaName,
                type: Number(type),
                parentId: parentId || null
            });

            await project.save();

            return res.status(201).json({
                message: 'Business location saved successfully',
                data: businessLocation
            });
        } catch (error) {
            console.error('Error in saveBusinessLocation:', error);
            return res.status(500).json({
                message: 'An error occurred while saving business location'
            });
        }
    },

    // Fetch Business Locations for a project
    fetchBusinessLocations: async (req, res) => {
        try {
            const { projectId } = req.body;
            const userId = req.user.userId;

            if (!projectId) {
                return res.status(400).json({
                    message: 'projectId is required'
                });
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Fetch business locations (parent locations only, type = 0)
            const businessLocations = await BusinessLocation.find({
                projectId: projectId,
                type: 0, // Only parent locations
                status: 1 // Active
            }).select('_id areaName').lean();

            return res.status(200).json({
                message: 'Business locations fetched successfully',
                data: businessLocations
            });
        } catch (error) {
            console.error('Error in fetchBusinessLocations:', error);
            return res.status(500).json({
                message: 'An error occurred while fetching business locations'
            });
        }
    },

    // Update Google Site Verification meta tag
    updateGoogleSiteVerification: async (req, res) => {
        try {
            const { projectId, verificationCode } = req.body;
            const userId = req.user.userId;

            if (!projectId) {
                return res.status(400).json({
                    message: 'projectId is required'
                });
            }

            if (!verificationCode || typeof verificationCode !== 'string' || verificationCode.trim() === '') {
                return res.status(400).json({
                    message: 'verificationCode is required and must be a non-empty string'
                });
            }

            // Validate that it contains a meta tag
            const trimmedCode = verificationCode.trim();
            if (!trimmedCode.includes('google-site-verification') || !trimmedCode.includes('<meta')) {
                return res.status(400).json({
                    message: 'Invalid format. Please provide the complete meta tag line (e.g., <meta name="google-site-verification" content="..." />)'
                });
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Store the entire meta tag line as-is
            project.googleSiteVerification = trimmedCode;
            // Clear HTML file method when using meta tag method
            project.googleSiteVerificationHtmlFile = null;
            await project.save();

            console.log(`[Google Site Verification] Updated for project ${projectId}: ${trimmedCode}`);

            return res.status(200).json({
                message: 'Google Site Verification meta tag updated successfully',
                data: {
                    projectId: project._id,
                    googleSiteVerification: project.googleSiteVerification,
                    googleSiteVerificationHtmlFile: project.googleSiteVerificationHtmlFile
                }
            });
        } catch (error) {
            console.error('Error in updateGoogleSiteVerification:', error);
            return res.status(500).json({
                message: 'An error occurred while updating Google Site Verification meta tag'
            });
        }
    },

    // Upload Google Site Verification HTML file
    uploadGoogleSiteVerificationHtml: async (req, res) => {
        try {
            const { projectId, fileName } = req.body; // Get filename from body (sent separately to avoid truncation)
            const userId = req.user.userId;
            const file = req?.files?.htmlFile;

            if (!projectId) {
                return res.status(400).json({
                    message: 'projectId is required'
                });
            }

            if (!file) {
                return res.status(400).json({
                    message: 'HTML file is required'
                });
            }

            // Use filename from body if provided, otherwise fall back to file.name
            let finalFileName = fileName || file.name;

            // Validate file type - check both the provided filename and file.name
            if (!finalFileName.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.html')) {
                return res.status(400).json({
                    message: 'Only HTML files are allowed'
                });
            }

            // Ensure filename ends with .html
            if (!finalFileName.toLowerCase().endsWith('.html')) {
                finalFileName = finalFileName + '.html';
            }

            // Check if project exists and belongs to user
            const project = await UserProject.findOne({
                _id: projectId,
                userId: userId
            });

            if (!project) {
                return res.status(404).json({
                    message: 'Project not found or you do not have permission'
                });
            }

            // Upload file to uploads/{projectId} folder with exact filename
            const uploadsFolderPath = path.join(__dirname, '..', 'uploads', projectId.toString());

            // Ensure uploads/{projectId} directory exists
            if (!fs.existsSync(uploadsFolderPath)) {
                fs.mkdirSync(uploadsFolderPath, { recursive: true });
            }

            // Save file with exact name in project-specific folder (use finalFileName which came from body to avoid truncation)
            const filePath = path.join(uploadsFolderPath, finalFileName);

            // Handle file upload (using express-fileupload)
            if (file.tempFilePath) {
                // File was saved to temp location
                fs.copyFileSync(file.tempFilePath, filePath);
            } else if (file.data) {
                // File is in memory as buffer
                fs.writeFileSync(filePath, file.data);
            } else {
                return res.status(400).json({
                    message: 'Invalid file data'
                });
            }

            // Save relative path to database: uploads/{projectId}/filename.html
            const relativePath = path.join('uploads', projectId.toString(), finalFileName).replace(/\\/g, '/'); // Use forward slashes for cross-platform compatibility

            // Update project with relative path (includes projectId folder)
            project.googleSiteVerificationHtmlFile = relativePath;
            // Clear meta tag method when using HTML file method
            project.googleSiteVerification = null;
            await project.save();

            console.log(`[Google Site Verification HTML] Uploaded for project ${projectId}: ${relativePath} (original: ${file.name})`);

            return res.status(200).json({
                message: 'Google Site Verification HTML file uploaded successfully',
                data: {
                    projectId: project._id,
                    fileName: finalFileName,
                    filePath: relativePath,
                    googleSiteVerificationHtmlFile: project.googleSiteVerificationHtmlFile,
                    googleSiteVerification: project.googleSiteVerification
                }
            });
        } catch (error) {
            console.error('Error in uploadGoogleSiteVerificationHtml:', error);
            return res.status(500).json({
                message: 'An error occurred while uploading Google Site Verification HTML file'
            });
        }
    },

    // New function to scan themes folder and return available themes
    scan_website_themes: async (req, res) => {
        console.log('========================================');
        console.log('🚀 scan_website_themes API CALLED');
        console.log('   Method:', req.method);
        console.log('   URL:', req.url);
        console.log('   Original URL:', req.originalUrl);
        console.log('   Path:', req.path);
        console.log('   Base URL:', req.baseUrl);
        console.log('========================================');

        try {
            const fs = require('fs');
            const path = require('path');

            // Path to themes folder in website app - using path.resolve like deployHelper.js
            const themesPath = path.resolve(__dirname, '..', '..', 'apps', 'website', 'src', 'themes');

            console.log('🔍 Scanning themes folder...');
            console.log('   Full path:', themesPath);
            console.log('   __dirname:', __dirname);
            console.log('   process.cwd():', process.cwd());
            console.log('   Path exists:', fs.existsSync(themesPath));

            // Check if themes folder exists
            if (!fs.existsSync(themesPath)) {
                // Try alternative path (in case __dirname is different)
                const altPath = path.resolve(process.cwd(), 'apps', 'website', 'src', 'themes');
                console.log('   Trying alternative path:', altPath);
                console.log('   Alt path exists:', fs.existsSync(altPath));

                if (fs.existsSync(altPath)) {
                    console.log('✅ Found themes using alternative path');
                    // Continue with altPath
                    const items = fs.readdirSync(altPath, { withFileTypes: true });
                    const themes = [];

                    for (const item of items) {
                        if (item.isDirectory()) {
                            const themeName = item.name;
                            const themePath = path.join(altPath, themeName);
                            const pagesPath = path.join(themePath, 'pages');
                            const hasPages = fs.existsSync(pagesPath);
                            const componentsPath = path.join(themePath, 'components');
                            const hasComponents = fs.existsSync(componentsPath);
                            const previewUrl = `http://localhost:5173/?theme=${themeName}`;
                            const previewImage = `https://via.placeholder.com/800x600/6366F1/FFFFFF?text=${encodeURIComponent(themeName.charAt(0).toUpperCase() + themeName.slice(1))}+Theme`;

                            themes.push({
                                name: themeName,
                                displayName: themeName.charAt(0).toUpperCase() + themeName.slice(1),
                                previewUrl: previewUrl,
                                previewImage: previewImage,
                                hasPages: hasPages,
                                hasComponents: hasComponents,
                                indexFile: null,
                                path: themePath
                            });
                        }
                    }

                    return res.status(200).json({
                        message: 'Themes scanned successfully',
                        count: themes.length,
                        themes: themes
                    });
                }

                return res.status(404).json({
                    message: 'Themes folder not found',
                    error: `Path does not exist: ${themesPath}`,
                    debug: {
                        __dirname: __dirname,
                        processCwd: process.cwd(),
                        attemptedPath: themesPath,
                        alternativePath: altPath
                    },
                    themes: []
                });
            }

            // Read all directories in themes folder
            console.log('✅ Themes folder found, reading directories...');
            const items = fs.readdirSync(themesPath, { withFileTypes: true });
            console.log(`   Found ${items.length} items in themes folder`);

            const themes = [];

            for (const item of items) {
                if (item.isDirectory()) {
                    const themeName = item.name;
                    const themePath = path.join(themesPath, themeName);

                    console.log(`   📁 Processing theme: ${themeName}`);

                    // Check if theme has pages folder
                    const pagesPath = path.join(themePath, 'pages');
                    const hasPages = fs.existsSync(pagesPath);

                    // Check if theme has Index.tsx or Index.js
                    const indexFiles = ['Index.tsx', 'Index.js', 'index.tsx', 'index.js'];
                    let indexFile = null;

                    if (hasPages) {
                        for (const indexFileName of indexFiles) {
                            const indexPath = path.join(pagesPath, indexFileName);
                            if (fs.existsSync(indexPath)) {
                                indexFile = indexFileName;
                                break;
                            }
                        }
                    }

                    // Check for components folder
                    const componentsPath = path.join(themePath, 'components');
                    const hasComponents = fs.existsSync(componentsPath);

                    // Generate preview URL
                    // Website app port - can be set via WEBSITE_PORT env variable
                    // Default to 8081 (common Vite port when 5173 is busy)
                    const websitePort = process.env.WEBSITE_PORT || '8081';
                    const previewUrl = `http://localhost:${websitePort}/?theme=${themeName}`;

                    console.log(`   Preview URL for ${themeName}: ${previewUrl}`);

                    // Try to find preview image or use placeholder
                    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
                    let previewImage = null;

                    // Check for preview image in theme root
                    for (const ext of imageExtensions) {
                        const imagePath = path.join(themePath, `preview${ext}`);
                        if (fs.existsSync(imagePath)) {
                            previewImage = `/themes/${themeName}/preview${ext}`;
                            break;
                        }
                    }

                    // If no preview image, use placeholder
                    if (!previewImage) {
                        previewImage = `https://via.placeholder.com/800x600/6366F1/FFFFFF?text=${encodeURIComponent(themeName.charAt(0).toUpperCase() + themeName.slice(1))}+Theme`;
                    }

                    themes.push({
                        name: themeName,
                        displayName: themeName.charAt(0).toUpperCase() + themeName.slice(1),
                        previewUrl: previewUrl,
                        previewImage: previewImage,
                        hasPages: hasPages,
                        hasComponents: hasComponents,
                        indexFile: indexFile,
                        path: themePath
                    });

                    console.log(`   ✅ Added theme: ${themeName} (Pages: ${hasPages}, Components: ${hasComponents})`);
                } else {
                    console.log(`   ⚠️  Skipping non-directory: ${item.name}`);
                }
            }

            console.log(`✨ Total themes found: ${themes.length}`);
            console.log(`   Theme names:`, themes.map(t => t.name).join(', '));

            return res.status(200).json({
                message: 'Themes scanned successfully',
                count: themes.length,
                themes: themes
            });

        } catch (error) {
            console.error('❌ Error scanning themes:', error);
            console.error('   Error stack:', error.stack);
            return res.status(500).json({
                message: 'Error scanning themes folder',
                error: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                themes: []
            });
        }
    },

    // Update theme thumbnail image
    update_theme_thumbnail: async (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');

            const { themeName } = req.body;

            if (!themeName) {
                return res.status(400).json({
                    message: 'Theme name is required',
                    error: 'Missing themeName parameter'
                });
            }

            if (!req.files || !req.files.thumbnail) {
                return res.status(400).json({
                    message: 'Thumbnail image is required',
                    error: 'No file uploaded'
                });
            }

            const thumbnailFile = req.files.thumbnail;
            const themesPath = path.resolve(__dirname, '..', '..', 'apps', 'website', 'src', 'themes');
            const themePath = path.join(themesPath, themeName);

            // Check if theme exists
            if (!fs.existsSync(themePath)) {
                return res.status(404).json({
                    message: 'Theme not found',
                    error: `Theme "${themeName}" does not exist`
                });
            }

            // Allowed image extensions
            const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
            const fileExt = path.extname(thumbnailFile.name).toLowerCase();

            if (!allowedExtensions.includes(fileExt)) {
                return res.status(400).json({
                    message: 'Invalid file type',
                    error: `Only ${allowedExtensions.join(', ')} files are allowed`
                });
            }

            // Save thumbnail as preview.png in theme folder
            const thumbnailPath = path.join(themePath, 'preview.png');

            // If old preview exists, remove it first
            const oldExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.svg'];
            for (const ext of oldExtensions) {
                const oldPath = path.join(themePath, `preview${ext}`);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Save new thumbnail
            await thumbnailFile.mv(thumbnailPath);

            // Return the new thumbnail URL
            const thumbnailUrl = `http://localhost:8081/themes/${themeName}/preview.png`;

            console.log(`✅ Thumbnail updated for theme: ${themeName}`);
            console.log(`   Saved to: ${thumbnailPath}`);

            return res.status(200).json({
                message: 'Thumbnail updated successfully',
                thumbnailUrl: thumbnailUrl,
                themeName: themeName
            });

        } catch (error) {
            console.error('Error updating theme thumbnail:', error);
            return res.status(500).json({
                message: 'Error updating thumbnail',
                error: error.message
            });
        }
    },

    // Refresh components from GenieBuild sections
    refreshComponentsFromRegistry: async (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');

            // Path to GenieBuild sections directory
            const genieBuildSectionsPath = path.join(__dirname, '../../apps/geniebuild/components/sections');

            console.log('[refreshComponentsFromRegistry] Scanning GenieBuild sections:', genieBuildSectionsPath);

            if (!fs.existsSync(genieBuildSectionsPath)) {
                return res.status(400).json({
                    message: 'GenieBuild sections directory not found',
                    error: `Path does not exist: ${genieBuildSectionsPath}`
                });
            }

            const componentEntries = [];

            // AUTOMATIC SCANNING: Read all directories in sections folder
            const allItems = fs.readdirSync(genieBuildSectionsPath, { withFileTypes: true });
            const sectionDirs = allItems
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            const sectionRouterFiles = allItems
                .filter(dirent => dirent.isFile() && dirent.name.endsWith('Section.tsx'))
                .map(dirent => dirent.name);

            console.log('[refreshComponentsFromRegistry] Auto-detected section directories:', sectionDirs);
            console.log('[refreshComponentsFromRegistry] Auto-detected router files:', sectionRouterFiles);

            // Map directory names to section types
            const dirToSectionType = {
                'hero': 'hero',
                'features': 'features',
                'navbar': 'navbar',
                'cta': 'cta',
                'footer': 'footer',
                'pricing': 'pricing',
                'image-banner': 'image-banner'
            };

            // AUTOMATIC SCAN: Scan each section directory for variant files
            for (const dirName of sectionDirs) {
                const sectionType = dirToSectionType[dirName] || dirName;
                const dirPath = path.join(genieBuildSectionsPath, dirName);
                
                // Get all .tsx files in this directory (variants)
                const variantFiles = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.tsx') && !file.includes('Section.tsx'))
                    .map(file => file.replace('.tsx', '')); // Remove .tsx extension

                console.log(`[refreshComponentsFromRegistry] Section: ${sectionType}, Auto-found variants:`, variantFiles);

                // Add each variant to componentEntries
                for (const variantName of variantFiles) {
                    componentEntries.push({
                        name: sectionType,
                        variant: variantName, // Filename without .tsx
                        uniqueId: variantName, // Same as variant
                        componentName: variantName
                    });
                }
            }

            // Handle single-component sections (no subdirectory)
            // These are sections like TestimonialsSection, ElementsSection
            const singleComponentSections = {
                'TestimonialsSection.tsx': 'testimonials',
                'ElementsSection.tsx': 'elements'
            };

            for (const [routerFile, sectionType] of Object.entries(singleComponentSections)) {
                if (sectionRouterFiles.includes(routerFile)) {
                    const variantName = routerFile.replace('.tsx', '');
                    componentEntries.push({
                        name: sectionType,
                        variant: variantName,
                        uniqueId: variantName,
                        componentName: variantName
                    });
                }
            }

            // Handle FAQ (inline in SectionRenderer, no file)
            componentEntries.push({
                name: 'faq',
                variant: 'FAQSection',
                uniqueId: 'FAQSection',
                componentName: 'FAQSection'
            });

            console.log(`[refreshComponentsFromRegistry] Auto-scanned ${componentEntries.length} GenieBuild components`);

            // Group by component name
            const componentsByName = {};
            componentEntries.forEach(entry => {
                if (!componentsByName[entry.name]) {
                    componentsByName[entry.name] = [];
                }
                componentsByName[entry.name].push({
                    uniqueId: entry.uniqueId,
                    status: 1 // Default enabled
                });
            });

            const results = [];
            const added = [];
            const updated = [];
            const deleted = [];

            // Get all existing components
            const existingComponents = await WebsiteComponent.find({});
            const existingByName = {};
            existingComponents.forEach(comp => {
                if (!existingByName[comp.name]) {
                    existingByName[comp.name] = comp;
                }
            });

            // Process each component from registry
            for (const [componentName, variants] of Object.entries(componentsByName)) {
                const normalizedName = componentName.toLowerCase().trim();

                // Check if component exists
                let component = existingByName[normalizedName];

                if (component) {
                    // Update existing component with new variants
                    const existingVariants = component.variants || [];
                    const existingUniqueIds = existingVariants.map(v => v.uniqueId);

                    // Add new variants
                    const newVariants = variants.filter(v => !existingUniqueIds.includes(v.uniqueId));
                    // Update existing variants (keep their status)
                    const updatedVariants = variants.map(newV => {
                        const existing = existingVariants.find(e => e.uniqueId === newV.uniqueId);
                        return existing ? existing : newV;
                    });

                    // Remove variants that are no longer in registry
                    const registryUniqueIds = variants.map(v => v.uniqueId);
                    const removedVariants = existingVariants.filter(v => !registryUniqueIds.includes(v.uniqueId));

                    component.variants = updatedVariants;
                    await component.save();

                    if (newVariants.length > 0 || removedVariants.length > 0) {
                        updated.push({
                            name: normalizedName,
                            added: newVariants.length,
                            removed: removedVariants.length
                        });
                    }
                } else {
                    // Create new component
                    component = new WebsiteComponent({
                        name: normalizedName,
                        variants: variants
                    });
                    await component.save();
                    added.push(normalizedName);
                }

                results.push({
                    name: normalizedName,
                    variants: component.variants.length,
                    component: component
                });
            }

            // Delete components that are no longer in registry
            const registryNames = Object.keys(componentsByName).map(n => n.toLowerCase());
            for (const existing of existingComponents) {
                if (!registryNames.includes(existing.name.toLowerCase())) {
                    await WebsiteComponent.deleteOne({ _id: existing._id });
                    deleted.push(existing.name);
                }
            }

            return res.status(200).json({
                message: 'Components refreshed successfully from GenieBuild sections',
                summary: {
                    total: results.length,
                    added: added.length,
                    updated: updated.length,
                    deleted: deleted.length
                },
                added: added,
                updated: updated,
                deleted: deleted,
                components: results
            });

        } catch (error) {
            console.error('[refreshComponentsFromRegistry] Error:', error);
            return res.status(500).json({
                message: 'Error refreshing components from registry',
                error: error.message
            });
        }
    },

    // Get all available variants (auto-scanned from filesystem)
    getGenieBuildVariants: async (req, res) => {
        try {
            const fs = require('fs');
            const path = require('path');

            // Path to GenieBuild sections directory
            const genieBuildSectionsPath = path.join(__dirname, '../../apps/geniebuild/components/sections');

            if (!fs.existsSync(genieBuildSectionsPath)) {
                return res.status(400).json({
                    message: 'GenieBuild sections directory not found',
                    error: `Path does not exist: ${genieBuildSectionsPath}`
                });
            }

            const variantsBySection = {};

            // AUTOMATIC SCANNING: Read all directories
            const allItems = fs.readdirSync(genieBuildSectionsPath, { withFileTypes: true });
            const sectionDirs = allItems
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);
            
            const sectionRouterFiles = allItems
                .filter(dirent => dirent.isFile() && dirent.name.endsWith('Section.tsx'))
                .map(dirent => dirent.name);

            // Map directory names to section types
            const dirToSectionType = {
                'hero': 'hero',
                'features': 'features',
                'navbar': 'navbar',
                'cta': 'cta',
                'footer': 'footer',
                'pricing': 'pricing',
                'image-banner': 'image-banner'
            };

            // Scan each section directory for variant files
            for (const dirName of sectionDirs) {
                const sectionType = dirToSectionType[dirName] || dirName;
                const dirPath = path.join(genieBuildSectionsPath, dirName);
                
                // Get all .tsx files in this directory (variants)
                const variantFiles = fs.readdirSync(dirPath)
                    .filter(file => file.endsWith('.tsx') && !file.includes('Section.tsx'))
                    .map(file => file.replace('.tsx', '')); // Remove .tsx extension

                variantsBySection[sectionType] = variantFiles;
            }

            // Handle single-component sections
            const singleComponentSections = {
                'TestimonialsSection.tsx': 'testimonials',
                'ElementsSection.tsx': 'elements'
            };

            for (const [routerFile, sectionType] of Object.entries(singleComponentSections)) {
                if (sectionRouterFiles.includes(routerFile)) {
                    const variantName = routerFile.replace('.tsx', '');
                    variantsBySection[sectionType] = [variantName];
                }
            }

            // Handle FAQ
            variantsBySection['faq'] = ['FAQSection'];

            return res.status(200).json({
                success: true,
                data: variantsBySection,
                message: 'GenieBuild variants fetched successfully (auto-scanned from filesystem)'
            });

        } catch (error) {
            console.error('[getGenieBuildVariants] Error:', error);
            return res.status(500).json({
                success: false,
                message: 'Error fetching GenieBuild variants',
                error: error.message
            });
        }
    },

    // Check if component has variants available
    checkComponentVariants: async (req, res) => {
        try {
            const { uniqueId } = req.query; // e.g., "hero_a", "cta_b"

            if (!uniqueId) {
                return res.status(400).json({
                    message: 'uniqueId is required',
                    error: 'Missing uniqueId parameter'
                });
            }

            // Extract component name from uniqueId (e.g., "hero_a" -> "hero")
            const parts = uniqueId.toLowerCase().split('_');
            if (parts.length < 2) {
                return res.status(400).json({
                    message: 'Invalid uniqueId format',
                    error: 'uniqueId must be in format: {name}_{variant}'
                });
            }

            const componentName = parts[0];

            // Find component by name
            const component = await WebsiteComponent.findOne({ name: componentName });

            if (!component) {
                return res.status(200).json({
                    hasVariants: false,
                    variants: [],
                    currentUniqueId: uniqueId
                });
            }

            // Get enabled variants (status === 1)
            const enabledVariants = (component.variants || []).filter(v => v.status === 1);

            // Check if there are multiple variants (more than just the current one)
            const hasMultipleVariants = enabledVariants.length > 1;
            const currentVariantExists = enabledVariants.some(v => v.uniqueId === uniqueId.toLowerCase());

            return res.status(200).json({
                hasVariants: hasMultipleVariants,
                variants: enabledVariants.map(v => ({
                    uniqueId: v.uniqueId,
                    status: v.status
                })),
                currentUniqueId: uniqueId.toLowerCase(),
                currentVariantExists: currentVariantExists,
                componentName: componentName
            });

        } catch (error) {
            console.error('[checkComponentVariants] Error:', error);
            return res.status(500).json({
                message: 'Error checking component variants',
                error: error.message
            });
        }
    },

    // Change component variant
    changeComponentVariant: async (req, res) => {
        try {
            const { projectId, pageId, sectionId, currentUniqueId, newUniqueId } = req.body;

            if (!projectId || !currentUniqueId) {
                return res.status(400).json({
                    message: 'projectId and currentUniqueId are required',
                    received: { projectId, currentUniqueId, sectionId, pageId }
                });
            }

            console.log('[changeComponentVariant] Request received:', {
                projectId,
                pageId,
                sectionId,
                currentUniqueId,
                newUniqueId
            });

            // If newUniqueId is provided, use it; otherwise pick random variant
            let targetUniqueId = newUniqueId;

            if (!targetUniqueId) {
                // Extract component name from currentUniqueId
                const parts = currentUniqueId.toLowerCase().split('_');
                if (parts.length < 2) {
                    return res.status(400).json({
                        message: 'Invalid currentUniqueId format'
                    });
                }

                const componentName = parts[0];

                // Find component and get enabled variants
                const component = await WebsiteComponent.findOne({ name: componentName });
                if (!component) {
                    return res.status(404).json({
                        message: 'Component not found'
                    });
                }

                const enabledVariants = (component.variants || []).filter(v => v.status === 1);
                if (enabledVariants.length <= 1) {
                    return res.status(400).json({
                        message: 'No other variants available for this component'
                    });
                }

                // Pick a random variant that's different from current
                const otherVariants = enabledVariants.filter(v => v.uniqueId !== currentUniqueId.toLowerCase());
                if (otherVariants.length === 0) {
                    return res.status(400).json({
                        message: 'No other variants available'
                    });
                }

                const randomIndex = Math.floor(Math.random() * otherVariants.length);
                targetUniqueId = otherVariants[randomIndex].uniqueId;
            }

            // Get the design data
            const designData = await WebsiteDesignsData.findOne({ projectId });
            if (!designData) {
                return res.status(404).json({
                    message: 'Design data not found for this project'
                });
            }

            // Find the section and update its component uniqueId
            // We need to update the component in componentIds array that matches currentUniqueId
            let updated = false;
            const normalizedCurrentUniqueId = currentUniqueId.toLowerCase().trim();

            // Extract component name from currentUniqueId (e.g., "hero_a" -> "hero")
            const currentComponentName = normalizedCurrentUniqueId.split('_')[0];

            // Debug: Log all components in the design data
            console.log('[changeComponentVariant] Searching for uniqueId:', normalizedCurrentUniqueId);
            console.log('[changeComponentVariant] Component name extracted:', currentComponentName);
            console.log('[changeComponentVariant] All pages:', designData.pages.map(p => ({
                pageId: p.pageId?.toString() || p.pageId,
                componentIds: (p.componentIds || []).map(c => ({
                    uniqueId: c.uniqueId,
                    componentId: c.componentId
                }))
            })));

            const updatedPages = designData.pages.map(page => {
                // Check if this page contains the section
                const pageIdStr = page.pageId?.toString() || page.pageId;
                const requestedPageIdStr = pageId ? (pageId.toString ? pageId.toString() : String(pageId)) : null;

                if (requestedPageIdStr && pageIdStr !== requestedPageIdStr) {
                    return page;
                }

                const updatedComponentIds = (page.componentIds || []).map((comp, index) => {
                    // Match by uniqueId (primary field)
                    const compUniqueId = comp.uniqueId ? comp.uniqueId.toLowerCase().trim() : null;

                    // Try to match by exact uniqueId first (new format)
                    if (compUniqueId === normalizedCurrentUniqueId) {
                        console.log('[changeComponentVariant] Found exact match by uniqueId:', {
                            current: normalizedCurrentUniqueId,
                            new: targetUniqueId.toLowerCase(),
                            comp: comp
                        });
                        updated = true;
                        return {
                            ...comp,
                            uniqueId: targetUniqueId.toLowerCase().trim(),
                            // Keep componentId for backward compatibility, but uniqueId is primary
                            componentId: comp.componentId // Keep existing componentId if present
                        };
                    }

                    // Fallback: Try to match by component name (e.g., if uniqueId is "hero_a" and we have "hero_b", match by "hero")
                    // This handles cases where the variant might have changed but we're looking for the same component type
                    if (compUniqueId && compUniqueId.startsWith(currentComponentName + '_')) {
                        console.log('[changeComponentVariant] Found match by component name:', {
                            searchedFor: normalizedCurrentUniqueId,
                            found: compUniqueId,
                            componentName: currentComponentName,
                            new: targetUniqueId.toLowerCase(),
                            comp: comp
                        });
                        updated = true;
                        return {
                            ...comp,
                            uniqueId: targetUniqueId.toLowerCase().trim(),
                            // Keep componentId for backward compatibility, but uniqueId is primary
                            componentId: comp.componentId // Keep existing componentId if present
                        };
                    }

                    return comp;
                });

                return {
                    ...page,
                    componentIds: updatedComponentIds
                };
            });

            if (!updated) {
                // Get all available uniqueIds for debugging
                const allUniqueIds = designData.pages
                    .filter(p => {
                        const pageIdStr = p.pageId?.toString() || p.pageId;
                        const requestedPageIdStr = pageId ? (pageId.toString ? pageId.toString() : String(pageId)) : null;
                        return !requestedPageIdStr || pageIdStr === requestedPageIdStr;
                    })
                    .flatMap(p => (p.componentIds || []).map(c => ({
                        uniqueId: c.uniqueId || 'N/A',
                        componentId: c.componentId || 'N/A'
                    })));

                console.error('[changeComponentVariant] Component not found:', {
                    searchedFor: normalizedCurrentUniqueId,
                    componentName: currentComponentName,
                    availableUniqueIds: allUniqueIds,
                    pageId: pageId,
                    sectionId: sectionId,
                    allPages: designData.pages.map(p => ({
                        pageId: p.pageId?.toString() || p.pageId,
                        componentCount: (p.componentIds || []).length
                    }))
                });

                return res.status(404).json({
                    message: 'Component with currentUniqueId not found in design data',
                    details: {
                        currentUniqueId: normalizedCurrentUniqueId,
                        componentName: currentComponentName,
                        pageId: pageId,
                        sectionId: sectionId,
                        availableUniqueIds: allUniqueIds,
                        suggestion: `Try refreshing the page or ensure the component exists in the database. Available components: ${allUniqueIds.map(c => c.uniqueId).join(', ')}`
                    }
                });
            }

            // Update the design data
            designData.pages = updatedPages;
            await designData.save();

            // Also update the section's componentType in the sections array (if stored separately)
            // This might be needed for the builder to reflect changes immediately

            return res.status(200).json({
                message: 'Component variant changed successfully',
                newUniqueId: targetUniqueId,
                oldUniqueId: currentUniqueId
            });

        } catch (error) {
            console.error('[changeComponentVariant] Error:', error);
            return res.status(500).json({
                message: 'Error changing component variant',
                error: error.message
            });
        }
    },

    generateWebsiteSectionsData: async (req, res) => {
        try {
            const { projectId, locations = [] } = req.body;

            if (!projectId) {
                return res.status(400).json({ message: "projectId is required" });
            }

            const project = await UserProject.findById(projectId);
            if (!project) {
                return res.status(404).json({ message: "Project not found" });
            }

            // Read from WebsiteDesignsData instead of WebsitePage
            const designData = await WebsiteDesignsData.findOne({ projectId });

            if (!designData || !designData.pages || !designData.pages.length) {
                return res.status(404).json({ message: "No pages found in design data" });
            }

            let successCount = 0;
            let failedCount = 0;

            console.log(`[generateWebsiteSectionsData] Found ${designData.pages.length} pages for projectId: ${projectId}`);

            for (const pageData of designData.pages) {
                const pageId = pageData.pageId?._id?.toString() || pageData.pageId?.toString() || pageData._id?.toString();
                console.log(`[generateWebsiteSectionsData] Processing page: ${pageId}, has componentIds: ${!!pageData.componentIds}`);

                // GenieBuild sections - read from componentIds[].sectionData (single source of truth)
                const componentIds = pageData.componentIds || [];
                console.log(`[generateWebsiteSectionsData] Page ${pageId} has ${componentIds.length} components`);

                for (const compData of componentIds) {
                    const section = compData.sectionData;
                    if (!section) {
                        console.warn(`[generateWebsiteSectionsData] Component ${compData.variant_uniqueId} has no sectionData, skipping`);
                        continue;
                    }
                    const sectionId = section.type; // type is same as filename/uniqueId
                    console.log(`[generateWebsiteSectionsData] Processing section: ${sectionId} (variant: ${compData.variant_uniqueId}) for page: ${pageId}`);

                    // GLOBAL PAGE
                    if (!locations.length) {
                        await generateSection(project, projectId, pageId, sectionId, null);
                        continue;
                    }

                    // LOCATION BASED
                    for (const loc of locations) {
                        await generateSection(project, projectId, pageId, sectionId, loc);
                    }
                }
            }

            async function generateSection(project, projectId, pageId, sectionId, location) {

                const locationId = location?.id || location?._id || null;

                try {

                    const sectionFile = path.join(
                        process.cwd(),
                        "sections",
                        sectionId,
                        `${sectionId}Section.js`
                    );

                    if (!fs.existsSync(sectionFile)) {
                        throw new Error(`Section file missing: ${sectionId}`);
                    }

                    delete require.cache[require.resolve(sectionFile)];
const sectionModule = require(sectionFile);

                    const prompt = sectionModule.prompt({
                        project,
                        location
                    });

                    const result = await fetchJSONFromOpenAI(prompt, sectionId, {
                        projectId,
                        pageId,
                        promptFrom: "generateWebsiteSectionsData"
                    });

                    // For hero section: save prompts to UserProject and remove from result
                    let resultToSave = result;
                    if (sectionId === 'hero' && result) {
                        const { coverImagePrompt, otherImagesPrompt, ...restResult } = result;
                        
                        // Save prompts to UserProject table
                        if (coverImagePrompt || otherImagesPrompt) {
                            await UserProject.findByIdAndUpdate(
                                projectId,
                                {
                                    $set: {
                                        ...(coverImagePrompt && { coverImagePrompt }),
                                        ...(otherImagesPrompt && { otherImagesPrompt })
                                    }
                                }
                            );
                            console.log(`[generateSection] Saved coverImagePrompt and otherImagesPrompt to UserProject: ${projectId}`);
                        }
                        
                        // Remove prompts from result before saving to SectionContent and WebsiteDesignsData
                        resultToSave = restResult;
                    }

                    // Save to SectionContent (without prompts for hero section)
                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                data: resultToSave,
                                status: "generated",
                                error: null
                            }
                        },
                        { upsert: true }
                    );

                    // Also merge into WebsiteDesignsData componentIds[].sectionData
                    const designDataToUpdate = await WebsiteDesignsData.findOne({ projectId });
                    if (designDataToUpdate && designDataToUpdate.pages) {
                        let foundAndUpdated = false;
                        for (let pageIndex = 0; pageIndex < designDataToUpdate.pages.length; pageIndex++) {
                            const pageData = designDataToUpdate.pages[pageIndex];
                            const currentPageId = pageData.pageId?._id?.toString() || pageData.pageId?.toString();
                            if (String(currentPageId) === String(pageId) && pageData.componentIds) {
                                // Find the component by sectionId and update its sectionData.content
                                const compIndex = pageData.componentIds.findIndex((comp) => {
                                    return comp.sectionData && comp.sectionData.type === sectionId;
                                });
                                if (compIndex !== -1 && pageData.componentIds[compIndex].sectionData) {
                                    // Merge AI-generated content into sectionData.content (without prompts for hero)
                                    pageData.componentIds[compIndex].sectionData.content = {
                                        ...pageData.componentIds[compIndex].sectionData.content,
                                        ...resultToSave
                                    };
                                    
                                    // Mark the nested path as modified so Mongoose saves it
                                    designDataToUpdate.markModified(`pages.${pageIndex}.componentIds.${compIndex}.sectionData.content`);
                                    
                                    foundAndUpdated = true;
                                    console.log(`[generateSection] Merged into WebsiteDesignsData componentIds[${compIndex}].sectionData.content: ${sectionId}`);
                                    break;
                                }
                            }
                        }
                        
                        // Save only once after all updates
                        if (foundAndUpdated) {
                            await designDataToUpdate.save();
                            console.log(`[generateSection] Saved WebsiteDesignsData update for section: ${sectionId}`);
                        } else {
                            console.warn(`[generateSection] Could not find component with type "${sectionId}" in page ${pageId} to update`);
                        }
                    } else {
                        console.warn(`[generateSection] WebsiteDesignsData not found for projectId: ${projectId}`);
                    }

                    successCount++;

                } catch (err) {

                    await SectionContent.findOneAndUpdate(
                        {
                            projectId,
                            locationId,
                            pageId,
                            sectionId
                        },
                        {
                            $set: {
                                status: "failed",
                                error: err.message || "Generation failed"
                            }
                        },
                        { upsert: true }
                    );

                    failedCount++;

                    console.error(`❌ ${sectionId} failed:`, err.message);
                }
            }

            return res.status(200).json({
                message: "Section generation completed",
                success: successCount,
                failed: failedCount
            });

        } catch (error) {
            console.error("generateWebsiteSectionsData error:", error);
            return res.status(500).json({ message: "Generation failed" });
        }
    },

  regenerateFailedSections: async (req, res) => {
  try {
    const { projectId, locations = [] } = req.body;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const project = await UserProject.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const pages = await WebsitePage.find({ projectId });

    if (!pages.length) {
      return res.status(404).json({ message: "No pages found" });
    }

    let successCount = 0;
    let failedCount = 0;
    let skipped = 0;

    for (const page of pages) {

      const pageId = page.slug || page._id.toString();

      for (const comp of page.componentIds || []) {

        if (!comp.componentVariant) continue;

        const sectionId = comp.componentVariant.split("_")[0];

        // GLOBAL
        if (!locations.length) {
          await regenSection(project, projectId, pageId, sectionId, null);
          continue;
        }

        // LOCATION BASED
        for (const loc of locations) {
          await regenSection(project, projectId, pageId, sectionId, loc);
        }
      }
    }

    async function regenSection(project, projectId, pageId, sectionId, location) {

      const locationId = location?.id || location?._id || null;

      const existing = await SectionContent.findOne({
        projectId,
        locationId,
        pageId,
        sectionId,
        isDeleted: false
      });

      // Already generated → skip
      if (existing && existing.status === "generated") {
        skipped++;
        return;
      }

      try {

        const sectionFile = path.join(
          process.cwd(),
          "sections",
          sectionId,
          `${sectionId}Section.js`
        );

        if (!fs.existsSync(sectionFile)) {
          throw new Error(`Section file missing: ${sectionId}`);
        }

        delete require.cache[require.resolve(sectionFile)];
        const sectionModule = require(sectionFile);

        const prompt = sectionModule.prompt({
          project,
          location
        });

        const result = await fetchJSONFromOpenAI(prompt, sectionId, {
          projectId,
          pageId,
          promptFrom: "regenerateFailedSections"
        });

        await SectionContent.findOneAndUpdate(
          {
            projectId,
            locationId,
            pageId,
            sectionId
          },
          {
            $set: {
              data: result,
              status: "generated",
              error: null
            }
          },
          { upsert: true }
        );

        successCount++;

      } catch (err) {

        await SectionContent.findOneAndUpdate(
          {
            projectId,
            locationId,
            pageId,
            sectionId
          },
          {
            $set: {
              status: "failed",
              error: err.message || "Generation failed"
            }
          },
          { upsert: true }
        );

        failedCount++;
      }
    }

    return res.status(200).json({
      message: "Regeneration completed",
      success: successCount,
      failed: failedCount,
      skipped
    });

  } catch (error) {
    console.error("regenerateFailedSections error:", error);
    return res.status(500).json({ message: "Regeneration failed" });
  }
},

// Get original section content from SectionContent table
getSectionContent: async (req, res) => {
  try {
    const { projectId, pageId, sectionId } = req.params;

    if (!projectId || !pageId || !sectionId) {
      return res.status(400).json({ message: 'projectId, pageId, and sectionId are required' });
    }
    
    // Find the original content
    const sectionContent = await SectionContent.findOne({
      projectId,
      pageId,
      sectionId,
      isDeleted: { $ne: true }
    });

    if (!sectionContent || !sectionContent.data) {
      return res.status(404).json({ message: 'Original section content not found' });
    }

    return res.status(200).json({
      success: true,
      data: sectionContent.data
    });

  } catch (error) {
    console.error("getSectionContent error:", error);
    return res.status(500).json({ message: "Failed to fetch section content", error: error.message });
  }
}

};