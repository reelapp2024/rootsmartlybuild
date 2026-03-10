const { getResponseFromOpenAI } = require('../openAi/openAi');
const CreditsUsage = require('../models/CreditsUsage');

/**
 * Wrapper for getResponseFromOpenAI that automatically tracks credits usage
 * Use this instead of calling getResponseFromOpenAI directly
 * @param {String} prompt - The prompt to send to OpenAI
 * @param {String} label - Label for the operation (e.g., 'ContentGeneration', 'TextRewrite')
 * @param {Object} trackingParams - Tracking parameters
 * @param {String|ObjectId} trackingParams.userId - User ID (required)
 * @param {String|ObjectId} trackingParams.projectId - Project ID (required)
 * @param {String|ObjectId} trackingParams.pageId - Page ID (optional, defaults to projectId)
 * @param {String} trackingParams.promptFrom - Where the request came from (e.g., 'project_creation', 'builder')
 * @param {String} trackingParams.promptFor - What the request is for (e.g., 'content_generation', 'text_rewrite')
 * @param {String} trackingParams.model - Model to use (optional, defaults to 'gpt-3.5-turbo')
 * @returns {Promise<Object>} OpenAI response with text, tokens, and cost
 */
async function getResponseFromOpenAITracked(
  prompt,
  label,
  { userId, projectId, pageId, promptFrom, promptFor, model = 'gpt-3.5-turbo' }
) {
  if (!userId || !projectId) {
    console.warn(`[getResponseFromOpenAITracked] Missing userId or projectId for label: ${label}. Tracking will be skipped.`);
  }

  let raw, attempt;
  const maxAttempts = 3;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      raw = await getResponseFromOpenAI(prompt, model);

      // Track successful usage
      if (userId && projectId) {
        await CreditsUsage.findOneAndUpdate(
          { userId, projectId },
          {
            $push: {
              usageData: {
                usageType: 0, // 0 for OpenAI
                promptFrom: promptFrom || 'unknown',
                promptFor: promptFor || label || 'openai_request',
                pageId: pageId || projectId,
                inputTokens: raw.inputTokens || 0,
                outputTokens: raw.outputTokens || 0,
                pricing: raw.cost || 0,
                is_retried: attempt > 1 ? 1 : 0,
                status: 1,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          },
          { upsert: true, setDefaultsOnInsert: true }
        ).catch(console.error);
      }

      return raw;
    } catch (err) {
      console.warn(`[getResponseFromOpenAITracked] ${label} attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        // Track failed usage
        if (userId && projectId) {
          await CreditsUsage.findOneAndUpdate(
            { userId, projectId },
            {
              $push: {
                usageData: {
                  usageType: 0, // 0 for OpenAI
                  promptFrom: promptFrom || 'unknown',
                  promptFor: promptFor || label || 'openai_request',
                  pageId: pageId || projectId,
                  inputTokens: raw?.inputTokens || 0,
                  outputTokens: raw?.outputTokens || 0,
                  pricing: raw?.cost || 0,
                  is_retried: 1,
                  status: 0, // Failed
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              }
            },
            { upsert: true, setDefaultsOnInsert: true }
          ).catch(console.error);
        }
        throw err;
      }
    }
  }
}


async function retry(fn, args = [], max = 3, label = 'operation') {
  let lastErr;
  for (let attempt = 1; attempt <= max; attempt++) {
    try {
      const result = await fn(...args);
      return { result, attempt };
    } catch (e) {
      lastErr = e;
      console.warn(`[${label}] attempt ${attempt} failed: ${e.message}`);
    }
  }
  throw lastErr;
}

function cleanAIString(str) {
  if (typeof str !== 'string') return '';

  return str
    .replace(/^"+|"+$/g, '')   // remove starting/ending quotes
    .replace(/\\"/g, '"')      // unescape quotes
    .replace(/\\n/g, ' ')      // remove \n (escaped newline)
    .replace(/\n/g, ' ')       // remove actual newlines
    .trim();                   // remove spaces
}



const fetchJSONFromOpenAI = async (
  prompt,
  label,
  { userId, projectId, pageId, promptFrom, promptFor }
) => {
  let raw, attempt;
  const maxAttempts = 3;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Modify the prompt to make sure OpenAI knows to return only valid JSON
      const updatedPrompt = `${prompt}\n\nReturn ONLY the response as valid JSON. Don't include any other text, explanations, or markdown.`; // Updated prompt
      raw = await getResponseFromOpenAI(updatedPrompt);

      const cleaned = raw.text.replace(/```json|```/g, '').trim(); // Clean response if OpenAI returns code blocks
      const parsed = JSON.parse(cleaned); // Try parsing JSON

      // If JSON is valid, log success and return
      await CreditsUsage.findOneAndUpdate(
        { userId, projectId },
        {
          $push: {
            usageData: {
              usageType: 0, // 0 for OpenAI
              promptFrom,
              promptFor,
              pageId,
              inputTokens: raw.inputTokens,
              outputTokens: raw.outputTokens,
              pricing: raw.cost,
              is_retried: attempt > 1 ? 1 : 0,
              status: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      ).catch(console.error);

      return parsed;
    } catch (err) {
      console.warn(`[${label}] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        // Log failure on last attempt
        await CreditsUsage.findOneAndUpdate(
          { userId, projectId },
          {
            $push: {
              usageData: {
                usageType: 0, // 0 for OpenAI
                promptFrom,
                promptFor,
                pageId,
                inputTokens: raw?.inputTokens || 0,
                outputTokens: raw?.outputTokens || 0,
                pricing: raw?.cost || 0,
                is_retried: 1,
                status: 0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          },
          { upsert: true, setDefaultsOnInsert: true }
        ).catch(console.error);
        throw err;
      }
    }
  }
};


async function fetchStringFromOpenAI(
  prompt,
  label,
  { userId, projectId, pageId, promptFrom, promptFor }
) {
  let raw, attempt;
  const maxAttempts = 3;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      raw = await getResponseFromOpenAI(prompt);
      const cleaned = raw.text.replace(/```|\n/g, '').trim();

      // Check if string is valid (not empty or whitespace)
      if (!cleaned) {
        throw new Error('Empty or invalid string response');
      }

      // If string is valid, log success and return
      await CreditsUsage.findOneAndUpdate(
        { userId, projectId },
        {
          $push: {
            usageData: {
              usageType: 0, // 0 for OpenAI
              promptFrom,
              promptFor,
              pageId,
              inputTokens: raw.inputTokens,
              outputTokens: raw.outputTokens,
              pricing: raw.cost,
              is_retried: attempt > 1 ? 1 : 0,
              status: 1,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        },
        { upsert: true, setDefaultsOnInsert: true }
      ).catch(console.error);

      return cleanAIString(cleaned);
    } catch (err) {
      console.warn(`[${label}] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        // Log failure on last attempt
        await CreditsUsage.findOneAndUpdate(
          { userId, projectId },
          {
            $push: {
              usageData: {
                usageType: 0, // 0 for OpenAI
                promptFrom,
                promptFor,
                pageId,
                inputTokens: raw?.inputTokens || 0,
                outputTokens: raw?.outputTokens || 0,
                pricing: raw?.cost || 0,
                is_retried: 1,
                status: 0,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            }
          },
          { upsert: true, setDefaultsOnInsert: true }
        ).catch(console.error);
        throw err;
      }
    }
  }
}


async function fetchSeoContentForPage(
  pageName,
  serviceType,
  projectName,
  { userId, projectId, pageId, promptFrom, promptFor }
) {
  const prompt = `Generate SEO meta tags for a webpage about "${pageName}". 
  Include a meta title, description, and keywords relevant to the service "${serviceType}" and project "${projectName}". 
  Format as JSON with fields: meta_title, meta_description, meta_keywords.`;

  return fetchJSONFromOpenAI(
    prompt,
    `SEOContent-${pageName}`,
    { userId, projectId, pageId, promptFrom, promptFor }
  );
}

/**
 * Helper function to track credits usage for any service
 * @param {Object} params - Usage tracking parameters
 * @param {String|ObjectId} params.userId - User ID
 * @param {String|ObjectId} params.projectId - Project ID
 * @param {Number} params.usageType - 0: OpenAI, 1: FreePik, 2: Others
 * @param {String} params.promptFrom - Where the request came from
 * @param {String} params.promptFor - What the request is for
 * @param {String|ObjectId} params.pageId - Page ID
 * @param {Number} params.inputTokens - Input tokens (for OpenAI) or count (for others)
 * @param {Number} params.outputTokens - Output tokens (for OpenAI) or count (for others)
 * @param {Number} params.pricing - Cost/pricing
 * @param {Number} params.status - 1: success, 0: failure
 * @param {Number} params.is_retried - 1: retried, 0: not retried
 */
async function trackCreditsUsage({
  userId,
  projectId,
  usageType,
  promptFrom,
  promptFor,
  pageId,
  inputTokens = 0,
  outputTokens = 0,
  pricing = 0,
  status = 1,
  is_retried = 0
}) {
  if (!userId || !projectId) {
    console.warn('[CreditsUsage] Missing userId or projectId, skipping tracking');
    return;
  }

  try {
    await CreditsUsage.findOneAndUpdate(
      { userId, projectId },
      {
        $push: {
          usageData: {
            usageType,
            promptFrom,
            promptFor,
            pageId,
            inputTokens,
            outputTokens,
            pricing,
            is_retried,
            status,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      },
      { upsert: true, setDefaultsOnInsert: true }
    ).catch(console.error);
  } catch (error) {
    console.error('[CreditsUsage] Error tracking usage:', error);
  }
}

module.exports = {
  retry,
  fetchJSONFromOpenAI,
  fetchStringFromOpenAI,
  fetchSeoContentForPage,
  trackCreditsUsage,
  getResponseFromOpenAITracked
};
