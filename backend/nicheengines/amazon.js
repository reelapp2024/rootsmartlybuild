/**
 * Amazon affiliate / product-density signals for Content Website analysis.
 *
 * With credentials (AMAZON_API_MODE=true + PA-API keys + partner tag):
 *   → Amazon Product Advertising API 5.0 SearchItems
 *
 * Without credentials (always works):
 *   → Amazon autocomplete suggestions (public, no auth)
 *   → Google CSE site:amazon.com (if GOOGLE_API_KEY set)
 *   → OpenAI affiliate/product-density estimate
 */

const crypto = require('crypto');
const axios = require('axios');

const LOG = '[NicheAnalysis][Amazon]';

function isAmazonApiMode() {
  return String(process.env.AMAZON_API_MODE || '').toLowerCase() === 'true';
}

function hasAmazonCredentials() {
  return Boolean(
    process.env.AMAZON_PAAPI_ACCESS_KEY &&
      process.env.AMAZON_PAAPI_SECRET_KEY &&
      process.env.AMAZON_PAAPI_PARTNER_TAG
  );
}

function levelFromScore(n) {
  if (n >= 70) return 'High';
  if (n >= 40) return 'Medium';
  return 'Low';
}

/** Marketplace host → PA-API endpoint host + region */
const MARKETPLACE_MAP = {
  'www.amazon.com': { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com' },
  'amazon.com': { host: 'webservices.amazon.com', region: 'us-east-1', marketplace: 'www.amazon.com' },
  'www.amazon.co.uk': { host: 'webservices.amazon.co.uk', region: 'eu-west-1', marketplace: 'www.amazon.co.uk' },
  'www.amazon.de': { host: 'webservices.amazon.de', region: 'eu-west-1', marketplace: 'www.amazon.de' },
  'www.amazon.in': { host: 'webservices.amazon.in', region: 'eu-west-1', marketplace: 'www.amazon.in' },
  'www.amazon.ca': { host: 'webservices.amazon.ca', region: 'us-east-1', marketplace: 'www.amazon.ca' },
  'www.amazon.com.au': { host: 'webservices.amazon.com.au', region: 'us-west-2', marketplace: 'www.amazon.com.au' },
};

function resolveMarketplace(country = 'US') {
  const envMp = String(process.env.AMAZON_PAAPI_MARKETPLACE || '').trim();
  if (envMp && MARKETPLACE_MAP[envMp]) return MARKETPLACE_MAP[envMp];

  const c = String(country || 'US').trim().toUpperCase();
  if (c.includes('UK') || c.includes('UNITED KINGDOM') || c === 'GB') {
    return MARKETPLACE_MAP['www.amazon.co.uk'];
  }
  if (c.includes('IN') || c === 'INDIA') return MARKETPLACE_MAP['www.amazon.in'];
  if (c.includes('CA') || c === 'CANADA') return MARKETPLACE_MAP['www.amazon.ca'];
  if (c.includes('AU') || c === 'AUSTRALIA') return MARKETPLACE_MAP['www.amazon.com.au'];
  if (c.includes('DE') || c === 'GERMANY') return MARKETPLACE_MAP['www.amazon.de'];
  return MARKETPLACE_MAP['www.amazon.com'];
}

function hmac(key, data, encoding) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest(encoding);
}

function hashSha256(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Amazon PA-API 5 SearchItems (AWS Sig V4).
 */
async function searchItemsPaapi({ keyword, country }) {
  const accessKey = process.env.AMAZON_PAAPI_ACCESS_KEY;
  const secretKey = process.env.AMAZON_PAAPI_SECRET_KEY;
  const partnerTag = process.env.AMAZON_PAAPI_PARTNER_TAG;
  const mp = resolveMarketplace(country);
  const region = process.env.AMAZON_PAAPI_REGION || mp.region;
  const host = mp.host;
  const path = '/paapi5/searchitems';
  const service = 'ProductAdvertisingAPI';

  const payloadObj = {
    Keywords: String(keyword).trim(),
    Resources: [
      'ItemInfo.Title',
      'ItemInfo.Features',
      'Offers.Listings.Price',
      'CustomerReviews.Count',
      'CustomerReviews.StarRating',
      'BrowseNodeInfo.BrowseNodes',
    ],
    PartnerTag: partnerTag,
    PartnerType: 'Associates',
    Marketplace: mp.marketplace,
    ItemCount: 10,
  };
  const payload = JSON.stringify(payloadObj);

  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const contentType = 'application/json; charset=utf-8';
  const target = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';

  const canonicalHeaders =
    `content-encoding:amz-1.0\n` +
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-date:${amzDate}\n` +
    `x-amz-target:${target}\n`;
  const signedHeaders = 'content-encoding;content-type;host;x-amz-date;x-amz-target';
  const canonicalRequest = [
    'POST',
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    hashSha256(payload),
  ].join('\n');

  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    hashSha256(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const { data } = await axios.post(`https://${host}${path}`, payload, {
    headers: {
      'Content-Encoding': 'amz-1.0',
      'Content-Type': contentType,
      Host: host,
      'X-Amz-Date': amzDate,
      'X-Amz-Target': target,
      Authorization: authorization,
    },
    timeout: 20000,
  });

  const items = Array.isArray(data?.SearchResult?.Items) ? data.SearchResult.Items : [];
  const products = items.slice(0, 8).map((item) => {
    const title = item?.ItemInfo?.Title?.DisplayValue || '';
    const price =
      item?.Offers?.Listings?.[0]?.Price?.DisplayAmount ||
      item?.Offers?.Listings?.[0]?.Price?.Amount ||
      null;
    const rating = item?.CustomerReviews?.StarRating?.Value ?? null;
    const reviewCount = item?.CustomerReviews?.Count ?? null;
    return {
      asin: item.ASIN,
      title: String(title).slice(0, 120),
      price,
      rating,
      reviewCount,
      url: item.DetailPageURL || null,
    };
  });

  const withReviews = products.filter((p) => typeof p.reviewCount === 'number');
  const avgReviews =
    withReviews.length > 0
      ? Math.round(withReviews.reduce((s, p) => s + p.reviewCount, 0) / withReviews.length)
      : null;

  let score = 35 + Math.min(30, products.length * 4);
  if (avgReviews != null) {
    if (avgReviews >= 1000) score += 22;
    else if (avgReviews >= 100) score += 14;
    else if (avgReviews >= 20) score += 7;
  }
  score = Math.min(95, Math.max(15, score));

  return {
    mode: 'amazon_paapi',
    dataLabel: 'real',
    level: levelFromScore(score),
    score,
    productCount: products.length,
    avgReviews,
    marketplace: mp.marketplace,
    sampleProducts: products,
    note: 'Live Amazon PA-API 5 SearchItems',
  };
}

/** Public Amazon autocomplete — no credentials */
async function fetchAmazonSuggest(keyword, country = 'US') {
  const q = String(keyword || '').trim();
  if (!q) return [];

  // Marketplace IDs for common locales
  const midMap = {
    US: 'ATVPDKIKX0DER',
    UK: 'A1F83G8C2ARO7P',
    GB: 'A1F83G8C2ARO7P',
    IN: 'A21TJRUUN4KGV',
    CA: 'A2EUQ1WTGCTBG2',
    AU: 'A39IBJ37TRP1C6',
    DE: 'A1PA6795UKMFR9',
  };
  const key = String(country || 'US').trim().toUpperCase();
  let mid = midMap.US;
  if (key.includes('UK') || key === 'GB' || key.includes('UNITED KINGDOM')) mid = midMap.UK;
  else if (key.includes('IN') || key === 'INDIA') mid = midMap.IN;
  else if (key.includes('CA') || key === 'CANADA') mid = midMap.CA;
  else if (key.includes('AU') || key === 'AUSTRALIA') mid = midMap.AU;
  else if (key.includes('DE') || key === 'GERMANY') mid = midMap.DE;

  try {
    const { data } = await axios.get(
      'https://completion.amazon.com/api/2017/suggestions',
      {
        params: {
          mid,
          alias: 'aps',
          prefix: q,
          'suggestion-type': ['WIDGET', 'KEYWORD'],
          limit: 12,
        },
        timeout: 10000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; SmartlyBuildNicheBot/1.0)',
        },
      }
    );
    const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
    return suggestions
      .map((s) => String(s?.value || s?.keyword || '').trim())
      .filter(Boolean)
      .slice(0, 12);
  } catch (err) {
    console.warn(`${LOG} Amazon Suggest failed:`, err.message);
    return [];
  }
}

async function searchViaGoogleCse(keyword) {
  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!key || !cx) return null;

  const { data } = await axios.get('https://www.googleapis.com/customsearch/v1', {
    params: {
      key,
      cx,
      q: `${String(keyword).trim()} site:amazon.com`,
      num: 8,
    },
    timeout: 12000,
  });

  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    resultCount: items.length,
    totalEstimated: Number(data?.searchInformation?.totalResults) || items.length,
    samples: items.slice(0, 5).map((i) => ({
      title: i.title,
      link: i.link,
      snippet: i.snippet,
    })),
  };
}

async function estimateWithOpenAI({ keyword, categoryName, userId, suggestions, cse }) {
  try {
    const { fetchJSONFromOpenAI } = require('../additional/openaiHelpers');
    return await fetchJSONFromOpenAI(
      `Estimate Amazon affiliate / product-density potential for a content niche.

Return ONLY JSON:
{
  "score": 58,
  "level": "High|Medium|Low",
  "summary": "2 sentences",
  "productAngles": ["3 product/affiliate angles"],
  "commercialIntent": "High|Medium|Low"
}

Rules:
- score integer 18-92 (never 0)
- High when many buyable products + clear affiliate path
- Keyword: "${keyword}"
- Category: ${categoryName || 'n/a'}
- Amazon Suggest: ${JSON.stringify(suggestions.slice(0, 8))}
- Google CSE amazon hits: ${cse ? JSON.stringify({ count: cse.resultCount, totalEstimated: cse.totalEstimated }) : 'n/a'}
`,
      'AMAZON_NICHE_ESTIMATE',
      {
        userId: userId ? String(userId) : undefined,
        promptFrom: 'nicheengines/amazon',
        promptFor: `Amazon estimate - ${keyword}`,
      }
    );
  } catch (err) {
    console.warn(`${LOG} OpenAI estimate failed:`, err.message);
    return null;
  }
}

/**
 * Main entry — Amazon affiliate signals for a niche keyword.
 */
async function getAmazonSignals({
  keyword,
  country = 'US',
  categoryName = '',
  userId = null,
} = {}) {
  const q = String(keyword || '').trim();
  if (!q) {
    return {
      mode: 'none',
      dataLabel: 'estimate',
      level: 'Low',
      score: null,
      error: 'Keyword required',
    };
  }

  console.log(`${LOG} Decision:`, {
    keyword: q,
    country,
    AMAZON_API_MODE: isAmazonApiMode(),
    credentialsPresent: hasAmazonCredentials(),
    willTryPaapi: isAmazonApiMode() && hasAmazonCredentials(),
  });

  if (isAmazonApiMode() && hasAmazonCredentials()) {
    try {
      console.log(`${LOG} Calling Amazon PA-API SearchItems…`);
      const t0 = Date.now();
      const result = await searchItemsPaapi({ keyword: q, country });
      console.log(`${LOG} PA-API OK (${Date.now() - t0}ms):`, {
        score: result.score,
        level: result.level,
        productCount: result.productCount,
        avgReviews: result.avgReviews,
      });
      return result;
    } catch (err) {
      console.warn(
        `${LOG} PA-API failed → fallback:`,
        err.response?.data || err.message
      );
    }
  } else {
    console.log(
      `${LOG} PA-API skipped — ${
        !isAmazonApiMode()
          ? 'AMAZON_API_MODE is false'
          : 'PA-API credentials missing (ACCESS_KEY / SECRET_KEY / PARTNER_TAG)'
      }`
    );
  }

  // ---- No-credentials / fallback path ----
  console.log(`${LOG} Fallback: Amazon Suggest + optional CSE + OpenAI…`);
  const suggestions = await fetchAmazonSuggest(q, country);
  console.log(`${LOG} Suggest:`, { count: suggestions.length, sample: suggestions.slice(0, 6) });

  let cse = null;
  try {
    cse = await searchViaGoogleCse(q);
    if (cse) {
      console.log(`${LOG} CSE OK:`, {
        resultCount: cse.resultCount,
        totalEstimated: cse.totalEstimated,
      });
    }
  } catch (err) {
    console.warn(`${LOG} CSE failed:`, err.message);
  }

  const ai = await estimateWithOpenAI({
    keyword: q,
    categoryName,
    userId,
    suggestions,
    cse,
  });

  // Continuous score from suggest depth + CSE + AI
  let score =
    suggestions.length >= 10
      ? 68
      : suggestions.length >= 6
        ? 55
        : suggestions.length >= 3
          ? 42
          : 28;
  score += Math.min(10, String(q).split(/\s+/).length * 2);
  if (cse) {
    const total = cse.totalEstimated || 0;
    if (total > 50000) score += 12;
    else if (total > 5000) score += 7;
    else if (total > 500) score += 3;
  }
  if (ai?.score && Number(ai.score) > 0) {
    score = Math.round(score * 0.4 + Number(ai.score) * 0.6);
  }
  score = Math.min(92, Math.max(18, Math.round(score)));

  const result = {
    mode: 'hybrid_fallback',
    dataLabel: 'estimate',
    level: ai?.level || levelFromScore(score),
    score,
    commercialIntent: ai?.commercialIntent || levelFromScore(score),
    summary:
      ai?.summary ||
      `Amazon product density estimated from Suggest (${suggestions.length} terms) — no PA-API credentials.`,
    productAngles: Array.isArray(ai?.productAngles) ? ai.productAngles.slice(0, 3) : [],
    suggestions: suggestions.slice(0, 10),
    cse: cse
      ? {
          resultCount: cse.resultCount,
          totalEstimated: cse.totalEstimated,
          samples: cse.samples,
        }
      : null,
    note: 'No PA-API keys — used Amazon Suggest + CSE (if available) + OpenAI',
  };

  console.log(`${LOG} Fallback RESULT:`, {
    mode: result.mode,
    score: result.score,
    level: result.level,
    suggestCount: suggestions.length,
    hasCse: Boolean(cse),
    hasAi: Boolean(ai),
  });

  return result;
}

module.exports = {
  getAmazonSignals,
  isAmazonApiMode,
  hasAmazonCredentials,
  fetchAmazonSuggest,
  resolveMarketplace,
};
