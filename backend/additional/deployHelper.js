const fs = require('fs-extra');
const path = require('path');
const { execPromise } = require('../additional/utils');  // Import execPromise
const UserProject = require('../models/userProjects');  // Import UserProject model

exports.deployReactApp = async (deploymentId, projectId) => {
  const websiteFolderPath = path.resolve(__dirname, '..', '..', 'apps', 'website'); // Updated path for new monorepo structure
  const tempPath = path.resolve(__dirname, '..', 'deploy-temp', deploymentId); // Corrected path (no extra 'backend')
  const distPath = path.join(tempPath, 'dist');  // Vite builds to 'dist' folder
  const sitemapSourcePath = path.join(__dirname, '..', `public/sitemaps/${projectId}/sitemap.xml`);
  const sitemapDestPath = path.join(distPath, 'sitemap.xml');
  console.log('Step 1: Copying website folder...');
  console.log(`Website folder path: ${websiteFolderPath}`);

  try {
    // Check if the website folder exists
    if (!fs.existsSync(websiteFolderPath)) {
      throw new Error('Website folder does not exist at: ' + websiteFolderPath);
    }

    // **Step: Update the .env with the new projectId and project URL**
    console.log('Step 1.1: Updating environment variables in .env file...');
    const envPath = path.resolve(websiteFolderPath, '.env');
    const projectUrl = 'https://apis.smartlybuild.dev';
    let envContent = '';

    if (!fs.existsSync(envPath)) {
      // If .env file doesn't exist, create one with both variables
      console.log('.env file not found. Creating .env file...');
      envContent = `VITE_PROJECT_ID="${projectId}"\nVITE_PROJECT_URL="${projectUrl}"\n`;
      fs.writeFileSync(envPath, envContent);
    } else {
      // If .env file exists, read and update both entries
      console.log('.env file found. Updating variables...');
      envContent = fs.readFileSync(envPath, 'utf8');

      // Regex patterns for ID and URL
      const idRegex = /^VITE_PROJECT_ID=".*"$/m;
      const urlRegex = /^VITE_PROJECT_URL=".*"$/m;

      if (idRegex.test(envContent)) {
        envContent = envContent.replace(idRegex, `VITE_PROJECT_ID="${projectId}"`);
      } else {
        envContent += `VITE_PROJECT_ID="${projectId}"\n`;
      }

      if (urlRegex.test(envContent)) {
        envContent = envContent.replace(urlRegex, `VITE_PROJECT_URL="${projectUrl}"`);
      } else {
        envContent += `VITE_PROJECT_URL="${projectUrl}"\n`;
      }

      fs.writeFileSync(envPath, envContent);
    }

    // 1️⃣ Ensure temp folder exists or create it
    await fs.ensureDir(tempPath);  // Creates deploy-temp folder if it does not exist
    console.log(`Temporary folder created or exists: ${tempPath}`);

    // 2️⃣ Copy website folder to temporary deployment path, excluding node_modules
    await fs.copy(websiteFolderPath, tempPath, {
      filter: (src) => {
        const rel = path.relative(websiteFolderPath, src);
        return rel.split(path.sep)[0] !== 'node_modules';
      }
    });
    console.log(`Website folder copied (excluding node_modules) to: ${tempPath}`);

    // **Step 2 A: Install dependencies** - Install `@rollup/rollup-win32-x64-msvc` and `esbuild` if needed
    console.log('Step 2 A: Installing @rollup/rollup-win32-x64-msvc...');
    const os = require('os');
    if (os.platform() === 'win32') {
      console.log('Step 2 A: Installing @rollup/rollup-win32-x64-msvc (Windows only)...');
      await execPromise('npm install @rollup/rollup-win32-x64-msvc --save-dev', { cwd: tempPath });
    }
    console.log('Step 2 B: Installing esbuild...');
    await execPromise('npm install esbuild --save-dev', { cwd: tempPath });

    // 3️⃣ Run `npm install` to install all required dependencies (including optional)
    console.log('Step 3: Running npm install...');
    await execPromise('npm install', { cwd: tempPath });  // Install all dependencies (including optional)
    console.log('npm install completed.');

    // 4️⃣ Run `npm run build` to generate the dist folder
    console.log('Step 4: Running npm run build...');
    await execPromise('npm run build', { cwd: tempPath });  // Run the build
    console.log('npm build completed. dist folder generated.');

    // 6️⃣ Copy sitemap.xml to public folder in dist

    if (fs.existsSync(sitemapSourcePath)) {
      await fs.copy(sitemapSourcePath, sitemapDestPath, { overwrite: true });
      console.log(`Sitemap copied to: ${sitemapDestPath}`);
    } else {
      console.warn(`Sitemap not found at: ${sitemapSourcePath}`);
    }

    // 7️⃣ Create robots.txt file in dist folder
    const robotsTxtPath = path.join(distPath, 'robots.txt');
    const robotsTxtContent = `User-agent: *\nAllow: /\n`;
    await fs.writeFile(robotsTxtPath, robotsTxtContent, 'utf8');
    console.log(`robots.txt created at: ${robotsTxtPath}`);

    // 8️⃣ Create .htaccess for cPanel/Apache SPA routing
    const htaccessPath = path.join(distPath, '.htaccess');
    const htaccessContent = `# Force HTTPS and WWW handling (optional)
#RewriteEngine On
#RewriteCond %{HTTPS} !=on [OR]
#RewriteCond %{HTTP_HOST} !^www\.
#RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Basic SPA rewrite to index.html for non-file requests
RewriteEngine On
RewriteBase /
Options -MultiViews
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ index.html [L]
`;
    await fs.writeFile(htaccessPath, htaccessContent, 'utf8');
    console.log(`.htaccess created at: ${htaccessPath}`);

    // 9️⃣ Update index.html with Google Site Verification meta tag (if meta tag method is used)
    try {
      const indexHtmlPath = path.join(distPath, 'index.html');
      
      if (fs.existsSync(indexHtmlPath)) {
        // Fetch project's Google Site Verification data
        const project = await UserProject.findById(projectId).select('googleSiteVerification googleSiteVerificationHtmlFile').lean();
        const metaTagLine = project?.googleSiteVerification;

        // Only process meta tag if it exists (HTML file method doesn't need this)
        if (metaTagLine && metaTagLine.trim()) {
          console.log(`[Google Site Verification] Updating index.html with meta tag for project ${projectId}`);
          
          // Read index.html
          let indexHtmlContent = await fs.readFile(indexHtmlPath, 'utf8');
          
          // Remove any existing google-site-verification meta tags (case-insensitive, flexible format)
          const existingMetaRegex = /<meta\s+[^>]*name=["']google-site-verification["'][^>]*\s*\/?>/gi;
          const existingMatches = indexHtmlContent.match(existingMetaRegex);
          
          if (existingMatches && existingMatches.length > 0) {
            // Remove all existing google-site-verification meta tags
            indexHtmlContent = indexHtmlContent.replace(existingMetaRegex, '');
            console.log(`[Google Site Verification] Removed ${existingMatches.length} existing meta tag(s)`);
          }
          
          // Clean up any extra whitespace/newlines left after removal
          indexHtmlContent = indexHtmlContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          // Find the </head> tag and insert the new meta tag before it
          const headCloseIndex = indexHtmlContent.indexOf('</head>');
          if (headCloseIndex !== -1) {
            // Insert the meta tag line with proper indentation
            const metaTagToInsert = '\n    ' + metaTagLine.trim() + '\n';
            indexHtmlContent = indexHtmlContent.slice(0, headCloseIndex) + 
                             metaTagToInsert + 
                             indexHtmlContent.slice(headCloseIndex);
            console.log(`[Google Site Verification] Added new meta tag before </head>`);
          } else {
            // If no </head> found, try to find <head> and append after it
            const headOpenIndex = indexHtmlContent.indexOf('<head>');
            if (headOpenIndex !== -1) {
              const headCloseTag = indexHtmlContent.indexOf('>', headOpenIndex);
              const metaTagToInsert = '\n    ' + metaTagLine.trim() + '\n';
              indexHtmlContent = indexHtmlContent.slice(0, headCloseTag + 1) + 
                               metaTagToInsert + 
                               indexHtmlContent.slice(headCloseTag + 1);
              console.log(`[Google Site Verification] Added new meta tag after <head>`);
            } else {
              console.warn(`[Google Site Verification] Could not find <head> or </head> tag in index.html`);
            }
          }
          
          // Write updated index.html
          await fs.writeFile(indexHtmlPath, indexHtmlContent, 'utf8');
          console.log(`[Google Site Verification] Successfully updated index.html with: ${metaTagLine.trim()}`);
        }
      } else {
        console.warn(`[Google Site Verification] index.html not found at ${indexHtmlPath}`);
      }
    } catch (error) {
      console.error('[Google Site Verification] Error updating index.html:', error);
      // Don't throw - this is not critical for deployment
    }

    // 🔟 Copy Google Site Verification HTML file to dist root (if HTML file method is used)
    try {
      const project = await UserProject.findById(projectId).select('googleSiteVerificationHtmlFile').lean();
      const htmlFilePath = project?.googleSiteVerificationHtmlFile;

      if (htmlFilePath && htmlFilePath.trim()) {
        // htmlFilePath format: uploads/{projectId}/filename.html
        const sourceFilePath = path.join(__dirname, '..', htmlFilePath);
        
        // Extract just the filename from the path (e.g., "filename.html")
        const htmlFileName = path.basename(htmlFilePath);
        const destFilePath = path.join(distPath, htmlFileName);

        if (fs.existsSync(sourceFilePath)) {
          // Copy HTML file to dist root with exact filename
          await fs.copy(sourceFilePath, destFilePath);
          console.log(`[Google Site Verification HTML] Copied ${htmlFileName} from ${htmlFilePath} to dist root: ${destFilePath}`);
        } else {
          console.warn(`[Google Site Verification HTML] Source file not found: ${sourceFilePath}`);
        }
      }
    } catch (error) {
      console.error('[Google Site Verification HTML] Error copying HTML file:', error);
      // Don't throw - this is not critical for deployment
    }

    // 1️⃣1️⃣ Create .htaccess file for Apache/cPanel SPA routing support
    try {
      const htaccessPath = path.join(distPath, '.htaccess');
      const htaccessContent = `# React/Vite SPA Routing Support
# This file ensures that all routes are handled by index.html for client-side routing

<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # First, check if the requested file exists (static assets)
  # If file exists, serve it directly (don't rewrite)
  RewriteCond %{REQUEST_FILENAME} -f
  RewriteRule ^ - [L]
  
  # Check if the requested directory exists
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  
  # Exclude API calls, admin routes, and well-known paths
  RewriteCond %{REQUEST_URI} ^/api/ [OR]
  RewriteCond %{REQUEST_URI} ^/admin/ [OR]
  RewriteCond %{REQUEST_URI} ^/.well-known/
  RewriteRule ^ - [L]
  
  # Exclude static file extensions - serve them directly if they exist
  RewriteCond %{REQUEST_URI} \\.(js|mjs|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|json|xml|txt|map)$ [NC]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteRule ^ - [R=404,L]
  
  # Redirect all other requests to index.html for SPA routing
  RewriteRule ^ index.html [QSA,L]
</IfModule>

# Optional: Set cache headers for static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType font/woff "access plus 1 year"
  ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Prevent caching of HTML files
<FilesMatch "\\.(html|htm)$">
  <IfModule mod_headers.c>
    Header set Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate"
    Header set Expires "0"
  </IfModule>
</FilesMatch>
`;
      
      await fs.writeFile(htaccessPath, htaccessContent, 'utf8');
      console.log(`[.htaccess] Created .htaccess file for SPA routing support: ${htaccessPath}`);
    } catch (error) {
      console.error('[.htaccess] Error creating .htaccess file:', error);
      // Don't throw - this is not critical for VPS deployments (nginx doesn't use .htaccess)
    }

    // 5️⃣ Return the dist folder path after successful build
    return distPath;
  } catch (error) {
    console.error('Error in deployReactApp:', error);
    throw error;  // Re-throwing the error for further handling if needed
  }
};
