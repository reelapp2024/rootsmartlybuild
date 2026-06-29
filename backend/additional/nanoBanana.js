const axios = require('axios');
const https = require('https');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const helper = require('./addon');
const { ensureSufficientCredits } = require('./openaiHelpers');

/**
 * Generate AI images using Nano Banana API
 * @param {string} prompt - Image generation prompt
 * @param {string} projectId - Project ID for file organization
 * @param {number} count - Number of images to generate (default: 1)
 * @param {object} options - Additional generation options
 * @returns {Promise<Array>} Array of image objects with URLs
 */
async function generateNanoBananaImages(prompt, projectId, count = 1, options = {}) {
  const NANO_BANANA_API_KEY = process.env.NANO_BANANA_API_KEY;
  const WEBP_OPTS = {
    quality: 93,
    alphaQuality: 100,
    effort: 6,
    smartSubsample: true,
  };
  const folderPath = `public/images/${projectId}`;
  const BASE_URL = process.env.BASE_URL || 'https://apis.smartlybuild.dev';

  if (!NANO_BANANA_API_KEY) {
    console.error('[Nano Banana] API key not configured');
    return [];
  }

  // Default generation options
  const generationOptions = {
    model: options.model || 'stable-diffusion-xl', // Default model
    width: options.width || 1024,
    height: options.height || 1024,
    steps: options.steps || 30,
    guidance_scale: options.guidance_scale || 7.5,
    negative_prompt: options.negative_prompt || 'blurry, bad quality, distorted, watermark, text',
    num_images: Math.min(Math.max(count, 1), 4), // Limit 1-4 images per request
    ...options
  };

  console.log(`[Nano Banana] Generating ${generationOptions.num_images} image(s) with prompt: "${prompt}"`);

  try {
    if (options?.userId) {
      await ensureSufficientCredits({
        userId: options.userId,
        usageType: 2,
        imagesCount: Math.max(1, Number(count) || 1),
        minCredits: 1,
        reason: 'NanoBanana image generation'
      });
    }

    // Nano Banana API endpoint (adjust based on actual API documentation)
    // The API requires an application ID in the URL path
    // Format: https://api.nanobanana.ai/v1/applications/{app_id}/generate
    // Set NANO_BANANA_API_URL in .env to override (use {app_id} placeholder)
    // OR set NANO_BANANA_APPLICATION_ID and use default URL
    let apiUrl = process.env.NANO_BANANA_API_URL;
    
    // Get application ID from env or options
    const applicationId = process.env.NANO_BANANA_APPLICATION_ID || options.applicationId;
    
    // If no custom URL is set, use default and require application ID
    if (!apiUrl) {
      if (!applicationId) {
        throw new Error(
          'NANO_BANANA_APPLICATION_ID is required. ' +
          'Please set it in your .env file. ' +
          'The Nano Banana API requires an application ID in the URL path: ' +
          'https://api.nanobanana.ai/v1/applications/{your_app_id}/generate'
        );
      }
      // Default URL with application ID
      apiUrl = `https://api.nanobanana.ai/v1/applications/${applicationId}/generate`;
    } else {
      // Custom URL provided - check if it needs application ID
      if (apiUrl.includes('{app_id}')) {
        if (!applicationId) {
          throw new Error(
            'NANO_BANANA_APPLICATION_ID is required because your NANO_BANANA_API_URL contains {app_id} placeholder. ' +
            'Please set NANO_BANANA_APPLICATION_ID in your .env file.'
          );
        }
        apiUrl = apiUrl.replace('{app_id}', applicationId);
      } else if (!apiUrl.includes('/applications/')) {
        // Old format URL without /applications/ - require application ID and fix URL
        if (!applicationId) {
          throw new Error(
            'NANO_BANANA_APPLICATION_ID is required. ' +
            'The Nano Banana API requires an application ID in the URL path. ' +
            'Please set NANO_BANANA_APPLICATION_ID in your .env file. ' +
            'The URL will be automatically updated from: ' + apiUrl + ' ' +
            'to: ' + apiUrl.replace(/\/generate.*$/, '').replace(/\/$/, '') + '/applications/{your_app_id}/generate'
          );
        }
        // Automatically fix the URL to include application ID
        const oldUrl = apiUrl;
        const baseUrl = apiUrl.replace(/\/generate.*$/, '').replace(/\/$/, '');
        apiUrl = `${baseUrl}/applications/${applicationId}/generate`;
        console.log(`[Nano Banana] 🔧 Detected old URL format: ${oldUrl}`);
        console.log(`[Nano Banana] ✅ Auto-fixed URL format: ${apiUrl}`);
      }
    }
    
    if (!apiUrl || apiUrl.trim() === '') {
      throw new Error('NANO_BANANA_API_URL is not configured. Please set it in your .env file.');
    }
    
    // Validate URL format - check if it's the old format without application ID
    if (apiUrl.includes('api.nanobanana.ai') && 
        apiUrl.includes('/v1/generate') && 
        !apiUrl.includes('/applications/') && 
        !applicationId) {
      console.warn('[Nano Banana] ⚠️  Warning: Using old API endpoint format without application ID.');
      console.warn('[Nano Banana] The API requires an application ID. Please set NANO_BANANA_APPLICATION_ID in your .env file.');
      console.warn('[Nano Banana] The URL will be automatically updated to include the application ID.');
    }

    // SSL verification setting (can be overridden via env var)
    // Default to false (allow self-signed/invalid certs) due to Railway/proxy certificate issues
    // Set NANO_BANANA_REJECT_UNAUTHORIZED=true to enable strict SSL verification
    const rejectUnauthorized = process.env.NANO_BANANA_REJECT_UNAUTHORIZED === 'true';

    // Create HTTPS agent with configurable SSL verification
    const httpsAgent = new https.Agent({
      rejectUnauthorized: rejectUnauthorized,
      keepAlive: true,
      family: 4 // Force IPv4
    });

    console.log(`[Nano Banana] Calling API: ${apiUrl} (SSL verification: ${rejectUnauthorized})`);
    if (applicationId) {
      console.log(`[Nano Banana] Using Application ID: ${applicationId}`);
    }
    
    // Prepare request payload
    const requestPayload = {
      prompt: prompt,
      ...generationOptions
    };
    
    console.log(`[Nano Banana] Request payload:`, JSON.stringify(requestPayload, null, 2));

    // Prepare headers
    const headers = {
      'Authorization': `Bearer ${NANO_BANANA_API_KEY}`,
      'Content-Type': 'application/json'
    };
    
    // Add application ID to headers if provided (some APIs require it in headers instead of URL)
    if (applicationId && !apiUrl.includes('/applications/')) {
      headers['X-Application-Id'] = applicationId;
      // Some APIs might use different header names
      headers['Application-Id'] = applicationId;
    }

    const response = await axios.post(
      apiUrl,
      requestPayload,
      {
        headers: headers,
        timeout: 120000, // 2 minutes timeout for image generation
        httpsAgent: httpsAgent,
        validateStatus: function (status) {
          return status >= 200 && status < 500; // Accept all status codes except 500+
        }
      }
    );

    console.log('[Nano Banana] API Response Status:', response.status);
    console.log('[Nano Banana] API Response Data:', JSON.stringify(response.data, null, 2));

    // Handle 404 - endpoint not found
    if (response.status === 404) {
      const errorMessage = response.data?.message || '';
      const isApplicationNotFound = errorMessage.toLowerCase().includes('application');
      
      console.error('[Nano Banana] ❌ API Error (404):', errorMessage);
      console.error('[Nano Banana] Current endpoint:', apiUrl);
      
      if (isApplicationNotFound) {
        console.error('[Nano Banana] ⚠️  SOLUTION REQUIRED:');
        console.error('[Nano Banana] The Nano Banana API requires an application ID in the URL.');
        console.error('[Nano Banana]');
        console.error('[Nano Banana] Option 1: Set NANO_BANANA_APPLICATION_ID in your .env file:');
        console.error('[Nano Banana]   NANO_BANANA_APPLICATION_ID=your_application_id_here');
        console.error('[Nano Banana]');
        console.error('[Nano Banana] Option 2: Set NANO_BANANA_API_URL with application ID:');
        console.error('[Nano Banana]   NANO_BANANA_API_URL=https://api.nanobanana.ai/v1/applications/{app_id}/generate');
        console.error('[Nano Banana]   NANO_BANANA_APPLICATION_ID=your_application_id_here');
        console.error('[Nano Banana]');
        console.error('[Nano Banana] Expected URL format:');
        console.error('[Nano Banana]   https://api.nanobanana.ai/v1/applications/YOUR_APP_ID/generate');
        
        throw new Error(
          `Application not found (404). ` +
          `The Nano Banana API requires an application ID. ` +
          `Please set NANO_BANANA_APPLICATION_ID in your .env file. ` +
          `Expected URL format: https://api.nanobanana.ai/v1/applications/{your_app_id}/generate`
        );
      } else {
        console.error('[Nano Banana] Please verify:');
        console.error('[Nano Banana] 1. Check NANO_BANANA_API_URL in .env file');
        console.error('[Nano Banana] 2. Verify the API endpoint is correct');
        console.error('[Nano Banana] 3. Check if the API service is available');
        console.error(`[Nano Banana] API Response: ${JSON.stringify(response.data, null, 2)}`);
        
        throw new Error(`API endpoint not found (404). Current endpoint: ${apiUrl}. Please check your NANO_BANANA_API_URL configuration.`);
      }
    }

    // Handle other error status codes
    if (response.status >= 400) {
      const errorMsg = response.data?.error || response.data?.message || `API returned status ${response.status}`;
      console.error(`[Nano Banana] API Error (${response.status}):`, errorMsg);
      throw new Error(`API error: ${errorMsg}`);
    }

    // Extract image URLs from response (adjust based on actual API response structure)
    // Try multiple possible response formats
    const imageUrls = response.data?.images || 
                      response.data?.data?.images || 
                      response.data?.data || 
                      (Array.isArray(response.data) ? response.data : []);

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.warn('[Nano Banana] No images returned from API');
      console.warn('[Nano Banana] Response structure:', JSON.stringify(response.data, null, 2));
      throw new Error('No images returned from API. Please check the API response format.');
    }

    console.log(`[Nano Banana] Received ${imageUrls.length} image(s) from API`);

    // Download and save each image
    const savedImages = await Promise.all(
      imageUrls.map(async (imageUrl, index) => {
        try {
          // Handle different response formats
          const actualUrl = typeof imageUrl === 'string' ? imageUrl : imageUrl.url;

          if (!actualUrl) {
            console.warn(`[Nano Banana] Invalid image URL at index ${index}`);
            return null;
          }

          console.log(`[Nano Banana] Downloading image ${index + 1}...`);

          // Download the generated image
          const imageResponse = await axios.get(actualUrl, {
            responseType: 'arraybuffer',
            timeout: 60000,
            httpsAgent: new https.Agent({ keepAlive: true, family: 4 }),
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          const origBuf = Buffer.from(imageResponse.data);

          // WebP: premium quality; cap very large API images for sane file sizes (no upscaling).
          const webpBuf = await sharp(origBuf, { failOnError: false })
            .rotate()
            .resize({
              width: 2560,
              height: 2560,
              fit: "inside",
              withoutEnlargement: true,
              kernel: sharp.kernel.lanczos3,
            })
            .webp(WEBP_OPTS)
            .toBuffer();

          if (!webpBuf || webpBuf.length === 0) {
            throw new Error('WebP conversion failed - empty buffer');
          }

          // Build file object
          const file = {
            name: `ai-gen-${Date.now()}-${index}.webp`,
            mimetype: 'image/webp',
            size: webpBuf.length,
            buffer: webpBuf
          };

          // Upload file
          const fileName = await helper.uploadFile(file, folderPath, imageResponse);

          // Verify file exists
          const physicalPath = path.join(__dirname, '../', folderPath, fileName);
          if (!fs.existsSync(physicalPath)) {
            console.error(`[Nano Banana] File missing after upload: ${physicalPath}`);
            throw new Error('File was not saved to disk');
          }

          const filePath = `${BASE_URL}/images/${projectId}/${fileName}`;
          console.log(`[Nano Banana] ✅ Image ${index + 1} saved: ${filePath}`);

          return {
            url: filePath,
            originalUrl: actualUrl,
            prompt: prompt,
            index: index + 1
          };

        } catch (err) {
          console.error(`[Nano Banana] Failed to process image ${index + 1}:`, err?.message || err);
          return null;
        }
      })
    );

    // Filter out failed images
    const successfulImages = savedImages.filter(Boolean);

    if (successfulImages.length === 0) {
      console.warn('[Nano Banana] All images failed to process');
    } else {
      console.log(`[Nano Banana] Successfully saved ${successfulImages.length} image(s)`);
    }

    return successfulImages;

  } catch (err) {
    // Handle SSL certificate errors specifically
    if (err?.code === 'CERT_HAS_EXPIRED' || err?.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' || 
        err?.message?.includes('certificate') || err?.message?.includes('cert')) {
      console.error('[Nano Banana] SSL Certificate Error:', err.message);
      console.error('[Nano Banana] Tip: Set NANO_BANANA_REJECT_UNAUTHORIZED=false in .env to bypass SSL verification');
    } else {
      console.error('[Nano Banana] API Error:', err?.response?.data || err?.message || err);
    }
    
    // Handle specific error cases
    if (err?.response?.status === 401) {
      console.error('[Nano Banana] Authentication failed - check API key');
    } else if (err?.response?.status === 429) {
      console.error('[Nano Banana] Rate limit exceeded - try again later');
    } else if (err?.response?.status === 402) {
      console.error('[Nano Banana] Payment required - check account balance/credits');
    }

    return [];
  }
}

/**
 * Generate images with retry logic
 * @param {string} prompt - Image generation prompt
 * @param {string} projectId - Project ID
 * @param {number} count - Number of images
 * @param {object} options - Generation options
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Array>} Array of generated images
 */
async function generateWithRetry(prompt, projectId, count = 1, options = {}, maxRetries = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Nano Banana] Attempt ${attempt}/${maxRetries}`);
      const images = await generateNanoBananaImages(prompt, projectId, count, options);
      
      if (images && images.length > 0) {
        return images;
      }

      lastError = new Error('No images generated');
    } catch (err) {
      lastError = err;
      console.error(`[Nano Banana] Attempt ${attempt} failed:`, err.message);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`[Nano Banana] Waiting ${waitTime/1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  console.error(`[Nano Banana] All ${maxRetries} attempts failed`);
  throw lastError || new Error('Image generation failed after retries');
}

module.exports = {
  generateNanoBananaImages,
  generateWithRetry
};

