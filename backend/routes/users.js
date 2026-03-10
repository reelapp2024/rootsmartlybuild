// routes/site.js
const express = require("express");
const router = express.Router();


const fs = require("fs/promises");
const path = require("path");
const dns = require("dns").promises;
const { exec } = require("child_process");


const WEBROOT_BASE = "/var/www/ai";
const NGINX_AVAILABLE = "/etc/nginx/sites-available";
const NGINX_ENABLED = "/etc/nginx/sites-enabled";
const LE_LIVE = (d) => `/etc/letsencrypt/live/${d}`;

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
  } catch {}
  if (await fileExists("/usr/bin/certbot")) return "/usr/bin/certbot";
  if (await fileExists("/snap/bin/certbot")) return "/snap/bin/certbot";
  return null;
}

async function safeSymlink(from, to) {
  try { await fs.unlink(to); } catch {}
  await fs.symlink(from, to);
}

async function removeIfExists(p) { try { await fs.unlink(p); } catch {} }

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

    # Serve ACME HTTP-01 challenges
    location ^~ /.well-known/acme-challenge/ {
        default_type text/plain;
        try_files $uri =404;
    }

    # Serve site over HTTP until SSL is issued
    location / {
        try_files $uri $uri/ =404;
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
  return `
# HTTP redirect -> HTTPS on apex
server {
    listen 80;
    listen [::]:80;
    server_name ${apex} ${httpsServerNames.includes(`www.${apex}`) ? `www.${apex}` : ""};
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

# HTTPS vhost (names on the certificate only)
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

    location / {
        try_files $uri $uri/ =404;
    }

    access_log /var/log/nginx/${apex}.access.log;
    error_log  /var/log/nginx/${apex}.error.log;
}
`.trimStart();
}

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
      return 0;
    }
  }
  // As a last resort, attempt using Node’s DNS/HTTP would complicate; 000 means "unknown".
  return 0;
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

router.post("/connectDomain", async (req, res) => {
  const rawDomain = req.body?.domainName;
  const apex = normalizeHost(rawDomain);

  if (!apex) return res.status(400).json({ ok: false, error: "domainName is required" });
  if (!/^(?=.{1,253}$)[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(apex)) {
    return res.status(400).json({ ok: false, error: "Invalid domainName" });
  }

  const webroot = path.join(WEBROOT_BASE, apex);
  const availableConf = path.join(NGINX_AVAILABLE, `${apex}.conf`);
  const enabledConf = path.join(NGINX_ENABLED, `${apex}.conf`);
  const legacyAvailableConf = path.join(NGINX_AVAILABLE, `www.${apex}.conf`);
  const legacyEnabledConf = path.join(NGINX_ENABLED, `www.${apex}.conf`);
  const wwwHost = `www.${apex}`;

  try {
    // === 0) Which names can we certify? (no manual work) ===
    const apexHasDNS = await hasDNSAorAAAA(apex);
    if (!apexHasDNS) {
      return res.status(400).json({
        ok: false,
        error: `DNS for ${apex} not found (no A/AAAA). Point it to this server before requesting SSL.`,
      });
    }
    const wwwHasDNS = await hasDNSAorAAAA(wwwHost);

    // Names to bind on HTTP (we can include both)
    const httpNames = [apex];
    if (wwwHasDNS) httpNames.push(wwwHost);

    // Names for the cert / HTTPS vhost
    let certNames = [apex];
    if (wwwHasDNS) certNames.push(wwwHost);

    // === 1) Webroot + index + ACME dir ===
    await fs.mkdir(path.join(webroot, ".well-known", "acme-challenge"), { recursive: true });

    // Relax permissions to avoid 403/500 from filesystem
    try {
      await sh(`chown -R www-data:www-data ${WEBROOT_BASE} || true`);
      await sh(`chmod -R 755 ${WEBROOT_BASE} || true`);
    } catch {}

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

    // === 2) Clean old configs and write HTTP-only vhost (serve, no redirect) ===
    await removeIfExists(availableConf);
    await removeIfExists(enabledConf);
    await removeIfExists(legacyAvailableConf);
    await removeIfExists(legacyEnabledConf);

    await fs.writeFile(availableConf, nginxHttpOnlyConf(apex, httpNames, webroot), "utf8");
    await safeSymlink(availableConf, enabledConf);

    // Test & reload nginx
    await sh("nginx -t");
    try { await sh("systemctl reload nginx"); } catch { await sh("nginx -s reload"); }

    // === 3) ACME preflight: can we read a file via HTTP? ===
    const token = `preflight-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const tokenPath = path.join(webroot, ".well-known", "acme-challenge", token);
    await fs.writeFile(tokenPath, "ok", "utf8");

    const code = await preflightHttp(`http://${apex}/.well-known/acme-challenge/${token}`);
    if (code !== 200) {
      // Add a bit of context from nginx error log (best effort)
      let errTail = "";
      try {
        errTail = await sh(`tail -n 30 /var/log/nginx/${apex}.error.log 2>/dev/null || true`);
      } catch {}
      return res.status(500).json({
        ok: false,
        error: `HTTP preflight failed: expected 200 from /.well-known/acme-challenge, got ${code}`,
        hint: "Ensure port 80 reaches this nginx and the webroot path matches the config.",
        nginx_error_tail: errTail || undefined,
        http_url: `http://${apex}`,
      });
    }

    // === 4) Run Certbot (automatic SAN handling) ===
    const certbot = await findCertbot();
    if (!certbot) {
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
      // If it failed with both names, try apex-only (avoid NXDOMAIN/rate limits on www)
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

    // === 5) Swap to HTTPS config (HTTP now redirects) ===
    const includeHSTSSubdomains = issuedFor.includes(wwwHost); // only if www is on the cert
    await fs.writeFile(
      availableConf,
      nginxHttpsConf(apex, issuedFor, webroot, includeHSTSSubdomains),
      "utf8"
    );
    await sh("nginx -t");
    try { await sh("systemctl reload nginx"); } catch { await sh("nginx -s reload"); }

    return res.json({
      ok: true,
      message: `Site created with HTTPS for: ${issuedFor.join(", ")}`,
      domain: apex,
      webroot,
      nginxConf: availableConf,
      https_names: issuedFor,
      url: `https://${apex}`,
      note: (!issuedFor.includes(wwwHost) && wwwHasDNS === false)
        ? `No DNS for ${wwwHost}. Add DNS later and call API again to include it.`
        : undefined,
    });
  } catch (e) {
    // keep HTTP config alive if possible
    try { await sh("nginx -t"); await sh("nginx -s reload"); } catch {}
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
});

module.exports = router;
