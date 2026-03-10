

const fs = require("fs/promises");
const path = require("path");
const dns = require("dns").promises;
const { exec } = require("child_process");
const userProjects = require("../models/userProjects");
const Domain = require("../models/domains");
const HostingConnection = require('../models/HostingConnection');
const ProjectDeployment = require("../models/ProjectDeployment");
const Notification = require('../models/notification');
const Users = require("../models/users");

const WEBROOT_BASE = "/var/www/ai";
const NGINX_AVAILABLE = "/etc/nginx/sites-available";
const NGINX_ENABLED = "/etc/nginx/sites-enabled";
const LE_LIVE = (d) => `/etc/letsencrypt/live/${d}`;
const mongoose = require('mongoose');


const connectionConfig = { host: "82.25.110.201", username: "root", password: "Logical@1234#", port: 22, secure: false };
const configString = JSON.stringify(connectionConfig);




module.exports = {
  connectDomain: async (req, res) => {
    const io = req.app && req.app.get ? req.app.get('io') : null;
    const { projectId, domainName } = req.body;
    if (!projectId) return res.status(400).json({ message: "projectId is required" });
    if (!domainName) return res.status(400).json({ message: "domainName is required" });

    const rawDomain = domainName;
    const userId = req.user.userId;

    const apex = normalizeHost(rawDomain);
    if (!apex) return res.status(400).json({ ok: false, error: "domainName is required" });
    if (!/^(?=.{1,253}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(apex)) {
      return res.status(400).json({ ok: false, error: "Invalid domainName" });
    }

    // === Check 1: Domain already exists for THIS project? Skip connection ===
    // Check both Domain model and ProjectDeployment table
    const existingDomainForProject = await Domain.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      projectId: new mongoose.Types.ObjectId(projectId),
      domain: apex
    }).lean();

    const existingDeploymentForProject = await ProjectDeployment.findOne({
      projectId: new mongoose.Types.ObjectId(projectId),
      domainName: apex
    }).lean();

    if (existingDomainForProject || existingDeploymentForProject) {
      // Domain already connected to this project - return success and skip connection
      const project = await userProjects.findById(projectId).select('domainName siteHostRootPath hostingId').lean();
      return res.status(200).json({
        ok: true,
        message: `Domain ${apex} already connected to this project`,
        domain: apex,
        skipped: true,
        project: project
      });
    }

    // === Check 2: Domain exists for this user (any project or no project)? ===
    // Check if domain exists for this user with ANY projectId (including null)
    const existingDomainForUser = await Domain.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      domain: apex
    }).lean();

    // Also check ProjectDeployment table for the domain
    const existingDeploymentWithDomain = await ProjectDeployment.findOne({
      domainName: apex,
      projectId: { $ne: new mongoose.Types.ObjectId(projectId) }
    }).lean();

    // Determine which record has the conflict
    let conflictingProjectId = null;
    
    if (existingDomainForUser) {
      // If domain exists for this user, check if it's for a different project
      if (existingDomainForUser.projectId) {
        const existingProjectIdObj = existingDomainForUser.projectId;
        const currentProjectIdObj = new mongoose.Types.ObjectId(projectId);
        
        // Only consider it a conflict if it's a different project
        if (!existingProjectIdObj.equals(currentProjectIdObj)) {
          conflictingProjectId = existingProjectIdObj;
        }
      } else {
        // Domain exists but with no projectId - we can update it, but let's check if there's a deployment conflict
        if (existingDeploymentWithDomain && existingDeploymentWithDomain.projectId) {
          conflictingProjectId = existingDeploymentWithDomain.projectId;
        } else {
          // Domain exists with no projectId and no deployment conflict - we can proceed by updating it
          // This will be handled in the upsert later
        }
      }
    } else if (existingDeploymentWithDomain && existingDeploymentWithDomain.projectId) {
      // No Domain record but ProjectDeployment has it
      conflictingProjectId = existingDeploymentWithDomain.projectId;
    }

    if (conflictingProjectId) {
      // Convert to string if it's an ObjectId
      const existingProjectIdString = String(conflictingProjectId);
      
      // Fetch project name from userProjects
      let existingProjectName = 'Unknown Project';
      try {
        const existingProject = await userProjects.findById(conflictingProjectId).select('projectName').lean();
        if (existingProject && existingProject.projectName) {
          existingProjectName = existingProject.projectName;
        }
      } catch (err) {
        console.error('[connectDomain] Error fetching project name:', err);
        // Keep default 'Unknown Project'
      }
      
      return res.status(409).json({
        ok: false,
        error: 'Domain already exists in another project',
        domain: apex,
        existingProject: {
          projectId: existingProjectIdString,
          projectName: existingProjectName
        },
        options: {
          unlink: {
            action: 'unlink',
            message: 'Unlink this domain from the other project and connect it here',
            api: '/admin/v1/unlinkDomain',
            requiredParams: { projectId: existingProjectIdString, domainName: apex }
          },
          useAnother: {
            action: 'useAnother',
            message: 'Use a different domain for this project'
          }
        }
      });
    }

    // Upsert / ensure we have a hosting connection (existing code)
    const host = await HostingConnection.findOneAndUpdate(
      { userId, connectionType: "vps" },
      {
        $setOnInsert: {
          userId,
          connectionType: "vps",
          connectionConfig: configString,
          isOur: true,
          status: "success",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    const hostingId = host._id;

    const webroot = path.join(WEBROOT_BASE, apex);
    const availableConf = path.join(NGINX_AVAILABLE, `${apex}.conf`);
    const enabledConf = path.join(NGINX_ENABLED, `${apex}.conf`);
    const legacyAvailableConf = path.join(NGINX_AVAILABLE, `www.${apex}.conf`);
    const legacyEnabledConf = path.join(NGINX_ENABLED, `www.${apex}.conf`);
    const wwwHost = `www.${apex}`;

    try {


       const filter = { projectId: new mongoose.Types.ObjectId(projectId) };
    if (hostingId) filter.hostingId = new mongoose.Types.ObjectId(hostingId);


    // Calculate webroot from the new domain
    const newWebroot = path.join(WEBROOT_BASE, apex);
    const result = await ProjectDeployment.updateMany(filter, { 
      $set: { 
        domainName: apex,
        rootPath: newWebroot  // Update rootPath to match new domain
      } 
    });

    // Optionally return the updated docs (cheap extra read, helpful for UI)
    const deployments = await ProjectDeployment.find(filter).lean();
      // === 0) DNS checks ===
      const apexHasDNS = await hasDNSAorAAAA(apex);
      if (!apexHasDNS) {
        return res.status(400).json({
          ok: false,
          error: `DNS for ${apex} not found (no A/AAAA). Point it to this server before requesting SSL.`,
        });
      }
      const wwwHasDNS = await hasDNSAorAAAA(wwwHost);

      // Names to bind on HTTP
      const httpNames = [apex];
      if (wwwHasDNS) httpNames.push(wwwHost);

      // Names for cert
      let certNames = [apex];
      if (wwwHasDNS) certNames.push(wwwHost);

      // === 1) Webroot + index + ACME dir ===
      await fs.mkdir(path.join(webroot, ".well-known", "acme-challenge"), { recursive: true });
      try {
        await sh(`chown -R www-data:www-data ${WEBROOT_BASE} || true`);
        await sh(`chmod -R 755 ${WEBROOT_BASE} || true`);
      } catch { }

      const createdAt = nowStamp();
      await fs.writeFile(
        path.join(webroot, "index.html"),
        `<!doctype html><meta charset="utf-8"><title>${apex}</title>
<style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:40px;line-height:1.6}</style>
<h1>Welcome to ${apex}</h1>
<p>Created: <strong>${createdAt}</strong></p>
<p>Webroot: <code>${webroot}</code></p>`,
        "utf8"
      );

      // === 2) nginx HTTP vhost ===
      await removeIfExists(availableConf);
      await removeIfExists(enabledConf);
      await removeIfExists(legacyAvailableConf);
      await removeIfExists(legacyEnabledConf);

      await fs.writeFile(availableConf, nginxHttpOnlyConf(apex, httpNames, webroot), "utf8");
      await safeSymlink(availableConf, enabledConf);

      // Test & reload nginx
      await sh("nginx -t");
      try { await sh("systemctl reload nginx"); } catch { await sh("nginx -s reload"); }

      // === 3) ACME preflight with retry logic ===
      const token = `preflight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const tokenPath = path.join(webroot, ".well-known", "acme-challenge", token);
      await fs.writeFile(tokenPath, "ok", "utf8");

      // Wait a moment for nginx to fully process the new configuration and DNS to propagate
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second initial delay

      // Retry logic for ACME preflight (up to 3 attempts with increasing delays)
      let code = 0;
      let lastError = null;
      const maxRetries = 3;
      const retryDelays = [2000, 3000, 5000]; // delays in milliseconds

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
          // Wait before retry (except first attempt which already waited)
          await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
        }

        code = await preflightHttp(`http://${apex}/.well-known/acme-challenge/${token}`);
        
        if (code === 200) {
          // Success - break out of retry loop
          break;
        }
        
        lastError = code;
        console.log(`[ACME Preflight] Attempt ${attempt + 1}/${maxRetries} failed with code ${code} for ${apex}`);
      }

      if (code !== 200) {
        let errTail = "";
        try { errTail = await sh(`tail -n 30 /var/log/nginx/${apex}.error.log 2>/dev/null || true`); } catch { }
        return res.status(500).json({
          ok: false,
          error: `HTTP preflight failed after ${maxRetries} attempts: expected 200 from /.well-known/acme-challenge, got ${lastError}`,
          hint: "Ensure port 80 reaches this nginx, the webroot path matches the config, and DNS has propagated.",
          nginx_error_tail: errTail || undefined,
          http_url: `http://${apex}`,
        });
      }

      // === 4) Run Certbot ===
      if (io) {
        try { io.to(`project_${projectId}`).emit('sslUpdate', { projectId, status: 'issuing' }); } catch {}
      }
      const certbot = await findCertbot();
      if (!certbot) {
        if (io) { try { io.to(`project_${projectId}`).emit('sslUpdate', { projectId, status: 'failed', error: 'certbot not installed' }); } catch {} }
        return res.status(500).json({
          ok: false,
          error: "certbot not installed",
          fix: "Install with `apt install certbot python3-certbot-nginx` or `snap install --classic certbot`",
          http_url: `http://${apex}`,
        });
      }

      const email = process.env.CERTBOT_EMAIL || "sjblogs2023@gmail.com";
      const emailFlag = email ? `--email ${email}` : "--register-unsafely-without-email";
      const namesToFlags = (names) => names.map(d => `-d ${d}`).join(" ");
      async function runCertbot(names) {
        const flags = `${namesToFlags(names)} --webroot -w ${webroot} --agree-tos --non-interactive --keep-until-expiring --expand --preferred-challenges http`;
        return sh(`${certbot} certonly ${flags} -v`);
      }

      let issuedFor = null;
      try {
        await runCertbot(certNames);
        issuedFor = certNames.slice();
      } catch (e1) {
        if (certNames.length > 1) {
          try {
            await runCertbot([apex]);
            issuedFor = [apex];
          } catch (e2) {
            const info = parseCertbotError(e2.message || "");
            return res.status(500).json({
              ok: false,
              error: e2.message || String(e2),
              error_type: info.type,
              retry_after_seconds: info.retry_after_seconds || undefined,
              hint: info.hint || undefined,
              note: "HTTP config kept active. Fix the issue and retry.",
              http_url: `http://${apex}`,
            });
          }
        } else {
          const info = parseCertbotError(e1.message || "");
          return res.status(500).json({
            ok: false,
            error: e1.message || String(e1),
            error_type: info.type,
            retry_after_seconds: info.retry_after_seconds || undefined,
            hint: info.hint || undefined,
            note: "HTTP config kept active. Fix the issue and retry.",
            http_url: `http://${apex}`,
          });
        }
      }

      // === 5) Swap to HTTPS config ===
      const includeHSTSSubdomains = issuedFor.includes(wwwHost);
      await fs.writeFile(
        availableConf,
        nginxHttpsConf(apex, issuedFor, webroot, includeHSTSSubdomains),
        "utf8"
      );
      await sh("nginx -t");
      try { await sh("systemctl reload nginx"); } catch { await sh("nginx -s reload"); }
      if (io) { try { io.to(`project_${projectId}`).emit('sslUpdate', { projectId, status: 'ready' }); } catch {} }

      // === 6) Update project (existing behavior) ===
      const updatedProject = await userProjects.findByIdAndUpdate(
        projectId,
        {
          hostingId,                 // ObjectId of the upserted HostingConnection
          ourHosted: true,
          siteHostRootPath: webroot,
          domainName: apex
        },
        { new: true }
      );

      // === 7) Upsert into Domain model (new behavior) ===
      // status: active if we issued cert(s), otherwise pending
      const domainStatus = issuedFor && issuedFor.length ? 'active' : 'pending';

      let domainDoc;
      try {
        // Use unique index fields (userId, domain) for the query to match existing records
        // This will update existing records even if they have a different/null projectId
        domainDoc = await Domain.findOneAndUpdate(
          { userId: new mongoose.Types.ObjectId(userId), domain: apex },
          {
            $set: {
              hostingId,          // helpful reference to HostingConnection
              status: domainStatus,
              domain: apex,
              userId: new mongoose.Types.ObjectId(userId),
              projectId: new mongoose.Types.ObjectId(projectId)
            },
            $setOnInsert: {
              // any defaults you'd like to set on insert can go here
            }
          },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );
      } catch (domainErr) {
        // handle duplicate-key / validation errors (shouldn't happen due to earlier check, but just in case)
        if (domainErr && domainErr.code === 11000) {
          // This should rarely happen now since we're using the unique index fields
          // But if it does, try to find the existing record and update it
          try {
            const existingDomain = await Domain.findOne({ 
              userId: new mongoose.Types.ObjectId(userId), 
              domain: apex 
            });
            if (existingDomain) {
              existingDomain.projectId = new mongoose.Types.ObjectId(projectId);
              existingDomain.hostingId = hostingId;
              existingDomain.status = domainStatus;
              await existingDomain.save();
              domainDoc = existingDomain;
            } else {
              return res.status(409).json({
                ok: false,
                error: 'Domain already exists for this user',
                detail: domainErr.message
              });
            }
          } catch (retryErr) {
            return res.status(409).json({
              ok: false,
              error: 'Domain already exists for this user',
              detail: domainErr.message
            });
          }
        } else {
          // other errors
          return res.status(500).json({
            ok: false,
            error: domainErr.message || String(domainErr)
          });
        }
      }

      // Create notification for user (domain added)
      try {
        await Notification.create({
          userToId: userId,
          message: `Your domain ${apex} has been successfully added to SmartlyBuild`,
          type: 'domain_added',
          relatedId: projectId
        });
      } catch (notifError) {
        console.error('Error creating domain notification:', notifError);
      }

      // Final success response
      return res.status(200).json({
        message: `Domain connected and site created with HTTPS for: ${issuedFor.join(", ")}`,
        domain: apex,
        domainRecord: domainDoc,
        webroot,
        nginxConf: availableConf,
        https_names: issuedFor,
        url: `https://${apex}`,
        note: (!issuedFor.includes(wwwHost) && wwwHasDNS === false)
          ? `No DNS for ${wwwHost}. Add DNS later and call API again to include it.`
          : undefined,
        project: updatedProject
      });

    } catch (e) {
      // keep HTTP config alive if possible
      try { await sh("nginx -t"); await sh("nginx -s reload"); } catch { }
      const info = parseCertbotError(e.message || "");
      return res.status(500).json({
        ok: false,
        error: e.message || String(e),
        error_type: info.type || undefined,
        retry_after_seconds: info.retry_after_seconds || undefined,
        hint: info.hint || undefined,
        note: "HTTP config kept active. Ensure DNS is correct and try again.",
        http_url: `http://${apex}`,
      });
    }
  },

  unlinkDomain: async (req, res) => {
    try {
      const { projectId, domainName } = req.body;
      const userId = req.user.userId;

      if (!projectId) {
        return res.status(400).json({ ok: false, error: "projectId is required" });
      }
      if (!domainName) {
        return res.status(400).json({ ok: false, error: "domainName is required" });
      }

      const apex = normalizeHost(domainName);
      if (!apex) {
        return res.status(400).json({ ok: false, error: "Invalid domainName" });
      }

      // Validate projectId
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        return res.status(400).json({ ok: false, error: "Invalid projectId format" });
      }

      const projectObjectId = new mongoose.Types.ObjectId(projectId);

      // Find the domain record
      const domain = await Domain.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        projectId: projectObjectId,
        domain: apex
      });

      if (!domain) {
        return res.status(404).json({ 
          ok: false, 
          error: `Domain ${apex} not found for this project`,
          message: "Domain may have already been unlinked"
        });
      }

      // 1) Remove from ProjectDeployment table
      const deploymentResult = await ProjectDeployment.updateMany(
        { 
          projectId: projectObjectId,
          domainName: apex 
        },
        { 
          $unset: { domainName: "" } 
        }
      );

      console.log(`[unlinkDomain] Removed domain from ${deploymentResult.modifiedCount} ProjectDeployment record(s)`);

      // 2) Remove from Domain model
      await Domain.deleteOne({
        _id: domain._id
      });

      console.log(`[unlinkDomain] Removed domain from Domain model`);

      // 3) Clear domainName from UserProject (set to null)
      const projectUpdateResult = await userProjects.updateMany(
        { 
          _id: projectObjectId,
          domainName: apex 
        },
        { 
          $unset: { domainName: "" } 
        }
      );

      console.log(`[unlinkDomain] Cleared domain from ${projectUpdateResult.modifiedCount} UserProject record(s)`);

      // 4) Also check and clear from any ProjectDeployment records that might have this domain
      const additionalDeployments = await ProjectDeployment.updateMany(
        { domainName: apex },
        { $unset: { domainName: "" } }
      );

      if (additionalDeployments.modifiedCount > 0) {
        console.log(`[unlinkDomain] Also cleared domain from ${additionalDeployments.modifiedCount} additional ProjectDeployment record(s)`);
      }

      return res.status(200).json({
        ok: true,
        message: `Domain ${apex} successfully unlinked from project`,
        unlinked: {
          domain: apex,
          projectId: projectId,
          fromTables: {
            Domain: true,
            ProjectDeployment: deploymentResult.modifiedCount + additionalDeployments.modifiedCount,
            UserProject: projectUpdateResult.modifiedCount
          }
        }
      });

    } catch (error) {
      console.error('[unlinkDomain] Error:', error);
      return res.status(500).json({
        ok: false,
        error: error.message || 'Failed to unlink domain',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

}

function sh(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
      if (err) return reject(new Error([stderr, stdout].join("\n").trim()));
      resolve((stdout || "").trim());
    });
  });
}

async function fileExists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

// Normalize: strip scheme/port/path/query/fragment/trailing dot; drop leading "www."
function normalizeHost(input) {
  let s = String(input || "").trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "");
  s = s.replace(/:\d+$/, ""); // trailing :port if they sent it
  s = s.split("/")[0].split("?")[0].split("#")[0];
  s = s.replace(/\.$/, "");
  s = s.replace(/^www\./, "");
  return s;
}

async function hasDNSAorAAAA(host) {
  const [a, aaaa] = await Promise.allSettled([dns.resolve4(host), dns.resolve6(host)]);
  return (a.status === "fulfilled" && a.value.length > 0) ||
    (aaaa.status === "fulfilled" && aaaa.value.length > 0);
}

async function findCertbot() {
  try {
    const viaPath = await sh("command -v certbot || true");
    if (viaPath) return viaPath;
  } catch { }
  if (await fileExists("/usr/bin/certbot")) return "/usr/bin/certbot";
  if (await fileExists("/snap/bin/certbot")) return "/snap/bin/certbot";
  return null;
}

async function safeSymlink(from, to) {
  try { await fs.unlink(to); } catch { }
  await fs.symlink(from, to);
}

async function removeIfExists(p) { try { await fs.unlink(p); } catch { } }

function nowStamp() {
  const local = new Date().toLocaleString();
  const utc = new Date().toISOString();
  return `Local: ${local} · UTC: ${utc}`;
}

/** HTTP-only vhost (no redirect) so ACME & index.html work before SSL */

function nginxHttpOnlyConf(apex, serverNames, webroot) {
  const names = serverNames.join(" ");
  return `
server {
    listen 80;
    listen [::]:80;
    server_name ${names};

    root ${webroot};
    index index.html;

    # Serve ACME HTTP-01 challenges (highest priority)
    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        try_files $uri =404;
    }

    # Static files (must be before SPA fallback)
    location ~* \\.(js|mjs|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|json|xml|txt|map)$ {
        try_files $uri =404;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }

    # Avoid caching HTML
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        expires 0;
        try_files /index.html =404;
    }

    # SPA fallback (critical for React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/${apex}.access.log;
    error_log  /var/log/nginx/${apex}.error.log;
}
`.trimStart();
}



/** Final HTTPS + HTTP->HTTPS redirect (only names present on the cert) */
function nginxHttpsConf(apex, httpsServerNames, webroot, includeHSTSSubdomains) {
  const httpsNames = httpsServerNames.join(" ");
  const hsts = includeHSTSSubdomains
    ? 'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;'
    : 'add_header Strict-Transport-Security "max-age=31536000" always;';

  const hasWWW = httpsServerNames.includes(`www.${apex}`);
  const wwwPart = hasWWW ? ` www.${apex}` : "";

  return `
# HTTP redirect -> HTTPS (keep ACME reachable)
server {
    listen 80;
    listen [::]:80;
    server_name ${apex}${wwwPart};
    root ${webroot};

    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        try_files $uri =404;
    }

    location / {
        return 301 https://${apex}$request_uri;
    }

    access_log /var/log/nginx/${apex}.access.log;
    error_log  /var/log/nginx/${apex}.error.log;
}

# HTTPS vhost
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${httpsNames};

    root ${webroot};
    index index.html;

    ssl_certificate     ${LE_LIVE(apex)}/fullchain.pem;
    ssl_certificate_key ${LE_LIVE(apex)}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    ${hsts}
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header Referrer-Policy no-referrer-when-downgrade;

    # Serve ACME HTTP-01 challenges
    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        try_files $uri =404;
    }

    # Static files (must be before fallback)
    location ~* \\.(js|mjs|css|woff2?|ttf|otf|eot|ico|png|jpg|jpeg|gif|svg|webp|json|xml|txt|map)$ {
        try_files $uri =404;
        access_log off;
        add_header Cache-Control "public, max-age=31536000, immutable";
        expires 1y;
    }

    # Avoid caching HTML
    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
        expires 0;
        try_files /index.html =404;
    }

    # SPA fallback for HTTPS React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    access_log /var/log/nginx/${apex}.access.log;
    error_log  /var/log/nginx/${apex}.error.log;
}
`.trimStart();
}



// REPLACE your preflightHttp with this (fixes octal literal "000")
async function preflightHttp(acmeUrl) {
  // Prefer curl; fallback to wget if needed.
  const haveCurl = await sh("command -v curl || true");
  if (haveCurl) {
    const code = await sh(`curl -s -o /dev/null -w "%{http_code}" ${acmeUrl}`);
    return Number(code);
  }
  const haveWget = await sh("command -v wget || true");
  if (haveWget) {
    try {
      await sh(`wget -qO- ${acmeUrl} > /dev/null`);
      return 200;
    } catch (e) {
      return 0; // unknown / failed (was 000)
    }
  }
  // As a last resort, 0 means "unknown".
  return 0; // was 000
}


function parseCertbotError(msg) {
  const out = { type: "unknown", retry_after_seconds: null, hint: null };
  if (/NXDOMAIN/i.test(msg)) {
    out.type = "nxdomain";
    out.hint = "Create the DNS A/AAAA (or CNAME) record and try again.";
  } else if (/rateLimited|Retry-After|too many failed authorizations/i.test(msg)) {
    out.type = "rate_limited";
    const m = msg.match(/Retry-After:\s*([0-9]+)/i);
    if (m) out.retry_after_seconds = Number(m[1]);
    out.hint = "Wait for the indicated Retry-After window, then retry.";
  } else if (/Invalid response.*\/\.well-known\/acme-challenge\/.*: 500/i.test(msg)) {
    out.type = "http_500";
    out.hint = "Nginx must serve the challenge file with 200. Check the HTTP vhost and webroot path.";
  } else if (/Some challenges have failed/i.test(msg)) {
    out.type = "challenge_failed";
  }
  return out;
}


