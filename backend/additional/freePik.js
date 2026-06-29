const axios = require('axios');
const https = require('https');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const helper = require('./addon');
const { trackCreditsUsage, ensureSufficientCredits } = require('./openaiHelpers');

async function fetchFreepikImages(prompt, projectId, limit = 5, userId = null, pageId = null, promptFrom = 'freePik', promptFor = 'imageFetch') {
  const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY; // Ensure API key is set in environment
  const FREEPIK_HOSTS_ALLOW = new Set(['img.freepik.com', 'images.freepik.com']);
  const WEBP_OPTS = {
    quality: 93,
    alphaQuality: 100,
    effort: 6,
    smartSubsample: true,
  };
  const folderPath = `public/images/${projectId}`;
  // BASE_URL for images - must be apis.smartlybuild.dev
  const BASE_URL = process.env.BASE_URL || 'https://apis.smartlybuild.dev';

  // Normalize Freepik URL
  function normalizeFreepikUrl(raw) {
    try {
      const u = new URL(raw);
      if (!FREEPIK_HOSTS_ALLOW.has(u.hostname)) {
        u.hostname = 'img.freepik.com';
      }
      u.protocol = 'https:';
      u.port = '';
      return u.toString();
    } catch {
      return raw;
    }
  }

  // Fetch image buffer with retry
  async function fetchImageBuffer(url) {
    const httpsAgent = new https.Agent({ keepAlive: true, family: 4 });
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': 'https://www.freepik.com/'
    };

    const tryFetch = () =>
      axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxRedirects: 5,
        httpsAgent,
        headers,
        validateStatus: (s) => s >= 200 && s < 400
      });

    try {
      return await tryFetch();
    } catch (e) {
      const nurl = normalizeFreepikUrl(url);
      if (nurl !== url) {
        return await axios.get(nurl, {
          responseType: 'arraybuffer',
          timeout: 30000,
          maxRedirects: 5,
          httpsAgent,
          headers,
          validateStatus: (s) => s >= 200 && s < 400
        });
      }
      throw e;
    }
  }

  try {
    if (userId) {
      await ensureSufficientCredits({
        userId,
        usageType: 1,
        imagesCount: Math.max(1, Number(limit) || 1),
        minCredits: 1,
        reason: 'Freepik image fetch'
      });
    }

    // Fetch images from Freepik API
    const res = await axios.get('https://api.freepik.com/v1/resources', {
      headers: { 'x-freepik-api-key': FREEPIK_API_KEY },
      params: {
        order: 'relevance',
        'filters[orientation][landscape]': 1,
        page: 1,
        limit: limit,
        term: `Real looking ${prompt}`
      }
    });

    console.log('Freepik status:', res.status, 'body:', res.data);

    const items = res?.data?.data || [];
    const images = await Promise.all(
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
            console.error(`[freePik] ❌ File missing after upload: ${physicalPath}`);
            throw new Error('File was not saved to disk');
          }
          
          // Ensure proper URL construction - BASE_URL is https://apis.smartlybuild.dev
          const filePath = `${BASE_URL}/images/${projectId}/${fileName}`;
          console.log(`[freePik] ✅ Image URL saved: ${filePath}`);

          // Only return URL if upload was successful
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

    const result = images.filter(Boolean);
    if (!result.length) {
      console.warn('No Freepik images returned — check your key, endpoint, quota, or ISP/CDN blocking.');
    }

    // Track usage if userId is provided
    if (userId && projectId) {
      await trackCreditsUsage({
        userId,
        projectId,
        usageType: 1, // 1 for FreePik
        promptFrom,
        promptFor,
        pageId: pageId || projectId,
        inputTokens: 1, // Count as 1 API call
        outputTokens: result.length, // Number of images fetched
        imagesCount: result.length,
        pricing: 0, // FreePik pricing can be calculated based on API plan
        status: result.length > 0 ? 1 : 0,
        is_retried: 0
      });
    }

    return result;
  } catch (err) {
    console.error('Freepik API failed:', err?.message || err);
    
    // Track failed usage if userId is provided
    if (userId && projectId) {
      await trackCreditsUsage({
        userId,
        projectId,
        usageType: 1, // 1 for FreePik
        promptFrom: promptFrom || 'freePik',
        promptFor: promptFor || 'imageFetch',
        pageId: pageId || projectId,
        inputTokens: 1,
        outputTokens: 0,
        imagesCount: 0,
        pricing: 0,
        status: 0, // Failed
        is_retried: 0
      });
    }
    
    return [];
  }
}

module.exports = fetchFreepikImages;