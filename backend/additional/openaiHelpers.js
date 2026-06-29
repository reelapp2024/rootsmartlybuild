const { getResponseFromOpenAI } = require('../openAi/openAi');
const CreditWallet = require('../models/CreditWallet');
const CreditTransaction = require('../models/CreditTransaction');
const CreditSystemConfig = require('../models/CreditSystemConfig');
const mongoose = require('mongoose');

class CreditsError extends Error {
  constructor(message, statusCode = 402) {
    super(message);
    this.name = 'CreditsError';
    this.statusCode = statusCode;
  }
}

async function ensureSufficientCredits({
  userId,
  minCredits = 1,
  reason = 'AI generation'
}) {
  if (!userId || !mongoose.isValidObjectId(String(userId))) {
    throw new CreditsError('Authentication required', 401);
  }

  const wallet = await CreditWallet.findOneAndUpdate(
    { user_id: String(userId) },
    { $setOnInsert: { balance: 0, total_earned: 0, total_spent: 0 } },
    { upsert: true, new: true }
  ).lean();

  const required = Math.max(Number(minCredits || 0), 1);
  const balance = Number(wallet?.balance || 0);

  if (balance < required) {
    throw new CreditsError(`You have insufficient credits for ${reason}. Please buy credits.`, 402);
  }

  return { balance, required };
}

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
  if (userId) {
    await ensureSufficientCredits({
      userId,
      minCredits: 1,
      reason: label || 'OpenAI request'
    });
  }

  let raw, attempt;
  const maxAttempts = 3;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      raw = await getResponseFromOpenAI(prompt, model);

      if (userId && projectId) {
        await trackCreditsUsage({
          userId,
          projectId,
          usageType: 0,
          promptFrom: promptFrom || 'unknown',
          promptFor: promptFor || label || 'openai_request',
          pageId: pageId || projectId,
          inputTokens: raw.inputTokens || 0,
          outputTokens: raw.outputTokens || 0,
          pricing: raw.cost || 0,
          transactionType: 'debit',
          creditsAmount: 0,
          status: 1,
          is_retried: attempt > 1 ? 1 : 0
        });
      }

      return raw;
    } catch (err) {
      console.warn(`[getResponseFromOpenAITracked] ${label} attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        if (userId && projectId) {
          await trackCreditsUsage({
            userId,
            projectId,
            usageType: 0,
            promptFrom: promptFrom || 'unknown',
            promptFor: promptFor || label || 'openai_request',
            pageId: pageId || projectId,
            inputTokens: raw?.inputTokens || 0,
            outputTokens: raw?.outputTokens || 0,
            pricing: raw?.cost || 0,
            transactionType: 'debit',
            creditsAmount: 0,
            status: 0,
            is_retried: 1
          });
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
  if (userId) {
    await ensureSufficientCredits({
      userId,
      minCredits: 1,
      reason: label || 'OpenAI JSON generation'
    });
  }
  const parseJsonWithFallbacks = (rawText = "") => {
    const cleanFence = String(rawText || "").replace(/```json|```/gi, "").trim();
    const candidates = [];

    candidates.push(cleanFence);

    const firstBrace = cleanFence.indexOf("{");
    const lastBrace = cleanFence.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(cleanFence.slice(firstBrace, lastBrace + 1));
    }

    for (const candidate of candidates) {
      if (!candidate) continue;
      try {
        return JSON.parse(candidate);
      } catch (_) {
        // continue
      }

      try {
        const noTrailingCommas = candidate.replace(/,\s*([}\]])/g, "$1");
        return JSON.parse(noTrailingCommas);
      } catch (_) {
        // continue
      }
    }

    throw new Error("Invalid JSON format from OpenAI");
  };

  const repairJsonWithOpenAI = async (brokenText) => {
    const repairPrompt = `
Convert the following content into STRICT valid JSON object only.
Do not include markdown or explanation.
Preserve the same meaning and fields.

Content:
${String(brokenText || "").slice(0, 12000)}
`;

    const repairedRaw = await getResponseFromOpenAI(repairPrompt);
    return parseJsonWithFallbacks(repairedRaw?.text || "");
  };

  let raw, attempt;
  const maxAttempts = 3;

  for (attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Modify the prompt to make sure OpenAI knows to return only valid JSON
      const updatedPrompt = `${prompt}\n\nReturn ONLY the response as valid JSON. Don't include any other text, explanations, or markdown.`; // Updated prompt
      raw = await getResponseFromOpenAI(updatedPrompt);

      let parsed;
      try {
        parsed = parseJsonWithFallbacks(raw?.text || "");
      } catch (parseErr) {
        // Try one repair pass before failing the attempt
        parsed = await repairJsonWithOpenAI(raw?.text || "");
      }

      await trackCreditsUsage({
        userId,
        projectId,
        usageType: 0,
        promptFrom,
        promptFor,
        pageId,
        inputTokens: raw.inputTokens || 0,
        outputTokens: raw.outputTokens || 0,
        pricing: raw.cost || 0,
        transactionType: "debit",
        creditsAmount: 0,
        status: 1,
        is_retried: attempt > 1 ? 1 : 0,
      });

      return parsed;
    } catch (err) {
      console.warn(`[${label}] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        await trackCreditsUsage({
          userId,
          projectId,
          usageType: 0,
          promptFrom,
          promptFor,
          pageId,
          inputTokens: raw?.inputTokens || 0,
          outputTokens: raw?.outputTokens || 0,
          pricing: raw?.cost || 0,
          transactionType: "debit",
          creditsAmount: 0,
          status: 0,
          is_retried: 1,
        });
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
  if (userId) {
    await ensureSufficientCredits({
      userId,
      minCredits: 1,
      reason: label || 'OpenAI text generation'
    });
  }
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

      await trackCreditsUsage({
        userId,
        projectId,
        usageType: 0,
        promptFrom,
        promptFor,
        pageId,
        inputTokens: raw.inputTokens || 0,
        outputTokens: raw.outputTokens || 0,
        pricing: raw.cost || 0,
        transactionType: "debit",
        creditsAmount: 0,
        status: 1,
        is_retried: attempt > 1 ? 1 : 0,
      });

      return cleanAIString(cleaned);
    } catch (err) {
      console.warn(`[${label}] attempt ${attempt} failed: ${err.message}`);
      if (attempt === maxAttempts) {
        await trackCreditsUsage({
          userId,
          projectId,
          usageType: 0,
          promptFrom,
          promptFor,
          pageId,
          inputTokens: raw?.inputTokens || 0,
          outputTokens: raw?.outputTokens || 0,
          pricing: raw?.cost || 0,
          transactionType: "debit",
          creditsAmount: 0,
          status: 0,
          is_retried: 1,
        });
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
 * @param {Number} params.usageType - 0: OpenAI, 1: FreePik, 2: Images (Nano Banana), 3: Others
 * @param {String} params.promptFrom - Where the request came from
 * @param {String} params.promptFor - What the request is for
 * @param {String|ObjectId} params.pageId - Page ID
 * @param {Number} params.inputTokens - Input tokens (for OpenAI) or count (for others)
 * @param {Number} params.outputTokens - Output tokens (for OpenAI) or count (for others)
 * @param {Number} params.imagesCount - Optional number of images generated/fetched
 * @param {Number} params.pricing - Cost/pricing
 * @param {String} params.transactionType - debit/credit
 * @param {Number} params.creditsAmount - Transaction credit amount
 * @param {String} params.transactionId - Optional transaction identifier
 * @param {String|ObjectId|null} params.subscriptionPurchaseId - Optional purchase history id
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
  imagesCount = 0,
  pricing = 0,
  transactionType = 'debit',
  creditsAmount = 0,
  transactionId = "",
  subscriptionPurchaseId = null,
  status = 1,
  is_retried = 0
}) {
  if (!userId || !projectId) {
    console.warn('[CreditTransaction] Missing userId or projectId, skipping tracking');
    return;
  }

  try {
    const cfg = await CreditSystemConfig.findOne({ key: "default" }).lean();
    const usdToCredits = Math.max(0.0001, Number(cfg?.usd_to_credits || 100));
    const freepikPerImage = Math.max(0, Number(cfg?.freepik_credits_per_image ?? 1));
    const nanobananaPerImage = Math.max(0, Number(cfg?.nanobanana_credits_per_image ?? 1));
    const openaiInputPer1k = Math.max(0, Number(cfg?.openai_input_credits_per_1k_tokens ?? 0.5));
    const openaiOutputPer1k = Math.max(0, Number(cfg?.openai_output_credits_per_1k_tokens ?? 1));

    let inferredAmount = 0;
    if (Number(creditsAmount || 0) > 0) {
      inferredAmount = Number(creditsAmount);
    } else if (Number(usageType) === 0) {
      // OpenAI: deduct by input/output token policy; fallback to USD->credits if no tokens.
      const inCredits = (Number(inputTokens || 0) / 1000) * openaiInputPer1k;
      const outCredits = (Number(outputTokens || 0) / 1000) * openaiOutputPer1k;
      inferredAmount = inCredits + outCredits;
      if (inferredAmount <= 0 && Number(pricing || 0) > 0) {
        inferredAmount = Number(pricing) * usdToCredits;
      }
    } else if (Number(usageType) === 1) {
      // Freepik: per image credits
      inferredAmount = Math.max(0, Number(imagesCount || 0)) * freepikPerImage;
    } else if (Number(usageType) === 2) {
      // Nano Banana: per image credits
      inferredAmount = Math.max(0, Number(imagesCount || 0)) * nanobananaPerImage;
    } else {
      inferredAmount = Number(pricing) > 0 ? Number(pricing) * usdToCredits : Math.max(0, Number(outputTokens || 0));
    }
    inferredAmount = Number(inferredAmount || 0);
    const inferredTxnType = transactionType || (inferredAmount >= 0 ? 'debit' : 'credit');

    if (!mongoose.isValidObjectId(String(userId))) return;

    const wallet = await CreditWallet.findOneAndUpdate(
      { user_id: String(userId) },
      { $setOnInsert: { balance: 0, total_earned: 0, total_spent: 0 } },
      { upsert: true, new: true }
    );
    if (!wallet) return;

    let amount = Math.abs(inferredAmount);
    if (inferredTxnType === "debit" && amount <= 0) {
      if (Number(status || 0) === 1 && [1, 2].includes(Number(usageType))) {
        amount = Math.max(1, Number(imagesCount || 0), Number(outputTokens || 0));
      } else {
        // Do not create 0-amount debit usage rows
        return;
      }
    }
    const balanceAfter = inferredTxnType === "credit" ? wallet.balance + amount : Math.max(0, wallet.balance - amount);
    wallet.balance = balanceAfter;
    if (inferredTxnType === "credit") wallet.total_earned += amount;
    else wallet.total_spent += amount;
    await wallet.save();

    await CreditTransaction.create({
      user_id: String(userId),
      project_id: projectId || null,
      usage_type: Number(usageType ?? 3),
      type: inferredTxnType,
      amount,
      source: usageType === 2 ? "plugin" : "usage",
      reference_id: transactionId || subscriptionPurchaseId || null,
      prompt_from: promptFrom || "",
      prompt_for: promptFor || "",
      page_id: pageId || null,
      input_tokens: Number(inputTokens || 0),
      output_tokens: Number(outputTokens || 0),
      images_count: Number(imagesCount || 0),
      pricing: Number(pricing || 0),
      status: Number(status || 0) === 1 ? 1 : 0,
      is_retried: Number(is_retried || 0) === 1 ? 1 : 0,
      transaction_id: transactionId || "",
      subscription_purchase_id: subscriptionPurchaseId || null,
      balance_after: balanceAfter,
      meta: {
        usageType,
        projectId,
        promptFrom,
        promptFor,
        pageId,
        inputTokens,
        outputTokens,
        imagesCount,
        pricing,
        rateConfig: {
          usd_to_credits: usdToCredits,
          freepik_credits_per_image: freepikPerImage,
          nanobanana_credits_per_image: nanobananaPerImage,
          openai_input_credits_per_1k_tokens: openaiInputPer1k,
          openai_output_credits_per_1k_tokens: openaiOutputPer1k,
        },
        subscriptionPurchaseId,
        status,
        is_retried
      }
    });
  } catch (error) {
    console.error('[CreditTransaction] Error tracking usage:', error);
  }
}

module.exports = {
  retry,
  fetchJSONFromOpenAI,
  fetchStringFromOpenAI,
  fetchSeoContentForPage,
  trackCreditsUsage,
  getResponseFromOpenAITracked,
  ensureSufficientCredits,
  CreditsError
};
