const Bull = require('bull');
const axios = require('axios');
const redis = require('redis');
require('dotenv').config();
// ADD near the top with other requires
const path = require('path');
const fs = require('fs').promises;

const fetchFreepikImages = require('../additional/freePik');

const UserProject = require('../models/userProjects');
const Service = require('../models/service');
const Slug = require('../models/slug');
const Blog = require("../models/blogs");
const Author = require("../models/authors")
const { fetchJSONFromOpenAI, fetchStringFromOpenAI } = require('../additional/openaiHelpers');

// Redis client setup
const redisHost = process.env.redisHost;
const redisPort = process.env.redisPort;
const redisClient = redis.createClient({
    socket: { host: redisHost, port: redisPort }
});
redisClient.connect().catch(err => console.error('Redis connection error:', err));

// Redis queue setup
const aiblogsQueue = new Bull('aiblogsQueue', {
    redis: { host: redisHost, port: redisPort },
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 15000 },
        removeOnComplete: true,
        removeOnFail: false,
    },
});












function templatePath(type) {
    const t = String(type || 'default').toLowerCase();
    if (t === 'best') return path.join(__dirname, '../blog_templates/best/best.html');
    if (t === 'comparison') return path.join(__dirname, '../blog_templates/comparison/comparison.html');
    if (t === 'how') return path.join(__dirname, '../blog_templates/how/how.html');
    if (t === 'what') return path.join(__dirname, '../blog_templates/what/what.html');
    return path.join(__dirname, '../blog_templates/default/default.html');
}



// ===== BEGIN helpers (no HTML escaping used) =====
function isSafeHttpUrl(u = "") {
    try {
        const { protocol } = new URL(u);
        return protocol === "http:" || protocol === "https:";
    } catch {
        return false;
    }
}


function buildReferencesAsk(title, serviceType) {
    return `
Return ONLY a JSON array of 4–8 links like:
["https://...","https://..."]
Rules:
- https only; remove utm_* / gclid / fbclid; no duplicates
- No placeholders (no example.com/test.com/sample.com)
- Only include URLs that return a 200 OK status (i.e., the page must exist and be accessible)
- If a specific subpage is not accessible (e.g., returns 404 or other error), use the website’s homepage (e.g., https://www.example.com/) instead, ensuring it is still relevant to "${title}"
- Prefer authoritative blogs or websites related to "${title}" (e.g., .gov/.edu, manufacturer/support docs, standards bodies, trade orgs, reputable publishers)
- Each link must support specific claims or provide relevant context for "${title}"
Blog title: "${title}"
Service/Niche: "${serviceType || ""}"
`.trim();
}



async function loadTemplate(templateType) {
    const file = templatePath(templateType);
    try {
        return await fs.readFile(file, 'utf-8');
    } catch {
        const fallback = templatePath('default');
        return await fs.readFile(fallback, 'utf-8');
    }
}









// Small utils
const clean = (s) => String(s || '').trim();
const ensureOrigin = (d) => {
    const domain = clean(d);
    if (!domain) return 'https://example.com'; // Fallback domain if empty
    if (/^https?:\/\//i.test(domain)) return domain.replace(/\/+$/, '');
    const formatted = `https://${domain.replace(/^\/+|\/+$/g, '')}`;
    try {
        new URL(formatted); // Validate the URL
        return formatted;
    } catch {
        console.warn(`Invalid domain: ${domain}, using fallback`);
        return 'https://example.com';
    }
};
const slugifyText = (s) => clean(s).toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const normDash = (s) => slugifyText(s).replace(/\s+/g, '-');
const tokensFrom = (s) => slugifyText(s).split(' ').filter(Boolean);
const pathParts = (u) => {
    try {
        const { pathname } = new URL(u);
        return decodeURIComponent(pathname || '').toLowerCase().split('/').filter(Boolean);
    } catch {
        return String(u).toLowerCase().split('/').filter(Boolean);
    }
};

const _esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');


function fillAllPlaceholders(tpl, dict) {
    let out = String(tpl);
    for (const [key, val] of Object.entries(dict)) {
        out = out.replace(new RegExp(_esc(`{${key}}`), 'g'), String(val ?? ''));
    }
    return out;
};


const containsAll = (hay, needles) => needles.every(nd => hay.includes(nd));


const toTitleCase = (str) => str.replace(/\b[a-z]/g, c => c.toUpperCase());


const deriveSize = (url) => {
    const m1 = url.match(/[-_](\d{2,4})x(\d{2,4})(?=\.)/i);
    if (m1) return { w: +m1[1], h: +m1[2] };
    const m2 = url.match(/[_-](\d{3,5})(?=\.)/);
    if (m2) { const w = +m2[1]; return { w, h: Math.round(w * 0.62) }; }
    const m3 = url.match(/\/w[_-]?(\d{3,5}),h[_-]?(\d{3,5})\//i);
    if (m3) return { w: +m3[1], h: +m3[2] };
    return { w: 1200, h: 800 };
};


const bestAlt = (url, projectName = '', serviceType = '') => {
    const parts = pathParts(url);
    const last = parts[parts.length - 1] || '';
    const base = last.replace(/\.[a-z0-9]+$/i, '');
    const readable = base.replace(/[-_]+/g, ' ').trim();
    const ctx = serviceType || projectName;
    return readable ? `${toTitleCase(readable)} – ${ctx}` : `${projectName} ${ctx}`.trim();
};
const withImgAttrs = (html, projectName, serviceType) => html.replace(/<img\b([^>]*)>/gi, (_m, attrs) => {
    let tag = attrs;
    const has = (n) => new RegExp(`\\b${n}\\s*=`, 'i').test(tag);
    const get = (n) => { const mm = tag.match(new RegExp(`${n}\\s*=\\s*["']([^"']+)["']`, 'i')); return mm ? mm[1] : ''; };
    const src = get('src');
    if (!src) return `<img${attrs}>`;
    if (!has('alt')) {
        const alt = bestAlt(src, projectName, serviceType).replace(/"/g, '&quot;');
        tag += ` alt="${alt}"`;
    }
    const { w, h } = deriveSize(src);
    if (!has('width')) tag += ` width="${w}"`;
    if (!has('height')) tag += ` height="${h}"`;
    const ar = (w && h) ? (w / h).toFixed(3) : '1.500';
    const styleExists = get('style');
    const responsive = `max-width:800px;width:100%;height:auto;aspect-ratio:${ar}`;
    if (!styleExists) tag += ` style="${responsive}"`;
    else if (!/max-width|aspect-ratio|height:auto/i.test(styleExists)) tag = tag.replace(/style=["'][^"']*["']/, m => m.replace(/["']$/, `; ${responsive}"`));
    if (!has('loading')) tag += ` loading="lazy"`;
    if (!has('decoding')) tag += ` decoding="async"`;
    return `<img${tag}>`;
});


// === comparison render helpers (used later when filling the HTML template) ===
function esc(s) { return String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])); }


function buildWhatQuickAnswerPrompt(title, serviceType) {
    return `
Return ONLY valid JSON: {"quickAnswer": string}

Rules for quickAnswer:
- Plain text (no HTML/quotes/emojis).
- 2–3 sentences, 180–350 characters total.
- Start with a direct answer to "${title}".
- Include "${serviceType || title}" in the first sentence.
- Mention 1–2 key benefits and 1 risk/consideration.
- Be specific and self-contained.
`.trim();
}




function buildHeadToHeadHtml(sections) {
    return (sections || []).map((s, i) => `
    <article class="bl-card">
      <h3 class="bl-h3">${i + 1}) ${esc(s.title || '')}</h3>
      <p>${esc(s.content || '')}</p>
    </article>
  `).join('');
}

const anchorTextFor = (url, locationHints, serviceType) => {
    const parts = pathParts(url);
    const hasServices = parts.includes('services');
    let svc = serviceType;
    if (hasServices) {
        const idx = parts.indexOf('services');
        svc = parts[idx + 1] || serviceType;
    }
    const locHit = locationHints.find(loc => containsAll(parts.join(' '), loc.split(' ')));
    const svcReadable = svc ? toTitleCase(svc.replace(/-/g, ' ')) : 'Services';
    return locHit ? `${svcReadable} in ${toTitleCase(locHit)}` : svcReadable;
};
const ensureInBodyAnchors = (html, wantUrls, minCount, locationHints, serviceType) => {
    let out = html;
    const already = new Set(Array.from(html.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)).map(m => m[1]));
    const needed = wantUrls.filter(u => !already.has(u)).slice(0, Math.max(0, minCount - already.size));
    if (!needed.length) return { html: out, added: [] };

    const blocks = out.split(/(<\/?(?:p|h2|h3|li|section|div)[^>]*>)/gi);
    const added = [];

    const tryInsert = (blockIdx, url) => {
        const anchorText = anchorTextFor(url, locationHints, serviceType);
        if (!anchorText) return false;
        const re = new RegExp(`\\b(${anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'i');
        if (!/^</.test(blocks[blockIdx]) && re.test(blocks[blockIdx])) {
            blocks[blockIdx] = blocks[blockIdx].replace(re, `<a href="${url}" rel="noopener noreferrer nofollow">$1</a>`);
            added.push(url);
            return true;
        }
        if (!/^</.test(blocks[blockIdx]) && /[a-z]/i.test(blocks[blockIdx])) {
            blocks[blockIdx] = `${blocks[blockIdx]} <span><a href="${url}" rel="noopener noreferrer nofollow">${anchorText}</a>.</span>`;
            added.push(url);
            return true;
        }
        return false;
    };

    let bi = 0;
    for (const url of needed) {
        let placed = false;
        for (; bi < blocks.length && !placed; bi++) {
            if (/(^<\/?(p|h2|h3|li|section|div)\b)/i.test(blocks[bi])) continue;
            placed = tryInsert(bi, url);
        }
        if (!placed && bi < blocks.length) {
            blocks[bi] += ` <span><a href="${url}" rel="noopener noreferrer nofollow">${anchorTextFor(url, locationHints, serviceType)}</a>.</span>`;
            added.push(url);
        }
    }

    out = blocks.join('');
    return { html: out, added };
};

function hostnameLabel(u = "") { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } }
function cleanReferences(refs) {
    const banned = new Set(['example.com', 'www.example.com', 'test.com', 'www.test.com', 'sample.com', 'www.sample.com', 'localhost']);
    const cleaned = (Array.isArray(refs) ? refs : [])
        .map(u => String(u || '').trim()).filter(Boolean)
        .map(u => {
            try {
                const url = new URL(u);
                if (url.protocol !== 'https:') return '';
                if (banned.has(url.hostname.toLowerCase())) return '';
                ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid', 'igshid']
                    .forEach(p => url.searchParams.delete(p));
                url.hash = '';
                return url.toString();
            } catch { return ''; }
        })
        .filter(Boolean)
        .filter((u, i, a) => a.indexOf(u) === i);
    const referencesHtml = cleaned
        .map(u => `<li><a class="bl-external" target="_blank" rel="noopener" href="${u}">${hostnameLabel(u)}</a></li>`)
        .join('');
    return { cleanedRefs: cleaned, referencesHtml };
}

const siteLinksCache = new Map();

// Build and cache siteLinks for a project
async function getSiteLinksForProject(projectId, domain) {
    const cacheKey = `${projectId}:${domain}`;
    if (siteLinksCache.has(cacheKey)) return siteLinksCache.get(cacheKey);

    const rawSlugs = await Slug.distinct('slug', { projectId });
    const locationSlugs = [...new Set(
        rawSlugs.filter(s => typeof s === 'string' && s.trim())
            .map(s => `/${s.trim().replace(/^\/+/, '')}`)
    )].sort();

    const staticSlugs = ['/', '/privacy-policy', '/about', '/contact', '/terms-conditions', '/services', '/areas'];
    const rawServiceNames = await Service.distinct('service_name', { projectId });
    const serviceSlugs = rawServiceNames.map(clean).filter(Boolean).map(normDash).filter(Boolean);
    const servicePageSlugs = serviceSlugs.map(s => `/services/${s}`);
    const locationServiceSlugs = locationSlugs.flatMap(loc => serviceSlugs.map(s => `${loc.replace(/\/$/, '')}/services/${s}`));

    const allSlugs = [...new Set([...staticSlugs, ...locationSlugs, ...servicePageSlugs, ...locationServiceSlugs])];
    const siteLinks = allSlugs.map(slug => {
        try {
            return new URL(slug.replace(/^\/*/, '/'), domain + '/').href;
        } catch (err) {
            console.warn(`Invalid slug URL: ${slug} with base ${domain}/, skipping`);
            return null;
        }
    }).filter(Boolean);

    siteLinksCache.set(cacheKey, siteLinks);
    return siteLinks;
}

// Style rule for templates
// Put this near your other utils (top of file)
const ALLOWED_TYPES = new Set(['best', 'comparison', 'how', 'what']);

// Replace your existing styleRuleFrom with this exact version
function styleRuleFrom(typeRaw) {
    const t = String(typeRaw || '').toLowerCase();
    if (!ALLOWED_TYPES.has(t)) {
        throw new Error(`Invalid type "${t}". Allowed: best, comparison, how, what`);
    }
    if (t === 'comparison') return 'H1 must include "vs" or "versus"; include a concise comparison table and a verdict.';
    if (t === 'how') return 'H1 must start with "How to"; include a numbered list of steps.';
    if (t === 'what') return 'H1 must start with "What is"; include a plain-English definition, key points, and examples.';
    // t === 'best'
    return 'Make it a listicle with "Top <N>" or "Best <N>" and numbered H2 items.';
}



const wc = (s) => String(s || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;


function hasPlaceholders(html) {
    return /(\.\.\.|…|\bTBD\b|\bplaceholder\b|\blorem ipsum\b|Your text here)/i.test(String(html || ''));
}


function hasFaqs(html) {
    const qs = (html || '').match(/<h3[^>]*class=["'][^"']*\bbl-h3\b[^"']*["'][^>]*>/gi) || [];
    const ps = (html || '').match(/<p>/gi) || [];
    return qs.length >= 3 && ps.length >= 3;
}

function howLengthIssues(m) {
    const issues = [];
    const need = (k, min, max) => {
        const n = wc(m[k]);
        if (n < min || n > max) issues.push(`${k} ${n}w (need ${min}-${max})`);
        if (hasPlaceholders(m[k])) issues.push(`${k} has placeholders ("..." or similar)`);
    };

    need('introHtml', 100, 180);
    need('prepHtml', 100, 200);
    need('proHelpHtml', 100, 180);
    need('conclusionHtml', 100, 180);

    // whyHtml must be a list
    if (!m.whyHtml) {
        issues.push('whyHtml missing');
    } else if (!m.whyHtml.includes('<ul class="bl-bullets">') || (m.whyHtml.match(/<li\b/gi) || []).length !== 4) {
        issues.push('whyHtml invalid: must be <ul class="bl-bullets"> with exactly 4 <li> items');
    } else {
        const liRegex = /<li><strong>\w+(?:\s+\w+){1,4}:<\/strong>\s+\w+(?:\s+\w+){7,15}<\/li>/g;
        if ((m.whyHtml.match(liRegex) || []).length !== 4) {
            issues.push('whyHtml invalid: each <li> must have <strong>2–5 word label:</strong> 8–16 word description');
        }
    }

    // mistakesHtml must be a list with heading
    if (!m.mistakesHtml) {
        issues.push('mistakesHtml missing');
    } else if (!m.mistakesHtml.includes('<section id="mistakes"') || !m.mistakesHtml.includes('<ul class="bl-bullets">') || (m.mistakesHtml.match(/<li\b/gi) || []).length !== 4) {
        issues.push('mistakesHtml invalid: must be <section> with <h2>Common Mistakes to Avoid</h2> and <ul class="bl-bullets"> with 4 <li> items');
    } else {
        const liRegex = /<li><strong>\w+(?:\s+\w+){1,4}:<\/strong>\s+\w+(?:\s+\w+){7,15}<\/li>/g;
        if ((m.mistakesHtml.match(liRegex) || []).length !== 4) {
            issues.push('mistakesHtml invalid: each <li> must have <strong>2–5 word label:</strong> 8–16 word description');
        }
    }

    // steps must have proper structure and no placeholders
    if (!m.stepsHtml) {
        issues.push('stepsHtml missing');
    } else {
        const artCount = (m.stepsHtml.match(/<article class="bl-step">/gi) || []).length;
        if (artCount !== 4) issues.push(`stepsHtml must have exactly 4 <article class="bl-step"> (got ${artCount})`);
        const olCount = (m.stepsHtml.match(/<ol class="bl-numlist">/gi) || []).length;
        if (olCount !== 4) issues.push(`stepsHtml must have 4 <ol class="bl-numlist"> (got ${olCount})`);
        const asideCount = (m.stepsHtml.match(/<aside class="bl-protip">/gi) || []).length;
        if (asideCount !== 4) issues.push(`stepsHtml must have 4 <aside class="bl-protip"> (got ${asideCount})`);
        const h3Count = (m.stepsHtml.match(/<h3 class="bl-h3">Step \d — /gi) || []).length;
        if (h3Count !== 4) issues.push(`stepsHtml must have 4 <h3>Step X — Title</h3> (got ${h3Count})`);
        const liPerOl = m.stepsHtml.split(/<ol class="bl-numlist">/).slice(1).map(s => (s.match(/<li>/gi) || []).length);
        if (liPerOl.some(n => n < 2 || n > 4)) issues.push('stepsHtml <ol> must have 2–4 <li> each');
    }
    if (hasPlaceholders(m.stepsHtml)) issues.push('stepsHtml has placeholders ("..." or similar)');

    // faq needs real content too
    if (!hasFaqs(m.faqHtml)) {
        issues.push('faqHtml needs 3–5 FAQs as <h3.bl-h3>Q</h3><p>100–150 words</p>');
    } else if (hasPlaceholders(m.faqHtml)) {
        issues.push('faqHtml has placeholders ("..." or similar)');
    }

    return issues;
}





// ====== BEST: length/structure checks + targeted prompts ======
function bestLengthIssues(m) {
    const issues = [];
    const wc = (s) => String(s || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;

    // Strict-ish targets (keep a little looser than HOW)
    if (wc(m.introContent) < 120 || wc(m.introContent) > 220) {
        issues.push(`introContent ${wc(m.introContent)}w (need 120–220)`);
    }
    if (wc(m.whyTrust) < 120 || wc(m.whyTrust) > 220) {
        issues.push(`whyTrust ${wc(m.whyTrust)}w (need 120–220)`);
    }
    // Criteria: require at least 5 items
    if (!Array.isArray(m.criteria) || m.criteria.filter(Boolean).length < 5) {
        issues.push(`criteria < 5 (got ${Array.isArray(m.criteria) ? m.criteria.length : 0})`);
    }
    // FAQs: need 3–5 with non-empty Q/A; answers ~80–150 words
    if (!Array.isArray(m.faqs) || m.faqs.length < 3) {
        issues.push(`faqs < 3 (got ${Array.isArray(m.faqs) ? m.faqs.length : 0})`);
    } else {
        m.faqs.forEach((f, i) => {
            const a = wc(f?.answer);
            if (a < 80 || a > 160) issues.push(`faqs[${i}].answer ${a}w (need 80–150)`);
            if (!f?.question || !f?.answer) issues.push(`faqs[${i}] missing question/answer`);
        });
    }
    return issues;
}

// ====== COMPARISON: length/structure checks + targeted prompts ======
function comparisonLengthIssues(m) {
    const issues = [];
    const wc = (s) => String(s || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
    const arrLen = (a) => Array.isArray(a) ? a.filter(Boolean).length : 0;

    // Top-of-page items
    if (wc(m.quickAnswer) < 40 || wc(m.quickAnswer) > 120) {
        issues.push(`quickAnswer ${wc(m.quickAnswer)}w (need 40–120)`);
    }
    if (arrLen(m.summaryBullets) < 3) {
        issues.push(`summaryBullets < 3 (got ${arrLen(m.summaryBullets)})`);
    }
    if (arrLen(m.fastFacts) < 3) {
        issues.push(`fastFacts < 3 (got ${arrLen(m.fastFacts)})`);
    }

    // Intro
    if (wc(m.introHtml) < 120 || wc(m.introHtml) > 220) {
        issues.push(`introHtml ${wc(m.introHtml)}w (need 120–220)`);
    }

    // Quick Verdict table (prompt/renderer key: comparisonTable)
    if (!Array.isArray(m.comparisonTable) || m.comparisonTable.length < 6) {
        issues.push(`comparisonTable < 6 (got ${m.comparisonTable ? m.comparisonTable.length : 0})`);
    } else {
        m.comparisonTable.forEach((r, i) => {
            if (!r?.factor || !r?.a || !r?.b) issues.push(`comparisonTable[${i}] missing factor/a/b`);
        });
    }
    if (m.quickVerdictNote && wc(m.quickVerdictNote) > 80) {
        issues.push(`quickVerdictNote ${wc(m.quickVerdictNote)}w (max 80)`);
    }

    // Deep dives (A/B)
    if (wc(m.caseAHtml) < 120) issues.push(`caseAHtml ${wc(m.caseAHtml)}w (need >=120)`);
    if (wc(m.caseBHtml) < 120) issues.push(`caseBHtml ${wc(m.caseBHtml)}w (need >=120)`);

    // Head-to-head (renderer uses headToHeadHtml)
    const hhCount = (String(m.headToHeadHtml || '').match(/<article\b/gi) || []).length;
    if (hhCount < 3) {
        issues.push(`headToHeadHtml needs ≥3 <article> blocks (got ${hhCount})`);
    }

    // Recommendation lists (renderer uses chooseAList / chooseBList)
    if (arrLen(m.chooseAList) < 3) issues.push(`chooseAList < 3`);
    if (arrLen(m.chooseBList) < 3) issues.push(`chooseBList < 3`);
    if (wc(m.hybridHtml) < 80) issues.push(`hybridHtml ${wc(m.hybridHtml)}w (need >=80)`);

    // Verdict
    if (wc(m.verdictHtml) < 80 || wc(m.verdictHtml) > 160) {
        issues.push(`verdictHtml ${wc(m.verdictHtml)}w (need 80–160)`);
    }

    return issues;
}

function buildComparisonSectionPrompt(sectionKey, title, labels, opts = {}) {
    const { caseALabel, caseBLabel } = labels || {};
    const base = `
Return ONLY valid JSON. No markdown fences. Clear, neutral, helpful tone.
Comparison: "${title}"
Option A: "${caseALabel || 'Option A'}" | Option B: "${caseBLabel || 'Option B'}"
`.trim();

    switch (sectionKey) {
        case 'quickAnswer':
            return `${base}
Return ONLY {"out": string} with 40–120 words summarizing who should pick A vs B in one paragraph.`;
        case 'summaryBullets':
            return `${base}
Return ONLY {"bullets": string[]} with 3–5 short bullets finishing the sentence "Choose A vs B when…".`;
        case 'fastFacts':
            return `${base}
Return ONLY {"bullets": string[]} with 3–5 short neutral facts relevant to the comparison.`;
        case 'introHtml':
            return `${base}
Return ONLY {"out": string} with a single paragraph of 120–220 words introducing how to choose A vs B.`;
        case 'quickVerdictRows':
            return `${base}
Return ONLY {"rows":[{"factor":string,"a":string,"b":string}]} with 6–10 concise rows. Keep cells under ~12 words.`;
        case 'quickVerdictNote':
            return `${base}
Return ONLY {"out": string} with a <=80-word tip that helps readers decide fast.`;
        case 'caseAHtml':
            return `${base}
Return ONLY {"out": string} with 120–220 words explaining the case for ${caseALabel || 'A'} (strengths and trade-offs).`;
        case 'caseBHtml':
            return `${base}
Return ONLY {"out": string} with 120–220 words explaining the case for ${caseBLabel || 'B'} (strengths and trade-offs).`;
        case 'headToHeadSections':
            return `${base}
Return ONLY {"sections":[{"title":string,"content":string}]}
- 3–5 sections.
- Each content 80–160 words.
- Titles like "Developer Experience", "Cost", etc.`;
        case 'chooseA':
            return `${base}
Return ONLY {"bullets": string[]} with 3–6 concise bullets: "Choose ${caseALabel || 'A'} if you…".`;
        case 'chooseB':
            return `${base}
Return ONLY {"bullets": string[]} with 3–6 concise bullets: "Choose ${caseBLabel || 'B'} if you…".`;
        case 'hybridHtml':
            return `${base}
Return ONLY {"out": string} with 90–140 words describing a pragmatic hybrid strategy using A+B.`;
        case 'verdictHtml':
            return `${base}
Return ONLY {"out": string} with 90–140 words giving a balanced verdict and next step.`;
        default:
            return `${base}\nReturn ONLY {"out": ""}.`;
    }
}



function looksLikeCards(html) {
    return /<article[^>]*class=["'][^"']*\bbl-card\b[^"']*["'][^>]*>/i.test(String(html || ''));
}

function hasPlaceholderText(s) {
    const txt = String(s || '');
    const bad = [
        /120–?180 words/i,
        /describe key capabilities/i,
        /Short benefit label/i,
        /8–16 word/i,
        /framed constructively/i,
        /be specific/i
    ];
    return bad.some(re => re.test(txt));
}

// STRONGER Deep Dive prompt (no placeholders; no Option A/B)
function countCards(html) {
    const s = String(html || '');
    const m = s.match(/<article[^>]*class=["'][^"']*\bbl-card\b[^"']*["'][^>]*>/gi);
    return m ? m.length : 0;
}



// Strong prompt to (re)generate the Head-to-Head section in your exact structure.
function buildHeadToHeadFixPrompt(projectName, serviceType, title, caseALabel, caseBLabel) {
    return `
Return ONLY valid JSON: {"out": string}

Produce an HTML fragment for the "Head-to-Head" section with EXACTLY 5–6 <article class="bl-card"> blocks.
Each article MUST include:
- <h3 class="bl-h3">N) Short, specific factor title</h3>  (N starts at 1 and increments)
- <p>One paragraph (100–160 words) comparing **${caseALabel}** vs **${caseBLabel}**, concrete and specific to "${title}" in the "${serviceType}" niche. No lists, no tables.</p>

Rules:
- No placeholders like "120–180 words", "Short benefit label", etc.
- Be specific and grounded in realistic differences between ${caseALabel} and ${caseBLabel}.
- The HTML must be a fragment (no <section>, no <html>/<body>).
- Keep a professional tone, constructive trade-offs, no hype.

Context:
- Project: ${projectName}
- Service/Niche: ${serviceType}
- Blog Title: ${title}
- Option A label: ${caseALabel}
- Option B label: ${caseBLabel}
`.trim();
}


function buildBestSectionPrompt(sectionKey, title, serviceType, opts = {}) {
    const baseStyle = `
Return ONLY valid JSON. No markdown fences. Clear, practical, neutral tone. Avoid repetition.
Topic: "${title}"
Service/Niche: "${serviceType || '(not set)'}"
`.trim();

    if (sectionKey === 'introContent') {
        return `
${baseStyle}
Return ONLY {"out": string} where "out" is a single cohesive paragraph of 120–220 words that introduces the topic and sets expectations for readers.
`.trim();
    }

    if (sectionKey === 'whyTrust') {
        return `
${baseStyle}
Return ONLY {"out": string} where "out" is a single cohesive paragraph of 120–220 words that explains how picks were evaluated (testing, expert review, selection criteria) without fluff.
`.trim();
    }

    if (sectionKey === 'criteria') {
        return `
${baseStyle}
Return ONLY {"criteria": string[]} with 5–8 concise bullets (10–20 words each) describing how products/services were ranked (e.g., effectiveness, value, durability, availability, pro validation).
`.trim();
    }

    if (sectionKey === 'faqs') {
        return `
${baseStyle}
Return ONLY {"faqs":[{"question":string,"answer":string}]}
- Include 3–5 items.
- Each answer should be 90–150 words.
- Keep strictly on "${serviceType}" context; no generic filler.
`.trim();
    }

    return `
${baseStyle}
Return ONLY {"out": ""}.
`.trim();
}








// Open AI prompt for 'best' template
function buildBestPrompt(projectName, serviceType, title, topServicesList, imagesList, linksList, coverUrl, referencesList) {
    return `
IMPORTANT: This is a standalone task. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context”, “Media”, “Internal Links”, and “Writing Guide” blocks below. You MUST find real sources for the References field.


Return ONLY valid JSON with this shape:
{
  "title": string,
  "metaDescription": string,
  "canonicalUrl": string,
  "ogTitle": string,
  "ogDescription": string,
  "ogUrl": string,
  "ogImage": string,
  "siteName": string,
  "twitterTitle": string,
  "twitterDescription": string,
  "twitterImage": string,
  "siteUrl": string,
  "logoUrl": string,
  "youtubeUrl": string,
  "linkedinUrl": string,
  "twitterUrl": string,
  "searchUrl": string,
  "guidesUrl": string,
  "breadcrumbTitle": string,
  "articleHeadline": string,
  "articleDescription": string,
  "articleImage": string,

  "datePublished": string,
  "dateModified": string,
  "eyebrow": string,
  "mainTitle": string,
  "year": string,
  "dateUpdated": string,
  "readTime": string,
  "wordCount": string,
  "quickAnswer": string,
  "heroImage": string,
  "heroImageAlt": string,
  "heroImageSrcset": string,
  "heroCaption": string,
  "disclosure": string,
  "fastFacts": string[],
  "voicePrompts": string[],
  "tocItems": string[],
  "introContent": string,
  "whyTrust": string,
  "criteria": string[],
  "products": [
    {
      "id": string,
      "name": string,
      "badge": string,
      "description": string,
      "pros": string[],
      "cons": string[],
      "bestFor": string,
      "expertTake": string,
      "image": string,
      "imageAlt": string
    }
  ],
  "comparisonTable": [
    {
      "item": string,
      "mainUse": string,
      "typicalPrice": string,
      "skillLevel": string,
      "bestFor": string
    }
  ],
  "typesIntro": string,
  "typesList": string[],
  "matchingIntro": string,
  "matchingList": string[],
  "proInstallIntro": string,
  "proInstallList": string[],
  "faqs": [
    {
      "question": string,
      "answer": string
    }
  ],
  "references": string[],

  "verdict": string,
  "usedLinks": string[],
  "usedImages": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Provided Title: "${title}"
- Requested Style: "best"
- HARD STYLE RULE: Make it a listicle with "Top <N>" or "Best <N>" and numbered H2 items, where N is the number of services in Top Services (minimum 5, maximum 8).
- Top Services:
${topServicesList || "  (none)"}

Media:
- Cover image (optional): ${coverUrl || "(none)"}
- Candidate images (use 2–6 with alt+captions, select unique images for each product and related article):
${imagesList || "  (none)"}

Internal Links (pre-filtered: prefer location-specific service pages; use 3–6 IN-BODY with descriptive anchor text, avoid "learn more"):
${linksList || "  (none)"}

External Sources (use 3–5 for References; do NOT invent URLs; pick only from this list):
${referencesList || "  (none)"}

Writing Guide:
- Generate a comprehensive blog post (2000-2500 words) matching the provided title "${title}".
- Use placeholders in the template (e.g., {title}, {productsHtml}, {faqHtml}).
- Intro Content (populates the "introContent" field):
  • Write one paragraph of 120–180 words (no heading, no bullets).
  • Make it directly relevant to "${title}" and clearly tied to "${serviceType || title}".
  • Mention the exact number of picks (Top/Best N) taken from the Top Services list.
  • Open with the reader’s problem/benefit, then preview what the guide covers (criteria, typical price ranges, and who each option suits).
  • Include one bridging sentence that leads into the deeper sections (types, matching, professional installation) without listing them.
  • Avoid fluff and emojis; keep it specific and useful.
  • Place "${serviceType || title}" within the first two sentences.


- Disclosure (populates the "disclosure" field):
  • Write one 30–70 word paragraph (no heading) for the disclosure.  • Mention hands-on checks where possible and that specs are vetted with a licensed professional relevant to "${serviceType}" (e.g., plumber, electrician, HVAC tech; otherwise say "licensed professional").
  • Clearly state that we may earn a commission if readers buy via our links at no extra cost to them.
  • Plain text only (no markdown/emojis).
  • Example tone/template: We perform hands-on checks where possible and verify specs with a licensed ${serviceType ? serviceType + " professional" : "professional"}. If you buy via our links, we may earn a commission at no extra cost to you.


- Quick Answer (populates the "quickAnswer" field):
  • Write ONE punchy sentence that directly answers the search intent of the title "${title}".  
  • 110–150 characters, no line breaks, no quotes, no emojis.  
  • Include the primary keyword: "${serviceType || title}".  
  • If the title is a list (e.g., "Best X in Y"), summarize the #1 pick and the top criteria used.

- MUST include 5–8 products based on the Top Services list. If fewer than 5 services are provided, generate additional relevant products related to "${serviceType}" (e.g., for "${serviceType}", create relevant services like "${serviceType} Installation", "${serviceType} Maintenance"). Example product: 
  {
    "id": "1",
    "name": "${serviceType} Service",
    "badge": "Top Service",
    "description": "Professional ${serviceType} service to address specific needs effectively.",
    "pros": ["High-quality service", "Experienced team", "Reliable results"],
    "cons": ["May require scheduling", "Cost varies by scope"],
    "bestFor": "Customers needing professional ${serviceType} solutions",
    "expertTake": "${serviceType} services ensure optimal performance and longevity.",
    "image": "[from imagesList]",
    "imageAlt": "${serviceType} Service – ${projectName}"
  }
- Include a comparison table for all products (item, main use, price, skill level, best for). Example:
  {
    "item": "${serviceType} Service",
    "mainUse": "Providing ${serviceType} solutions",
    "typicalPrice": "$100-$500",
    "skillLevel": "Professional required",
    "bestFor": "Customers needing ${serviceType}"
  }
- Types (populates the "typesList" field):
  • Include 3–5 items, each as a single string.
  • Format each item as: <strong>Label:</strong> description
  • Put the colon inside the <strong>...</strong> tags, then a space, then the description.
  • Keep the description aligned to "${serviceType}" and the page topic.
  • Example:
    ["<strong>Standard ${serviceType}:</strong> Routine maintenance service to keep your bike in optimal condition.",
     "<strong>Emergency ${serviceType}:</strong> Quick fixes for unexpected issues to get you back on the road.",
     "<strong>Custom ${serviceType} Build:</strong> Tailored service to create a personalized setup for your needs.",
     "<strong>Wheel Truing Service:</strong> Precision adjustment to ensure your wheels are straight and true."]

  - Matching (3–5 criteria). Example: 
    ["Compatibility with user needs", "Performance in specific conditions", "Ease of use or installation", "Cost-effectiveness"]
  - Professional Installation (3–5 points). Example: 
    ["Ensures optimal setup and performance.", "Includes expert assessment.", "Uses high-quality materials.", "Reduces long-term costs."]
- Include 3–5 FAQs with concise Q&As (100-150 words each). Example: 
  {
    "question": "Why is ${serviceType} important?",
    "answer": "${serviceType} ensures effective solutions for specific needs, preventing issues and enhancing performance."
  }
- Include 3–5 related articles with URLs, titles, snippets, and images. Example: 
  {
    "url": "[from linksList]",
    "title": "${serviceType} Guide",
    "snippet": "Learn how to choose the best ${serviceType} solutions.",
    "image": "[from imagesList]",
    "imageAlt": "${serviceType} – ${projectName}"
  }
- fastFacts (REQUIRED):
  • Provide 3–5 concise bullets.
  • Each bullet MUST be a short phrase of 4–5 words (not a sentence).
  • No periods, commas, or emojis.
  • Examples:
    ["${serviceType} boosts daily efficiency",
     "Prevents costly future repairs",
     "Improves reliability and safety",
     "Saves time on maintenance"]

- Include 3–5 voice prompts for voice assistant integration. Example:
  ["Discover top ${serviceType} services.", "Learn about ${serviceType} solutions.", "Find the best ${serviceType} for your needs."]
  • Each bullet MUST be a short phrase of 4–5 words (not a sentence).


  - Ranking Criteria (populates the "criteria" field):
  • Include 3–6 criteria.
  • Each item must use "Label — short benefit" format (use an en dash —, not a hyphen -).
  • Keep labels concise (2–5 words) and the benefit 3–8 words; no trailing periods.
  • Examples:
    ["Effectiveness — stops leaks long-term",
     "Fit & Compatibility — easy to match & install",
     "Value — under $25 for most homes",
     "Durability & Safety — seal integrity; finish-safe",
     "Availability — U.S. online + big-box stores",
     "Pro Review — aligns with best practice"]

// References (populates the "references" array):
  • Use the model’s web browsing/search tool to find 4–8 external blogs or websites related to "${title}".
  • Only include live, canonical https URLs that return a 200 OK status (i.e., the page must exist and be accessible); remove tracking params; no placeholders (never use example.com/test.com/sample.com).
  • If a specific subpage is not accessible (e.g., returns 404 or other error), use the website’s homepage (e.g., https://www.example.com/) instead, ensuring it is still relevant to "${title}".
  • Prefer authoritative sources like .gov/.edu, manufacturer/support docs, standards bodies, trade associations, or reputable blogs/websites.
  • Each reference must be relevant to "${title}" and support specific claims or provide additional context.
  • Add each chosen reference URL to "usedLinks" as well.

- Embed chosen images as <figure><img ...><figcaption>...</figcaption></figure> in relevant sections.
- Avoid artifacts like "in X in X". Do not repeat the same link/image twice.
- Use descriptive anchor text for internal links (3–6 links in-body, e.g., "${serviceType} in [Location]").

Output Rules:
- Return ONLY the JSON object (no markdown fences, no extra text).
- Ensure ALL fields are populated, especially:
  - products: MUST include 5–8 items, using Top Services and generating additional relevant services if needed.
  - faqs: MUST include 3–5 items.
  - fastFacts: MUST include 3–5 items.
  - voicePrompts: MUST include 3–5 items.
  - criteria: MUST include 3–6 items, each as a single string formatted "Label — short benefit" using an en dash (—), with no trailing period.
- typesList: MUST include 3–5 items. Each item must start with <strong>Label:</strong> (colon inside the tag) followed by a space and the description. No extra HTML tags.

  - matchingList: MUST include 3–5 items.
  - proInstallList: MUST include 3–5 items.
  - references: MUST include 3–5 live https URLs found via browsing/search; unique; MUST NOT include example.com/test.com/sample.com/placeholder/lorem; each must support a concrete claim; also include them in "usedLinks".
- If real sources cannot be found, set "references": [] and append this sentence to "whyTrust": "Live-source citations are pending editorial review."


- "quickAnswer" MUST be present, directly answer the title’s intent, include "${serviceType || title}", and be <= 150 characters.
- "disclosure" MUST be a single 30–70 word plain-text paragraph (no heading) that mentions hands-on checks, verification with a licensed professional relevant to "${serviceType}", and that we may earn a commission at no extra cost to the reader.
- "introContent" MUST be a single 120–180 word paragraph, include "${serviceType || title}" in the first two sentences, reference the exact Top/Best N count from Top Services, and preview criteria and the upcoming sections (types, matching, professional installation).
- Ensure content is unique, avoids repetition, and aligns with the title "${title}".
- For year, use 2025.
`.trim();
}


function buildHowPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl) {
    return `
IMPORTANT: Standalone task. Use ONLY “Context”, “Media”, and “Internal Links”. NEVER return empty fields. If a field would be blank, synthesize useful, on-topic content that satisfies the rules.

Return ONLY valid JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "canonicalUrl": string,
  "ogTitle": string,
  "ogDescription": string,
  "ogUrl": string,
  "ogImage": string,
  "siteName": string,
  "twitterTitle": string,
  "twitterDescription": string,
  "twitterImage": string,

  "articleHeadline": string,
  "articleDescription": string,

  "datePublished": string,
  "dateModified": string,
  "dateHuman": string,
  "eyebrow": string,
  "mainTitle": string,
  "reviewedBy": string,
  "readTime": string,
  "wordCount": string,

  "quickAnswer": string,

  "heroImage": string,
  "heroImageAlt": string,
  "heroImageSrcset": string,
  "heroCaption": string,

  "tocItems": [
    {"href":"#toc","label":"Contents"},
    {"href":"#intro","label":"What You Will Learn / Introduction"},
    {"href":"#why","label":"Why is this task crucial?"},
    {"href":"#getting-started","label":"Getting Started: Tools & Preparation"},
    {"href":"#steps","label":"The Step-by-Step Process"},
    {"href":"#mistakes","label":"Common Mistakes to Avoid"},
    {"href":"#faqs","label":"FAQs"},
    {"href":"#pro-help","label":"When to Call a Professional"},
    {"href":"#conclusion","label":"Conclusion"}
  ],

  "toolsList": string[],
  "fastFacts": string[],
  "voicePrompts": string[],

  "introHtml": string,        // 100–180 words (HTML fragment)
"whyHtml": string,          // <ul class="bl-bullets"> with exactly 5 <li> items using <strong>Label:</strong> pattern; no paragraphs
"prepHtml": string,         // 100–200 words and MUST include:
                              //   <article id="tools"><h3>…</h3><ul class="bl-checklist">…</ul></article>
                              //   <article id="safety"><h3>…</h3><ul class="bl-checklist bl-checklist--warn">…</ul></article>
  "stepsHtml": string,        // REQUIRED: 4–6 <article class="bl-step"> blocks; EACH block MUST contain:
                              //   <h3 class="bl-h3">Step X — Title</h3>
                              //   <ol class="bl-numlist"><li>action</li>… (2–4 items)</ol>
                              //   Optional: <aside class="bl-protip"><strong>Pro Tip:</strong> …</aside>
  "mistakesHtml": string,     // EITHER 140–180 words OR a <ul class="bl-bullets"> with 5–8 items
  "faqHtml": string,          // REQUIRED: 3–5 FAQs; each EXACTLY:
                              //   <h3 class="bl-h3">Question?</h3>
                              //   <p>Answer of 100–150 words, no bullets/tables/links</p>
  "proHelpHtml": string,      // 100–180 words
  "conclusionHtml": string,   // 100–180 words

  "commentsHtml": string,



  "websiteJson": string,
  "breadcrumbJson": string,
  "schemaJson": string,

  "usedLinks": string[],
  "usedImages": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Provided Title: "${title}"
- Requested Style: "how"

HARD STYLE RULES:
- H1 must start with "How to".
- *_Html fields must be valid HTML fragments (no <html>/<head>/<body>).
- NEVER leave any *_Html field empty; if uncertain, create sensible, topic-appropriate content that fits the constraints.

Media:
- Hero (optional): ${coverUrl || "(none)"}
- Candidate images (2–6 unique with alt/captions):
${imagesList || "  (none)"}

Internal Links (3–6 in-body, descriptive anchors; avoid “learn more”):
${linksList || "  (none)"}

Writing Guide:
- Keep headings and layout exactly as in the template; you only provide content for placeholders.
- Use concrete, actionable instructions tailored to "${serviceType || title}".
- Avoid fluff; keep sentences clear and direct.

Sidebar Lists (arrays):
- toolsList (REQUIRED): 5–12 non-empty, unique items. If fewer than 5 would be returned, synthesize additional practical tools/materials relevant to "${serviceType || title}" until you reach 5. No duplicates.
  Example: ["Adjustable wrench", "PTFE tape", "Silicone-safe lubricant", "Hex key set", "Flashlight"]

- fastFacts (REQUIRED): 3–6 non-empty, unique items. If fewer than 3 would be returned, synthesize concise, useful facts until you reach 3. No duplicates.
  Example: ["Most fixes take under 30 minutes", "Shutoffs are usually under the sink", "Use silicone-safe lubricants on rubber"]

- voicePrompts (REQUIRED): 3–6 non-empty, unique items. If fewer than 3 would be returned, synthesize clear, assistant-friendly prompts until you reach 3.
  Example: ["Walk me through shutting off the water", "What tools do I need for ${serviceType || title}?", "How tight should the cartridge nut be?"]


SECTION REQUIREMENTS:
- introHtml:
  • One paragraph of 100–180 words.
  • Mention "${serviceType || title}" in the first two sentences.
  • Preview the process flow at a high level (what you’ll do and why it matters).

- whyHtml:
  • Provide a single <ul class="bl-bullets"> list with exactly 5 items. No text before or after the list.
  • Each item must be on one line and follow this exact pattern:
    <li><strong>2–5 word label:</strong> 8–16 words of explanation tied to "${serviceType || title}".</li>
  • The colon (:) MUST be inside the <strong>…</strong> tags, followed by a space, then the description.
  • Example:
    <li><strong>Save water &amp; money:</strong> A slow drip can waste dozens of gallons weekly.</li>

- prepHtml:
  • 100–200 words total wrapping two child articles:
    <article id="tools">
      <h3 class="bl-h3">Essential Tools &amp; Materials</h3>
      <ul class="bl-checklist"><li>tool/material 1</li>…</ul>
    </article>
    <article id="safety">
      <h3 class="bl-h3">Safety First: Key Precautions</h3>
      <ul class="bl-checklist bl-checklist--warn"><li>precaution 1</li>…</ul>
    </article>

- stepsHtml:
  • Provide 4–6 <article class="bl-step"> blocks.
  • EACH block MUST include:
    <h3 class="bl-h3">Step X — Title</h3>
    <ol class="bl-numlist"><li>action 1</li><li>action 2</li>(+ up to 4)</ol>
    Optional <aside class="bl-protip"><strong>Pro Tip:</strong> a concise expert tip tied to that step</aside>.

- mistakesHtml:
  • EITHER a single paragraph of 140–180 words,
  • OR a <ul class="bl-bullets"> with 5–8 concise mistakes (no numbering).

- faqHtml:
  • REQUIRED: 3–5 FAQ blocks; format must be:
    <h3 class="bl-h3">Question?</h3>
    <p>Answer of 100–150 words, specific to "${serviceType || title}", no lists/tables/links.</p>

- proHelpHtml:
  • One paragraph of 100–180 words explaining when to call a professional for "${serviceType || title}".

- conclusionHtml:
  • One paragraph of 100–180 words summarizing the outcome and next steps.

- quickAnswer:
  • Mandatory; 2–3 sentences, 140–300 characters total.
  • Plain text only (no HTML/quotes/line breaks/emojis).
  • Start with an action verb; summarize the first 3–5 key actions in order.
  • Include "Reassemble and test".
  • End with: "If the issue persists, consult a licensed ${serviceType ? serviceType + ' professional' : 'professional'}."

Output Rules:
- HARD MINIMUMS (arrays):
  • toolsList: 5–12 non-empty, unique strings; synthesize until 5 if needed
  • fastFacts: 3–6 non-empty, unique strings; synthesize until 3 if needed
  • voicePrompts: 3–6 non-empty, unique strings; synthesize until 3 if needed
- All *_Html fields MUST be non-empty and satisfy the exact length/structure above.
- stepsHtml MUST contain 4–6 <article class="bl-step"> and EACH must contain <ol class="bl-numlist"> with 2–4 <li>.
- faqHtml MUST contain 3–5 pairs of <h3 class="bl-h3"> + <p> (answers 100–150 words).
- tocItems MUST be exactly 9 entries using the labels shown above in the exact order.
- No markdown; return ONLY the JSON object (no extra text).

- whyHtml MUST start with <ul class="bl-bullets"> and end with </ul>, contain exactly 5 <li> items using <strong>Label:</strong> pattern; no paragraphs or extra text allowed.

`.trim();
}




// Open AI prompt for 'comparison' template

function buildComparisonPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl) {
    return `
IMPORTANT: Standalone task. Use ONLY “Context”, “Media”, “Internal Links”.

Return ONLY valid JSON:
{
  "title": string,
  "metaDescription": string,
  "canonicalUrl": string,
  "ogTitle": string,
  "ogDescription": string,
  "ogUrl": string,
  "ogImage": string,
  "siteName": string,
  "twitterTitle": string,
  "twitterDescription": string,
  "twitterImage": string,
  "siteUrl": string,
  "logoUrl": string,

  "breadcrumbJson": string,

  "articleHeadline": string,
  "articleDescription": string,
  "articleImage": string,



  "datePublished": string,
  "dateModified": string,
  "dateHuman": string,
  "eyebrow": string,
  "mainTitle": string,
  "reviewedBy": string,
  "readTime": string,
  "wordCount": string,

  "quickAnswer": string,
  "tldrAudioUrl": string,

  "heroImage": string,
  "heroImageAlt": string,
  "heroImageSrcset": string,
  "heroCaption": string,

  "summaryTitle": string,
  "summaryBullets": string[],

  "fastFacts": string[],
  "voicePrompts": string[],

"tocItems": [
    {"href":"#intro","label":"Introduction"},
    {"href":"#quick-verdict","label":"Quick Verdict"},
    {"href":"#case-a","label":"Option A Deep Dive"},
    {"href":"#case-b","label":"Option B Deep Dive"},
    {"href":"#head-to-head","label":"Head-to-Head Comparison"},
    {"href":"#recommendation","label":"Our Recommendation"},
    {"href":"#verdict","label":"Final Verdict"}
],

  "introTitle": string,
  "introHtml": string ,

  "quickVerdictTitle": string,
  "caseAName": string,
  "caseBName": string,
  "comparisonTable": [{"factor":string,"a":string,"b":string}][],
  "quickVerdictNote": string,

  "caseATitle": string,
  "caseAHtml": string,

  "caseBTitle": string,
  "caseBHtml": string,

  "headToHeadTitle": string,
  "headToHeadHtml": string,

  "recommendationTitle": string,
  "chooseATitle": string,
  "chooseAList": string[],
  "chooseBTitle": string,
  "chooseBList": string[],
  "hybridTitle": string,
  "hybridHtml": string,

  "verdictTitle": string,
  "verdictHtml": string 300–400 words.,
  "verdictCtaLabel": string,

  "reviewSummary": string,

  "relatedTitle": string,


  "usedLinks": string[],
  "usedImages": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Provided Title: "${title}"
- Requested Style: "comparison"
- HARD STYLE RULES:
  - H1 includes "vs" or "versus".
  - Include a concise **Quick Verdict** table + a final **Verdict** section.

Media:
- Hero (optional): ${coverUrl || "(none)"}
- Candidate images (2–6 unique with alt/captions):
${imagesList || "  (none)"}

Internal Links (3–6 in-body, descriptive anchors; avoid “learn more”):
${linksList || "  (none)"}

Writing Guide:
- 1200–1800 words. Clean semantic HTML inside *_Html fields (no <html>, <head>, <body>).
- Keep headings consistent with sections above.
- Do not repeat same image/link twice.

References (populates the "references" array):
  • Use the model’s web browsing/search tool to find 4–8 external blogs or websites related to "${title}".
  • Only include live, canonical https URLs that return a 200 OK status (i.e., the page must exist and be accessible); remove tracking params; no placeholders (never use example.com/test.com/sample.com).
  • If a specific subpage is not accessible (e.g., returns 404 or other error), use the website’s homepage (e.g., https://www.example.com/) instead, ensuring it is still relevant to "${title}".
  • Prefer authoritative sources like .gov/.edu, manufacturer/support docs, standards bodies, trade associations, or reputable blogs/websites.
  • Each reference must be relevant to "${title}" and support specific claims or provide additional context.
  • Add each chosen reference URL to "usedLinks" as well.

Output Rules:
- fastFacts: 3–6 items
- voicePrompts: 3–6 items
- comparisonTable: 6–10 factors

- Return ONLY the JSON object.
`.trim();
}




function buildHowSectionPrompt(sectionKey, topicTitle, serviceType, min, max) {
    let shape;
    if (sectionKey === 'stepsHtml') {
        shape = `Return ONLY {"out": string} where "out" is a valid HTML fragment with exactly 4 <article class="bl-step"> blocks.

Each <article class="bl-step"> MUST include:
- <h3 class="bl-h3">Step X — Title</h3> (X sequential from 1 to 4; Title starts with clear verb)
- <ol class="bl-numlist"> with exactly 2–4 <li> items
- <aside class="bl-protip"><strong>Pro Tip:</strong> concise expert tip (10–20 words) tied to this step</aside>

Writing rules:
- NO outer <section> or <h2> tags; only the 4 <article> blocks.
- NO placeholders: do not use "...", "TBD", "lorem", "placeholder", or "Your text here".
- Each <li> is a complete, specific instruction (8–20 words), imperative tone.
- Mention materials, tools, checks, and safety where relevant.
- No extra text between articles.`;
    }

    else if (sectionKey === 'mistakesHtml') {
        shape = `Return ONLY {"out": string} where "out" is a valid HTML fragment wrapped in:
<section id="mistakes" class="bl-card">

  <ul class="bl-bullets">
    [exactly 4 <li> items here]
  </ul>
</section>

Each <li> follows: <li><strong>2–5 word label:</strong> 8–16 words of explanation tied to "${serviceType || topicTitle}".</li>
- Colon (:) MUST be inside <strong>…</strong>, followed by a space, then the description.
- Example: <li><strong>Ignoring small leaks:</strong> Small drips can waste gallons and damage fixtures over time.</li>
- No extra text outside the <section> or <ul>.`;
    } else if (sectionKey === 'faqHtml') {
        shape = 'Return ONLY {"out": string} where "out" contains 3–5 FAQs using <h3 class="bl-h3">Question</h3><p>Answer (100–150 words)</p>.';
    } else {
        shape = `Return ONLY {"out": string} with a single cohesive HTML paragraph (no list) of ${min}-${max} words.`;
    }

    return `
${shape}

Context:
- Topic: "${topicTitle}"
- Service/Niche: "${serviceType || "(not set)"}"

Style:
- Clear, practical, neutral tone.
- No filler or repetition.
`.trim();
}


function buildWhatPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl) {
    return `
IMPORTANT: Standalone task. Use ONLY “Context”, “Media”, “Internal Links”.

Return ONLY valid JSON with this exact shape:
{
  "title": string,
  "metaDescription": string,
  "canonicalUrl": string,
  "ogTitle": string,
  "ogDescription": string,
  "ogUrl": string,
  "ogImage": string,
  "siteName": string,
  "twitterTitle": string,
  "twitterDescription": string,
  "twitterImage": string,

  "articleHeadline": string,
  "articleDescription": string,

  "reviewedBy": string,
  "reviewerImage": string,
  "reviewedNote": string,

  "datePublished": string,
  "dateModified": string,
  "dateHuman": string,

  "eyebrow": string,
  "mainTitle": string,
  "readTime": string,
  "wordCount": string,

  "quickAnswer": string,

  "heroImage": string,
  "heroImageAlt": string,
  "heroImageSrcset": string,
  "heroCaption": string,

  "fastFacts": string[],  // MUST include at least 3–6 unique facts
  "voicePrompts": string[],  // MUST include at least 3–6 unique prompts

  "tocItems": [
    {"href":"#intro","label":"What You Will Learn / Introduction"},
    {"href":"#basics","label":"Understanding the Basics"},
    {"href":"#benefits","label":"Top Benefits"},
    {"href":"#considerations","label":"Considerations"},
    {"href":"#faq","label":"FAQ"},
    {"href":"#verdict","label":"Verdict"}
  ],

  "introHtml": string,           // MUST be exactly 150–220 words; expand with details/examples
  "basicsTitle": string,
  "basicsHtml": string,          // MUST be exactly 160–240 words; expand with details/examples

  "benefitsTitle": string,
  "benefitsHtml": string,        // MUST include 5–10 <article> blocks, each with a single <p> of EXACTLY 70–100 words (count words after writing and adjust to hit this range).
                                 // REQUIRED H3 format: <h3 class="bl-h3">Benefit X — Title</h3> (X = 1..N, use em dash —)
                                 // Example block: <article><h3 class="bl-h3">Benefit 1 — Improved Efficiency</h3><p>Properly adjusting bike gears reduces energy wasted during pedaling, allowing riders to cover longer distances with less effort. This means cyclists can tackle steep inclines or rough terrains without excessive strain, enhancing the overall riding experience. By optimizing gear usage, riders can maintain a consistent cadence, leading to better endurance and reduced fatigue on extended journeys. Whether commuting or leisure riding, efficient gear shifting is key to maximizing performance and enjoyment.</p></article>
                                 // Do NOT include word counts (e.g., "(85 words)") in paragraph text.

  "considerationsTitle": string,
  "considerationsHtml": string,  // MUST include 4–5 <article> blocks, each with a single <p> of EXACTLY 110–160 words.
                                 // REQUIRED H3 format: <h3 class="bl-h3">Consideration X — Short, specific title</h3> (X = 1..N, use em dash —)
                                 // Example block: <article><h3 class="bl-h3">Consideration 1 — Proper Fit</h3><p>Ensuring bike leg guards fit properly is critical for comfort and safety. Ill-fitting guards can chafe, restrict movement, or fail to protect during impacts. Measure leg dimensions accurately and select guards with adjustable straps for a snug fit. For example, mountain bikers need tighter guards for rough trails, while commuters prefer breathable ones. A proper fit enhances mobility, prevents slippage, and protects against scrapes. Regularly check fit, as wear can alter sizing. This ensures performance and safety across terrains, making fit a top priority for riders.</p></article>
                                 // Titles MUST be unique, descriptive, under 7 words, and NOT phrased as questions (e.g., avoid "Why are bike leg guards important?").
                                 // Paragraphs MUST be unique, with no repeated sentences or ideas, and focus on practical considerations for "${title}".
                                 // Do NOT include word counts (e.g., "(120 words)") in paragraph text.
                                 // Do NOT use FAQ-style content (e.g., avoid repeating title as paragraph or question-like titles).

  "faqs": [{"question": string, "answer": string}], // MUST include 3–5 items, each answer 60–100 words

  "verdictTitle": string,
  "verdictText": string,         // 160–240 words

  "websiteJson": string,     // JSON-LD string (WebSite w/ SearchAction)
  "breadcrumbJson": string,  // JSON-LD string (BreadcrumbList)
  "articleJson": string,     // JSON-LD string (Article with speakable)
  "faqJson": string,         // JSON-LD string (FAQPage)

  "usedLinks": string[],
  "usedImages": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Provided Title: "${title}"
- Requested Style: "what"

HARD STYLE RULES:
- H1 must start with "What is" or directly answer “What/Why”.
- Sections required: Intro, Basics, Benefits (5–10 detailed articles), Considerations (4–5 detailed articles), FAQ (3–5), Verdict.
- Target total length: 1800–2500 words.

Media:
- Hero (optional): ${coverUrl || "(none)"}
- Candidate images (2–6 unique with alt/captions):
${imagesList || "  (none)"}

Internal Links (3–6 IN-BODY, descriptive anchors; avoid "learn more"):
${linksList || "  (none)"}

Writing Guide:
- *_Html fields are HTML fragments (no <html>/<head>/<body>).
- Each Benefits/Considerations <article> must include a <h3> and a paragraph of the specified length. After writing each paragraph, count the words and expand/shorten to exactly hit the range (e.g., add more examples or details if short).
- Do not repeat the same image or link twice.
- Voice- and AI-friendly phrasing.
- Prefer concrete benefits, risks, and examples for "${serviceType}".

Considerations (STRICT):
- Produce EXACTLY 4–5 <article> blocks.
- Each block MUST start with: <h3 class="bl-h3">Consideration X — Title</h3> where X is 1..N (use em dash —).
- Follow with one coherent <p> paragraph of EXACTLY 110–160 words that stays tightly on "${title}" (strict; expand with unique examples, scenarios, pros/cons to reach full length).
- Titles MUST be unique, descriptive, under 7 words, and NOT phrased as questions (e.g., avoid "Why are bike leg guards important?").
- Paragraphs MUST be unique, with no repeated sentences or ideas.
- No one-liners. No lists/tables. No FAQ-style content (e.g., avoid repeating title as paragraph).
- Use concrete, practical considerations tied to "${title}".
- Do NOT include word counts (e.g., "(120 words)") in paragraph text.
- Set "considerationsTitle" to: "Key Considerations When ${title}".
`.trim();
}

function buildWhatBenefitsFixPrompt(projectName, serviceType, title, minCount = 6) {
    return `
Return ONLY valid JSON:
{"benefitsHtml": string, "benefitsTitle": string}

Section Title:
- Set "benefitsTitle" to EXACTLY: "The Top N Benefits of ${title}"
  - N = number of articles you return (min ${minCount}, max ${minCount + 3})
  - Do NOT add a trailing period to the title.

Benefits HTML:
- Return ${minCount}–${minCount + 3} <article> blocks (min 5, max 10)
- EACH block MUST be:
  <article>
    <h3 class="bl-h3">Benefit X — Short, specific title</h3>
    <p>A single detailed paragraph of EXACTLY 70–100 words about "${title}". After writing, count words and expand with unique, concrete examples, real-world scenarios, implications, and practical details to hit exactly 70–100 words. No lists/tables. Each paragraph MUST be entirely distinct, with no repeated sentences, ideas, or phrasing across articles.</p>
  </article>
- Example block: <article><h3 class="bl-h3">Benefit 1 — Enhanced Safety</h3><p>Bike gears improve rider safety by allowing precise control on varied terrains. For instance, low gears help maintain stability on steep descents, reducing crash risks. Cyclists in hilly areas report 25% fewer accidents with proper gear use. Gears also enable quick adjustments to avoid obstacles, enhancing reaction time. This ensures safer rides in urban or trail settings, as gears keep the bike responsive. Regular maintenance prevents gear slippage, further boosting safety.</p></article>
- Do NOT include word counts (e.g., "(92 words)") in paragraph text.

Strict rules (NO meta text):
- Do NOT include phrases like: "One paragraph", "70–100 words", "No lists/tables", "focused on".
- Do NOT restate these instructions in the output.
- Every benefit title must be UNIQUE, under ~7 words, and NOT repeat the section title or other benefit titles.
- Use an em dash (—) in headings, not a hyphen (-).
- Keep the writing tied to "${title}" (NOT generic site services like "Local Bike Repair").
- MUST expand each paragraph with unique details to exactly hit 70–100 words; do not output if under/over—adjust by adding distinct examples/implications.
- Do NOT include word counts (e.g., "(92 words)") in paragraph text.
- Each paragraph MUST have completely unique content—no repeated sentences, phrases, or ideas across any articles, even in retries.

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Topic: "${title}"
`.trim();
}

function buildWhatConsiderationsFixPrompt(projectName, serviceType, title, minCount = 4) {
    return `
Return ONLY valid JSON:
{"considerationsHtml": string, "considerationsTitle": string}

Section Title:
- Set "considerationsTitle" to EXACTLY: "Key Considerations When ${title}"
  - Do NOT add a trailing period to the title.

Considerations HTML:
- Return ${minCount}–${minCount + 1} <article> blocks (min 4, max 5).
- EACH block MUST be:
  <article>
    <h3 class="bl-h3">Consideration X — Short, specific title</h3>
    <p>A single detailed paragraph of EXACTLY 110–160 words about "${title}". After writing, count words and expand with unique examples, scenarios, pros/cons, and practical details to hit 110–160 words. No lists/tables. Each paragraph MUST be unique, with no repeated sentences or ideas.</p>
  </article>
- Example block: <article><h3 class="bl-h3">Consideration 1 — Proper Fit</h3><p>Ensuring bike leg guards fit properly is critical for comfort and safety. Ill-fitting guards can chafe, restrict movement, or fail to protect during impacts. Measure leg dimensions accurately and select guards with adjustable straps for a snug fit. For example, mountain bikers need tighter guards for rough trails, while commuters prefer breathable ones. A proper fit enhances mobility, prevents slippage, and protects against scrapes. Regularly check fit, as wear can alter sizing. This ensures performance and safety across terrains, making fit a top priority for riders.</p></article>

Strict rules:
- Do NOT include word counts (e.g., "(120 words)") in paragraph text.
- Titles MUST be unique, descriptive, under 7 words, and NOT phrased as questions (e.g., avoid "Why are bike leg guards important?").
- Paragraphs MUST be unique, with no repeated sentences or ideas.
- No FAQ-style content (e.g., avoid repeating title as paragraph).
- Use an em dash (—) in headings, not a hyphen (-).
- Keep writing tied to "${title}" (NOT generic services like "Local Bike Repair").
- Do NOT output if paragraphs are under/over 110–160 words; adjust with unique details.

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Topic: "${title}"
`.trim();
}


// Targeted prompts for missing sections
function buildProductsPrompt(projectName, serviceType, topServicesList, imagesList, existingProducts) {
    return `
IMPORTANT: This is a standalone task to generate additional products for a blog post. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context” and “Media” blocks below.

Return ONLY valid JSON with this shape:
{
  "products": [
    {
      "id": string,
      "name": string,
      "badge": string,
      "description": string,
      "pros": string[],
      "cons": string[],
      "bestFor": string,
      "expertTake": string,
      "image": string,
      "imageAlt": string
    }
  ],
  "comparisonTable": [
    {
      "item": string,
      "mainUse": string,
      "typicalPrice": string,
      "skillLevel": string,
      "bestFor": string
    }
  ]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"
- Top Services:
${topServicesList || "  (none)"}
- Existing Products (do not duplicate):
${existingProducts.map(p => p.name).join('\n') || "  (none)"}

Media:
- Candidate images (select unique images for each product):
${imagesList || "  (none)"}

Instructions:
- Generate 2–5 additional products to reach a total of 5–8 products for a blog post about "${serviceType}".
- Each product must be unique, relevant to "${serviceType}", and not duplicate existing products.
- Use the Top Services list to generate products. If insufficient, create relevant products (e.g., ${serviceType} Installation, ${serviceType} Maintenance).
- Each product must have:
  - id: Unique string (e.g., "2", "3").
  - name: Descriptive service name.
  - badge: Label like "Top Service", "Best Value", etc.
  - description: 100-150 words describing the service.
  - pros: 3–5 benefits.
  - cons: 2–3 drawbacks.
  - bestFor: Target audience (e.g., "Customers needing ${serviceType}").
  - expertTake: 100-150 word expert opinion.
  - image: Select from candidate images (unique per product).
  - imageAlt: Descriptive alt text including "${serviceType}".
- Include a comparison table entry for each product (item, main use, typical price, skill level, best for).
- Example product:
  {
    "id": "2",
    "name": "${serviceType} Installation",
    "badge": "Best Durability",
    "description": "Professional installation of ${serviceType} to ensure optimal performance.",
    "pros": ["Long-lasting results", "Expert setup", "High-quality materials"],
    "cons": ["Higher initial cost", "Requires professional service"],
    "bestFor": "Customers needing reliable ${serviceType}",
    "expertTake": "${serviceType} installation ensures safety and efficiency.",
    "image": "[from imagesList]",
    "imageAlt": "${serviceType} Installation – ${projectName}"
  }
- Example comparison table entry:
  {
    "item": "${serviceType} Installation",
    "mainUse": "Providing ${serviceType} solutions",
    "typicalPrice": "$100-$500",
    "skillLevel": "Professional required",
    "bestFor": "Customers needing ${serviceType}"
  }
- Avoid artifacts like "in X in X". Do not repeat images or product names.
- Return ONLY the JSON object (no markdown fences, no extra text).
`.trim();
}

function buildTypesListPrompt(projectName, serviceType) {
    return `
IMPORTANT: This is a standalone task to generate a typesList for a blog post. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context” block below.

Return ONLY valid JSON with this shape:
{
  "typesList": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"

Instructions:
- Generate 3–5 types of "${serviceType}" services for a buyer’s guide section.
- Each type must be a concise description (20–50 words) of a specific type of service or product related to "${serviceType}".
- Example typesList:
  [
    "Standard ${serviceType}: Reliable for typical use cases with dependable performance.",
    "Premium ${serviceType}: Enhanced features for advanced needs and superior results.",
    "Budget ${serviceType}: Cost-effective solution for basic requirements."
  ]
- Ensure each type is unique and relevant to "${serviceType}".
- Avoid artifacts like "in X in X".
- Return ONLY the JSON object (no markdown fences, no extra text).
`.trim();
}

function buildMatchingListPrompt(projectName, serviceType) {
    return `
IMPORTANT: This is a standalone task to generate a matchingList for a blog post. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context” block below.

Return ONLY valid JSON with this shape:
{
  "matchingList": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"

Instructions:
- Generate 3–5 criteria for matching "${serviceType}" services to user needs for a buyer’s guide section.
- Each criterion must be concise (10–30 words) and describe a key factor to consider when choosing a service.
- Example matchingList:
  [
    "Compatibility with user needs for optimal performance.",
    "Performance in specific conditions to ensure reliability.",
    "Ease of use or installation to save time.",
    "Cost-effectiveness to meet budget constraints."
  ]
- Ensure each criterion is unique and relevant to "${serviceType}".
- Avoid artifacts like "in X in X".
- Return ONLY the JSON object (no markdown fences, no extra text).
`.trim();
}

function buildProInstallListPrompt(projectName, serviceType) {
    return `
IMPORTANT: This is a standalone task to generate a proInstallList for a blog post. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context” block below.

Return ONLY valid JSON with this shape:
{
  "proInstallList": string[]
}

Context:
- Project: "${projectName}"
- Service/Niche: "${serviceType || "(not set)"}"

Instructions:
- Generate 3–5 points highlighting the importance of professional installation for "${serviceType}" services.
- Each point must be concise (10–30 words) and describe a benefit of professional installation.
- Example proInstallList:
  [
    "Ensures optimal setup and performance.",
    "Includes expert assessment for reliability.",
    "Uses high-quality materials for durability.",
    "Reduces long-term maintenance costs."
  ]
- Ensure each point is unique and relevant to "${serviceType}".
- Avoid artifacts like "in X in X".
- Return ONLY the JSON object (no markdown fences, no extra text).
`.trim();
}

// Queue worker
aiblogsQueue.process(3, async (job) => {
    const step = async (p, m) => { if (m) console.log(`[aiblogsQueue:${job.id}] ${m}`); await job.progress(p); };

    try {
        const { userId, projectId, type, status, title,isSchedule,scheduleTime,slug } = job.data;

        var { authorId } = job.data



        if (!projectId) throw new Error('projectId missing');
        if (!title) throw new Error('title missing');



        // Assuming authorId is coming in the request (passed dynamically)
        if (!authorId) {
            authorId = '68bafb382452d540887d8945'
        }

        // Fetch author details from the database using the Author model
        const author = await Author.findById(authorId).exec();
        if (!author) {
            throw new Error('Author not found');
        }
        const authorName = author.name

        // Now, you have the author details (author.name, author.image, author.about)




        const WriterName = author.name;

        
        // BASE_URL for images - must be apis.smartlybuild.dev (no trailing slash)
        const BASE_URL = process.env.BASE_URL || 'https://apis.smartlybuild.dev';

        const WriterImage = author.image ? new URL(author.image, BASE_URL).toString() : '';

        const WriterBio = author.bio || '';                 // <– use .bio (not .about)
        const WriterJobTitle = author.jobTitle || 'Blog writer'; // <– use .jobTitle
        const WriterLinks = Array.isArray(author.links) ? author.links : [];
        // Build visible author links row (HTML) and JSON-LD sameAs list
        // ===== BEGIN AUTHOR LINKS BUILD (no esc) =====
        const authorLinksHtml = (Array.isArray(WriterLinks) ? WriterLinks : [])
            .filter(l => l && l.url && isSafeHttpUrl(l.url))
            .map(l => {
                const href = l.url; // no escaping by request
                const label = (l.label && l.label.trim()) || hostnameLabel(l.url);
                // keep attributes simple to avoid quote issues since we aren't escaping
                return `<a href="${href}" rel="me nofollow noopener" target="_blank">${label}</a>`;
            })
            .join(" · ");

        const authorSameAs = JSON.stringify(
            (Array.isArray(WriterLinks) ? WriterLinks : [])
                .map(l => l && l.url)
                .filter(Boolean)
                .filter(isSafeHttpUrl)
        );
        // ===== END AUTHOR LINKS BUILD =====


        const WriterRating = 5;
        // Map the author details into the final content before rendering


        console.log(WriterName, "name", WriterImage, "image", WriterBio, "bio", WriterLinks, "writer info!!!!!!");



        const styleText = String(type || '').toLowerCase();
        if (!ALLOWED_TYPES.has(styleText)) {
            throw new Error(`Invalid type "${styleText}". Allowed: best, comparison, how, what`);
        }
        const styleRule = styleRuleFrom(styleText);


        await step(5, 'Loading project');
        const project = await UserProject.findById(projectId).lean();
        if (!project) throw new Error(`Project ${projectId} not found`);

        const domain = ensureOrigin(project.domainName || '');
        const projectName = clean(project.projectName || 'Project');
        const serviceType = clean(project.serviceType || title || 'Services');


        // Build siteLinks
        await step(12, 'Building site links');
        const siteLinks = await getSiteLinksForProject(projectId, domain);

        await step(13, 'Building blogs internal or external list');

        try {
            var internalLinks = await axios.post(
                `${BASE_URL}/admin/v1/related_blogs`,
                { projectId: projectId }, // 👈 send projectId here
                { timeout: 30000 }
            );

            internalLinks=internalLinks.data.items

            let prompt = `please give me around 5-10 relevant and live external links related to ${title} do not include any internal links from my website. please provide only the links in a json array format like this ["link1","link2","link3"]`

            let pageId = `ai_blog_${projectId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
            var externalLinks = await fetchJSONFromOpenAI(prompt, 'CREATE_AI_BLOG_SIMPLE', {
                userId,
                projectId,
                pageId,
                promptFrom: 'aiblogsQueue',
                promptFor: `${projectName}::${title}`,
                disableMemory: true,
                noFewShot: true,
                newThread: true
            });

            console.log(internalLinks, externalLinks, "internal and external links")
        }
        catch (error) {
            console.log("error in fetching external or internal links", error)
        }


        // Services main
        await step(15, 'Fetching services');
        const servicesMain = await Service.find({ projectId, is_main: true }).select('service_name').limit(30).lean();
        let topServicesList = servicesMain.map((s, i) => `  ${i + 1}. ${clean(s.service_name)}`).join('\n');
        if (servicesMain.length < 5) {
            const additionalServices = await Service.find({ projectId, is_main: false }).select('service_name').limit(5 - servicesMain.length).lean();
            topServicesList += '\n' + additionalServices.map((s, i) => `  ${servicesMain.length + i + 1}. ${clean(s.service_name)}`).join('\n');
        }

        // Fetch images
        await step(20, 'Fetching images');
        let coverUrl = '';
        let imagePool = [];

        try {
            const mages = await axios.post(
                `${BASE_URL}/admin/v1/fetch_and_save_images`,
                { prompt: title },
                { timeout: 30000 }
            );
            const arr = Array.isArray(mages?.data?.data) ? mages.data.data : [];
            imagePool = arr.slice(0, 20);
            coverUrl = arr[2] || arr[0] || '';

            console.log(arr, "arr fetched here", title)
        } catch (e) {
            console.warn('[aiblogsQueue] image fetch skipped:', e.message);
            imagePool = [
                'https://apis.smartlybuild.dev/images/blogs/1756875396079_1756875396078_2.webp',
                'https://apis.smartlybuild.dev/images/blogs/1756875394694_1756875394694_0.webp',
                'https://apis.smartlybuild.dev/images/blogs/1756875395284_1756875395284_1.webp'
            ];
            coverUrl = imagePool[0];
        }

        // Relevance signals
        const titleTokens = new Set(tokensFrom(title));
        const serviceSeedsText = [...new Set([serviceType, ...servicesMain.map(s => clean(s.service_name))].filter(Boolean))];
        const serviceVariants = new Set();
        for (const s of serviceSeedsText) {
            const spaced = slugifyText(s);
            const dashed = normDash(s);
            if (spaced) serviceVariants.add(spaced);
            if (dashed) serviceVariants.add(dashed);
        }
        const tks = tokensFrom(title);
        for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= tks.length; i++) {
            const gramSp = tks.slice(i, i + n).join(' ');
            const gramDh = gramSp.replace(/\s+/g, '-');
            serviceVariants.add(gramSp); serviceVariants.add(gramDh);
        }

        const locationHints = (() => {
            const out = [];
            const re = /\b(?:in|at|within|near)\s+([A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*){0,3})\b/gi;
            let m; while ((m = re.exec(title))) out.push(slugifyText(m[1]));
            return [...new Set(out)];
        })();

        const scoreLink = (url) => {
            const parts = pathParts(url);
            const hay = parts.join(' ');
            let s = 0;
            if (parts.includes('services')) s += 10;
            let svcHits = 0;
            for (const v of serviceVariants) if (v && hay.includes(v)) svcHits++;
            s += svcHits * 6;
            let locHits = 0;
            for (const loc of locationHints) {
                const lt = loc.split(' ').filter(Boolean);
                if (lt.length && containsAll(hay, lt)) locHits++;
            }
            s += locHits * 10;
            if (svcHits > 0 && locHits > 0) s += 30;
            for (const tok of titleTokens) if (tok.length >= 3 && hay.includes(tok)) s += 2;
            for (const seg of parts) if (serviceVariants.has(seg)) s += 8;
            s += Math.max(0, 6 - Math.min(parts.length, 6));
            return s;
        };

        const ranked = siteLinks.map(u => ({ u, s: scoreLink(u) })).sort((a, b) => b.s - a.s);
        const isLocService = (u) => {
            const p = pathParts(u);
            const hasSvc = Array.from(serviceVariants).some(v => p.includes(v) || p.join(' ').includes(v));
            const hasLoc = locationHints.some(loc => containsAll(p.join(' '), loc.split(' ')));
            return p.includes('services') && hasSvc && hasLoc;
        };
        const isSvcOnly = (u) => {
            const p = pathParts(u);
            const hasSvc = Array.from(serviceVariants).some(v => p.includes(v) || p.join(' ').includes(v));
            return p[0] === 'services' && hasSvc;
        };
        const isLocRoot = (u) => locationHints.some(loc => containsAll(pathParts(u).join(' '), loc.split(' ')));
        const isServicesRoot = (u) => pathParts(u)[0] === 'services' && pathParts(u).length <= 2;

        const pushUnique = (arr, url) => { if (!arr.includes(url)) arr.push(url); };
        let selectedLinks = [];
        ranked.filter(x => isLocService(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
        ranked.filter(x => isLocRoot(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
        ranked.filter(x => isSvcOnly(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
        ranked.filter(x => isServicesRoot(x.u)).forEach(x => pushUnique(selectedLinks, x.u));
        ranked.forEach(x => pushUnique(selectedLinks, x.u));
        selectedLinks = selectedLinks.slice(0, Math.min(6, Math.max(3, selectedLinks.length)));

        // Load template from Redis
        await step(30, 'Loading template from disk');
        let template = await loadTemplate(styleText);
        if (!template) {
            console.warn(`Template for ${styleText} not found, using default`);
            template = await loadTemplate('default');
        }

        // Build OpenAI prompt for 'best' template
        await step(35, 'Building prompt');
        const imagesList = imagePool.map((u, i) => `  ${i + 1}. ${u}`).join('\n');
        const linksList = selectedLinks.map((u, i) => `  ${i + 1}. ${u}`).join('\n');
        let prompt;
        if (styleText === 'best') {
            prompt = buildBestPrompt(projectName, serviceType, title, topServicesList, imagesList, linksList, coverUrl);
        } else if (styleText === 'comparison') {
            prompt = buildComparisonPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl);
        }
        else if (styleText === 'how') { // NEW
            prompt = buildHowPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl);
        }


        else if (styleText === 'what') {
            prompt = buildWhatPrompt(projectName, serviceType, title, imagesList, linksList, coverUrl);
        }

        else {
            // HOW / WHAT generic prompt
            prompt = `
        IMPORTANT: This is a standalone task. IGNORE any prior prompts, outputs, or context. Use ONLY the “Context”, “Media”, “Internal Links”, and “Writing Guide” blocks below. You MUST find real sources for the References field.


        Return ONLY valid JSON:
        {
        "title": string,
        "content_html": string,
        "used_links": string[],
        "used_images": string[],
        "meta": { "title": string, "description": string, "keywords": string[] }
        }

        Context:
        - Project: "${projectName}"
        - Service/Niche: "${serviceType || "(not set)"}"
        - Provided Title: "${title}"
        - Requested Style: "${styleText}"
        - HARD STYLE RULE: ${styleRule}
        - Top Services:
        ${topServicesList || "  (none)"}

        Media:
        - Cover image (optional): ${coverUrl || "(none)"}
        - Candidate images (use 2–6 with alt+captions):
        ${imagesList || "  (none)"}

        Internal Links (3–6 in-body, descriptive anchors; avoid “learn more”):
        ${linksList || "  (none)"}

        Writing Guide:
        - 1200–1800 words of clean semantic HTML in content_html (no <html>/<head>/<body>).
        - Include H2/H3 structure, optional FAQ (3–5 Q&As), “Key Takeaways” near the end.
        - Embed chosen images as <figure><img ...><figcaption>...</figcaption></figure>.
        - Avoid artifacts like “in X in X”. Don’t repeat same link/image twice.

        Output Rules:
        - Return ONLY the JSON object.
        `.trim();
        }


        // OpenAI call
        await step(55, 'Calling OpenAI');
        const pageId = `ai_blog_${projectId}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
        let model = await fetchJSONFromOpenAI(prompt, 'CREATE_AI_BLOG_SIMPLE', {
            userId,
            projectId,
            pageId,
            promptFrom: 'aiblogsQueue',
            promptFor: `${projectName}::${title}`,
            disableMemory: true,
            noFewShot: true,
            newThread: true
        });

        if (!Array.isArray(model.references) || model.references.length < 4) {
            console.log(`[aiblogsQueue:${job.id}] Retrying for 4–8 references`);
            const retryPrompt = buildReferencesAsk(title, serviceType);
            const retryResponse = await fetchJSONFromOpenAI(retryPrompt, 'CREATE_AI_BLOG_REFERENCES', {
                userId,
                projectId,
                pageId,
                promptFrom: 'aiblogsQueue',
                promptFor: `${projectName}::${title}::references`,
                disableMemory: true,
                noFewShot: true,
                newThread: true
            });
            if (Array.isArray(retryResponse) && retryResponse.length >= 4) {
                model.references = retryResponse.slice(0, 8);
            }
        }

        console.log(`[aiblogsQueue:${job.id}] References returned:`, model.references);

        if (typeof model === 'string') { try { model = JSON.parse(model); } catch { throw new Error('Invalid JSON response from OpenAI'); } }
        if (!model || typeof model !== 'object') throw new Error('Model did not return a valid JSON object.');

        // Log OpenAI response for debugging
        console.log(`[aiblogsQueue:${job.id}] OpenAI Response:`, JSON.stringify(model, null, 2));


        // --- HOW: patch short/missing sections right away (before validation) ---
        if (styleText === 'how') {
            let issues = howLengthIssues(model);
            if (issues.length) {
                console.log(`[aiblogsQueue:${job.id}] HOW length/structure issues:`, issues);

                const fixOrder = [
                    'introHtml',
                    'whyHtml',
                    'prepHtml',
                    'stepsHtml',
                    'mistakesHtml',
                    'faqHtml',
                    'proHelpHtml',
                    'conclusionHtml'
                ];

                for (const key of fixOrder) {
                    if (!issues.some(i => i.startsWith(key))) continue;

                    let prompt;

                    if (key === 'whyHtml') {
                        // Force bullets-only list for WHY with strict JSON output
                        prompt = `
Return ONLY a JSON object: {"out": "<ul class=\"bl-bullets\">...</ul>"} with EXACTLY 4 <li> items.
Title: "${title}"
Service/Niche: "${serviceType || title}"

Requirements:
- Output: {"out": "<ul class=\"bl-bullets\"> ... </ul>"}
- Exactly 4 <li> items; no text before or after the <ul>
- Each <li> follows: <li><strong>2–5 word label:</strong> 8–16 words of explanation tied to "${serviceType || title}".</li>
- Colon (:) MUST be inside <strong>…</strong>, followed by a space, then the description.
- Example: <li><strong>Save water &amp; money:</strong> A slow drip can waste dozens of gallons weekly.</li>
- No paragraphs, headings, or other tags outside the <ul>.
- Escape quotes in JSON properly.
    `.trim();
                    }
                    else if (key === 'stepsHtml') {
                        // Enforce 4–6 step blocks with numbered actions and an optional pro tip
                        prompt = `
Return ONLY a valid HTML fragment containing 4–6 <article class="bl-step"> blocks for "${serviceType || title}".
Each block MUST include:
- <h3 class="bl-h3">Step X — Title</h3>  (use sequential X starting at 1)
- <ol class="bl-numlist"><li>action 1</li><li>action 2</li>(+ up to 2 more)</ol>  (2–4 actions)
- Optional: <aside class="bl-protip"><strong>Pro Tip:</strong> concise, practical tip tied to this step</aside>
No wrapping <html>/<body> and no extra content before/after the step articles.
        `.trim();
                    } else if (key === 'mistakesHtml') {
                        // Prefer bullet list; allow paragraph fallback
                        prompt = `
Return ONLY a valid HTML fragment for common mistakes for "${serviceType || title}".
Preferred format:
- <ul class="bl-bullets"> with 5–8 concise mistakes (no numbering), each as one line.
Acceptable fallback if absolutely necessary:
- One paragraph of 140–180 words.
Do NOT include any other text or wrappers.
        `.trim();
                    } else if (key === 'faqHtml') {
                        // Strict FAQ format
                        prompt = `
Return ONLY a valid HTML fragment with 3–5 FAQs for "${serviceType || title}".
Each FAQ MUST be exactly:
<h3 class="bl-h3">Question?</h3>
<p>Specific answer of 100–150 words, no lists/tables/links.</p>
No extra text before/after; no other tags.
        `.trim();
                    } else {
                        // Length-based general sections (intro, prep, proHelp, conclusion)
                        const ranges = {
                            introHtml: [140, 180],
                            prepHtml: [140, 200],
                            proHelpHtml: [140, 180],
                            conclusionHtml: [140, 180]
                        };
                        const [min, max] = ranges[key] || [140, 180];
                        prompt = buildHowSectionPrompt(key, title, serviceType, min, max);
                    }

                    const fix = await fetchJSONFromOpenAI(prompt, 'HOW_SECTION_FIX', {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::${key}`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true
                    });

                    if (fix && typeof fix.out === 'string' && fix.out.trim()) {
                        model[key] = fix.out.trim();
                    }
                }

                // Re-check after fixes (log remaining)
                issues = howLengthIssues(model);
                if (issues.length) {
                    console.warn('[aiblogsQueue:%s] Remaining HOW issues:', job.id, issues);
                }
            }
        }



        // --- BEST: patch short/missing sections right away (before validation) ---
        if (styleText === 'best') {
            let issues = bestLengthIssues(model);
            if (issues.length) {
                console.log(`[aiblogsQueue:${job.id}] BEST length/structure issues:`, issues);

                // targeted fix order
                const fixOrder = ['introContent', 'whyTrust', 'criteria', 'faqs'];
                for (const key of fixOrder) {
                    // only fix keys that were flagged
                    const needs = issues.some(i => i.startsWith(key) || i.includes(`${key} <`));
                    if (!needs) continue;

                    const prompt = buildBestSectionPrompt(key, title, serviceType);
                    const fix = await fetchJSONFromOpenAI(prompt, 'BEST_SECTION_FIX', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::${key}`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });

                    if (key === 'criteria' && Array.isArray(fix?.criteria) && fix.criteria.length) {
                        model.criteria = fix.criteria;
                    } else if (key === 'faqs' && Array.isArray(fix?.faqs) && fix.faqs.length) {
                        model.faqs = fix.faqs;
                    } else if (typeof fix?.out === 'string' && fix.out.trim()) {
                        model[key] = fix.out.trim();
                    }
                }

                // Re-check (log remaining)
                issues = bestLengthIssues(model);
                if (issues.length) console.warn('[aiblogsQueue:%s] Remaining BEST issues:', job.id, issues);

                // --- COMPARISON: patch short/missing sections right away (before validation) ---
                if (styleText === 'comparison') {
                    const labels = {
                        caseALabel: model.caseAName || 'Option A',
                        caseBLabel: model.caseBName || 'Option B'
                    };
                    let issues = comparisonLengthIssues(model);
                    if (issues.length) {
                        console.log(`[aiblogsQueue:${job.id}] COMPARISON length/structure issues:`, issues);

                        const order = [
                            'quickAnswer', 'summaryBullets', 'fastFacts', 'introHtml',
                            'quickVerdictRows', 'quickVerdictNote',
                            'caseAHtml', 'caseBHtml',
                            'headToHeadSections',
                            'chooseA', 'chooseB', 'hybridHtml',
                            'verdictHtml'
                        ];

                        for (const key of order) {
                            const needs = issues.some(i => i.startsWith(key) || i.includes(`${key} <`) || i.includes(`${key} missing`));
                            if (!needs) continue;

                            const prompt = buildComparisonSectionPrompt(key, title, labels);
                            const fix = await fetchJSONFromOpenAI(prompt, 'COMPARISON_SECTION_FIX', {
                                userId, projectId, pageId,
                                promptFrom: 'aiblogsQueue',
                                promptFor: `${projectName}::${title}::${key}`,
                                disableMemory: true, noFewShot: true, newThread: true
                            });

                            // assign back
                            // assign back (map fixer keys -> renderer keys)
                            if (key === 'summaryBullets' && Array.isArray(fix?.bullets)) {
                                model.summaryBullets = fix.bullets;
                            } else if (key === 'fastFacts' && Array.isArray(fix?.bullets)) {
                                model.fastFacts = fix.bullets;
                            } else if (key === 'quickVerdictRows' && Array.isArray(fix?.rows)) {
                                model.comparisonTable = fix.rows; // <- renderer expects comparisonTable
                            } else if (key === 'headToHeadSections' && Array.isArray(fix?.sections)) {
                                model.headToHeadHtml = buildHeadToHeadHtml(fix.sections); // <- renderer expects HTML
                            } else if (key === 'chooseA' && Array.isArray(fix?.bullets)) {
                                model.chooseAList = fix.bullets; // <- renderer expects chooseAList
                            } else if (key === 'chooseB' && Array.isArray(fix?.bullets)) {
                                model.chooseBList = fix.bullets; // <- renderer expects chooseBList
                            } else if (typeof fix?.out === 'string') {
                                model[key] = fix.out.trim();
                            }
                        }

                        // Re-check after fixes (log remaining)
                        issues = comparisonLengthIssues(model);
                        if (issues.length) console.warn(`[aiblogsQueue:${job.id}] Remaining COMPARISON issues:`, issues);
                    }
                }


            }
        }



        // Validate OpenAI response
        const validateResponse = (model) => {
            const errors = [];
            if (styleText.toLowerCase() === 'best') {
                if (!Array.isArray(model.products) || model.products.length < 5) errors.push(`Expected 5–8 products, got ${model.products?.length || 0}`);
                if (!Array.isArray(model.faqs) || model.faqs.length < 3) errors.push(`Expected 3–5 FAQs, got ${model.faqs?.length || 0}`);
                if (!Array.isArray(model.fastFacts) || model.fastFacts.length < 3) errors.push(`Expected 3–5 fastFacts, got ${model.fastFacts?.length || 0}`);
                if (!Array.isArray(model.voicePrompts) || model.voicePrompts.length < 3) errors.push(`Expected 3–5 voicePrompts, got ${model.voicePrompts?.length || 0}`);
                if (!Array.isArray(model.criteria) || model.criteria.length < 5) errors.push(`Expected >=5 criteria, got ${model.criteria?.length || 0}`);
                if (!Array.isArray(model.typesList) || model.typesList.length < 3) errors.push(`Expected 3–5 typesList, got ${model.typesList?.length || 0}`);
                if (!Array.isArray(model.matchingList) || model.matchingList.length < 3) errors.push(`Expected 3–5 matchingList, got ${model.matchingList?.length || 0}`);
                if (!Array.isArray(model.proInstallList) || model.proInstallList.length < 3) errors.push(`Expected 3–5 proInstallList, got ${model.proInstallList?.length || 0}`);
            

                // NEW: direct answer requirement (>=30 words and must include the exact title phrase)
                const qa = String(model.quickAnswer || '').trim();
                const qaWords = qa.split(/\s+/).filter(Boolean).length;
                const titlePhrase = String(title || '').trim().toLowerCase();
                if (qaWords < 30) errors.push('best: quickAnswer too short (need ≥30 words)');
                if (titlePhrase && !qa.toLowerCase().includes(titlePhrase)) {
                    errors.push('best: quickAnswer must include the exact title phrase');
                }
                // NEW: intro/why word-count and FAQ answer lengths
                const bl = bestLengthIssues(model);
                for (const b of bl) errors.push(`best: ${b}`);
            }


            else if (styleText === 'comparison') {
                // deep structural checks (lengths, rows, bullets, etc.)
                const cl = comparisonLengthIssues(model);
                for (const c of cl) errors.push(`comparison: ${c}`);

                // keep a couple of simple existence checks too
                if (!Array.isArray(model.voicePrompts) || model.voicePrompts.length < 3) errors.push('comparison: voicePrompts < 3');
          }



            else if (styleText === 'how') {
                const errors = [];
                if (!Array.isArray(model.tocItems) || model.tocItems.length < 6) errors.push('how: tocItems missing/short');
                for (const k of ['introHtml', 'prepHtml', 'stepsHtml', 'mistakesHtml', 'faqHtml', 'proHelpHtml', 'conclusionHtml']) {
                    if (!model[k]) errors.push(`how: ${k} missing`);
                }
                // Strict check for whyHtml structure
                if (!model.whyHtml) {
                    errors.push('how: whyHtml missing');
                } else if (!model.whyHtml.includes('<ul class="bl-bullets">') || (model.whyHtml.match(/<li\b/gi) || []).length !== 4) {
                    errors.push('how: whyHtml invalid: must be <ul class="bl-bullets"> with exactly 4 <li> items');
                } else {
                    const liRegex = /<li><strong>[^:]+:<\/strong>\s+[^<]+<\/li>/g;
                    const matches = (model.whyHtml.match(liRegex) || []).length;
                    if (matches !== 4) {
                        errors.push('how: whyHtml invalid: each <li> must follow <strong>label:</strong> description pattern');
                    }
                }
                for (const k of ['toolsList', 'fastFacts', 'voicePrompts']) {
                    if (!Array.isArray(model[k]) || model[k].length < 3) errors.push(`how: ${k} < 3`);
                }
               
                for (const k of ['websiteJson', 'breadcrumbJson', 'schemaJson']) {
                    if (!model[k]) errors.push(`how: ${k} missing`);
                }
                // Include length issues from howLengthIssues
                const lengthIssues = howLengthIssues(model);
                for (const issue of lengthIssues) errors.push(`how: ${issue}`);
                return errors;
            }

            else if (styleText === 'what') {
                if (!Array.isArray(model.faqs) || model.faqs.length < 3) errors.push('what: faqs < 3');
                if (!Array.isArray(model.fastFacts) || model.fastFacts.length < 3) errors.push('what: fastFacts < 3');
                if (!Array.isArray(model.voicePrompts) || model.voicePrompts.length < 3) errors.push('what: voicePrompts < 3');
                for (const k of ['introHtml', 'basicsHtml', 'benefitsHtml', 'considerationsHtml', 'verdictText']) {
                    if (!model[k]) errors.push(`what: ${k} missing`);
                }
                for (const k of ['basicsTitle', 'benefitsTitle', 'considerationsTitle', 'verdictTitle']) {
                    if (!model[k]) errors.push(`what: ${k} missing`);
                }
                for (const k of ['websiteJson', 'breadcrumbJson', 'articleJson', 'faqJson']) {
                    if (!model[k]) errors.push(`what: ${k} missing`);
                }

                // Enforce longer DIRECT ANSWER for WHAT
                const qaLen = String(model.quickAnswer || '').trim().length;
                if (qaLen < 180 || qaLen > 350) {
                    errors.push(`what: quickAnswer length ${qaLen} (need 180–350 chars)`);
                }


                // Benefits must be 5–10 articles, each with correct H3 format
                const benefitArticles = (String(model.benefitsHtml || '').match(/<article\b/gi) || []).length;
                if (benefitArticles < 5 || benefitArticles > 10) {
                    errors.push(`what: benefitsHtml must contain 5–10 <article> blocks (got ${benefitArticles})`);
                }
                if (!/<h3[^>]*class=["']bl-h3["'][^>]*>Benefit\s+\d+\s+—\s+[^<]+<\/h3>/i.test(String(model.benefitsHtml || ''))) {
                    errors.push('what: each benefit needs <h3 class="bl-h3">Benefit X — Title</h3>');
                }


                // NEW: length/structure checks
                const wordCount = (html) => String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
                const countArticles = (html) => (String(html || '').match(/<article\b/gi) || []).length;

                const introCount = wordCount(model.introHtml);
                if (introCount < 150 || introCount > 220) {
                    errors.push(`what: introHtml length ${introCount} (need 150–220 words)`);
                }

                const basicsCount = wordCount(model.basicsHtml);
                if (basicsCount < 160 || basicsCount > 240) {
                    errors.push(`what: basicsHtml length ${basicsCount} (need 160–240 words)`);
                }

                if (countArticles(model.benefitsHtml) < 4) errors.push('what: benefitsHtml needs >=4 <article>');
                if (wordCount(model.benefitsHtml) < 400) errors.push('what: benefitsHtml too short');

                {
                    const considerationsHtml = String(model.considerationsHtml || '');
                    const considerationsTitle = String(model.considerationsTitle || '');
                    const articleBlocks = considerationsHtml.match(/<article\b[\s\S]*?<\/article>/gi) || [];
                    const sectionTitle = considerationsTitle.toLowerCase();

                    if (articleBlocks.length < 4) {
                        errors.push(`what: considerationsHtml must contain at least 4 <article> blocks (got ${articleBlocks.length})`);
                    }
                    if (articleBlocks.length > 10) {
                        errors.push(`what: considerationsHtml must not exceed 10 <article> blocks (got ${articleBlocks.length})`);
                    }
                    if (wordCount(considerationsHtml) < 350) {
                        errors.push(`what: considerationsHtml too short (${wordCount(considerationsHtml)} words, need >=350)`);
                    }

                    const seenTitles = new Set();

                    articleBlocks.forEach((block, idx) => {
                        // Require: <h3 class="bl-h3">Consideration X — Title</h3>
                        const h3Match = block.match(/<h3[^>]*class=["']bl-h3["'][^>]*>\s*([^<]+)\s*<\/h3>/i);
                        if (!h3Match) {
                            errors.push(`what: consideration[${idx}] missing <h3 class="bl-h3">`);
                        } else {
                            const headingText = h3Match[1].trim();
                            // Must look like: Consideration X — Something (accept - or —)
                            if (!/^Consideration\s+\d+\s+(—|-)\s+.+/.test(headingText)) {
                                errors.push(`what: consideration[${idx}] heading must match "Consideration X — Title" (or with hyphen)`);
                            }
                            // Must NOT be a question
                            if (/\?$/.test(headingText)) {
                                errors.push(`what: consideration[${idx}] heading must not be a question`);
                            }
                            // Must NOT contain the section title
                            if (sectionTitle && headingText.toLowerCase().includes(sectionTitle)) {
                                errors.push(`what: consideration[${idx}] heading repeats section title`);
                            }
                            // Titles must be unique
                            if (seenTitles.has(headingText.toLowerCase())) {
                                errors.push(`what: consideration[${idx}] heading is duplicated`);
                            }
                            seenTitles.add(headingText.toLowerCase());
                        }

                        // One paragraph of 70–100 words
                        const pMatch = block.match(/<p>([\s\S]*?)<\/p>/i);
                        const words = pMatch ? pMatch[1].replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0;
                        if (words < 60) errors.push(`what: consideration[${idx}] paragraph too short (${words}w, need 70–100)`);
                        if (words > 110) errors.push(`what: consideration[${idx}] paragraph too long (${words}w, need 70–100)`);
                    });

                    // Enforce a clean H2 for considerationsTitle
                    if (!/^Important Considerations/i.test(considerationsTitle)) {
                        errors.push('what: considerationsTitle must start with "Important Considerations"');
                    }
                }
                if (wordCount(model.verdictText) < 140) errors.push('what: verdictText too short');
                // Benefits: enforce 5–10 articles and 140–220w paragraphs with the correct H3 heading
                // Benefits: enforce 5–10 articles, correct headings, uniqueness, and 160–240 words per paragraph
                {
                    const benefitsHtml = String(model.benefitsHtml || '');
                    const articleBlocks = benefitsHtml.match(/<article\b[\s\S]*?<\/article>/gi) || [];
                    const sectionTitle = String(model.benefitsTitle || '');

                    if (articleBlocks.length < 5) {
                        errors.push('what: benefitsHtml must contain at least 5 <article> blocks');
                    }
                    if (articleBlocks.length > 10) {
                        errors.push('what: benefitsHtml must not exceed 10 <article> blocks');
                    }

                    const seenTitles = new Set();

                    articleBlocks.forEach((block, idx) => {
                        // Require: <h3 class="bl-h3">Benefit X — Title</h3>
                        const h3Match = block.match(/<h3[^>]*class=["']bl-h3["'][^>]*>\s*([^<]+)\s*<\/h3>/i);
                        if (!h3Match) {
                            errors.push(`what: benefit[${idx}] missing <h3 class="bl-h3">`);
                        } else {
                            const headingText = h3Match[1].trim();
                            // Must look like: Benefit X — Something (accept - or —)
                            if (!/^Benefit\s+\d+\s+(—|-)\s+.+/.test(headingText)) {
                                errors.push(`what: benefit[${idx}] heading must match "Benefit X — Title" (or with hyphen)`);
                            }

                            // Must NOT contain the section title or generic "Top" phrase
                            if (sectionTitle && headingText.toLowerCase().includes(sectionTitle.toLowerCase())) {
                                errors.push(`what: benefit[${idx}] heading repeats section title`);
                            }
                            if (/top\s+\d+\s+(reasons|benefits)/i.test(headingText)) {
                                errors.push(`what: benefit[${idx}] heading is generic; provide a specific benefit title`);
                            }

                            // Titles must be unique
                            if (seenTitles.has(headingText.toLowerCase())) {
                                errors.push(`what: benefit[${idx}] heading is duplicated`);
                            }
                            seenTitles.add(headingText.toLowerCase());
                        }

                        // One paragraph of 70–100 words
                        const pMatch = block.match(/<p>([\s\S]*?)<\/p>/i);
                        const words = pMatch ? pMatch[1].replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length : 0;
                        if (words < 60) errors.push(`what: benefit[${idx}] paragraph too short (${words}w, need 70–100)`);
                        if (words > 110) errors.push(`what: benefit[${idx}] paragraph too long (${words}w, need 70–100)`);
                    });

                    // Enforce a clean H2
                    if (!/^The Top \d+ Benefits of /i.test(sectionTitle || '')) {
                        errors.push('what: benefitsTitle must be "The Top N Benefits of {title}"');
                    }
                }



            }


            return errors;
        };

        // Retry missing sections
        const maxRetries = 2;

        let retries = 0;
        let validationErrors = validateResponse(model);
        while (validationErrors.length > 0 && retries < maxRetries) {
            await step(60, `Retrying missing sections (attempt ${retries + 1})`);
            console.log(`[aiblogsQueue:${job.id}] Validation errors: ${validationErrors.join('; ')}`);


            // --- HOW: patch short/missing sections again during retries ---
            if (styleText === 'how') {
                let issues = howLengthIssues(model);
                if (issues.length) {
                    console.log(`[aiblogsQueue:${job.id}] HOW length/structure issues (retry):`, issues);
                    const fixOrder = ['introHtml', 'whyHtml', 'prepHtml', 'stepsHtml', 'mistakesHtml', 'faqHtml', 'proHelpHtml', 'conclusionHtml'];
                    for (const key of fixOrder) {
                        if (!issues.some(i => i.startsWith(key))) continue;
                        let prompt;
                        if (key === 'whyHtml') {
                            prompt = `
Return ONLY a JSON object: {"out": "<ul class=\"bl-bullets\">...</ul>"} with EXACTLY 4 <li> items.
Title: "${title}"
Service/Niche: "${serviceType || title}"

Requirements:
- Output: {"out": "<ul class=\"bl-bullets\"> ... </ul>"}
- Exactly 4 <li> items; no text before or after the <ul>
- Each <li> follows: <li><strong>2–5 word label:</strong> 8–16 words of explanation tied to "${serviceType || title}".</li>
- Colon (:) MUST be inside <strong>…</strong>, followed by a space, then the description.
- Example: <li><strong>Save water &amp; money:</strong> A slow drip can waste dozens of gallons weekly.</li>
- No paragraphs, headings, or other tags outside the <ul>.
- Escape quotes in JSON properly.
                `.trim();
                        } else {
                            const ranges = {
                                introHtml: [140, 180], whyHtml: [140, 180], prepHtml: [140, 200],
                                proHelpHtml: [140, 180], conclusionHtml: [140, 180]
                            };
                            const [min, max] = ranges[key] || [140, 180];
                            prompt = buildHowSectionPrompt(key, title, serviceType, min, max);
                        }
                        const fix = await fetchJSONFromOpenAI(prompt, 'HOW_SECTION_FIX', {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::${key}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });
                        if (fix && typeof fix.out === 'string' && fix.out.trim() && fix.out.includes('<ul class="bl-bullets">') && key === 'whyHtml') {
                            model[key] = fix.out.trim();
                        } else if (fix && typeof fix.out === 'string' && fix.out.trim()) {
                            model[key] = fix.out.trim();
                        }
                    }
                }
            }

            // --- BEST: patch again during retries ---
            if (styleText === 'best') {
                let issues = bestLengthIssues(model);
                if (issues.length) {
                    console.log(`[aiblogsQueue:${job.id}] BEST length/structure issues (retry):`, issues);

                    const fixOrder = ['introContent', 'whyTrust', 'criteria', 'faqs'];
                    for (const key of fixOrder) {
                        const needs = issues.some(i => i.startsWith(key) || i.includes(`${key} <`));
                        if (!needs) continue;

                        const prompt = buildBestSectionPrompt(key, title, serviceType);
                        const fix = await fetchJSONFromOpenAI(prompt, 'BEST_SECTION_FIX', {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::${key}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });

                        if (key === 'criteria' && Array.isArray(fix?.criteria) && fix.criteria.length) {
                            model.criteria = fix.criteria;
                        } else if (key === 'faqs' && Array.isArray(fix?.faqs) && fix.faqs.length) {
                            model.faqs = fix.faqs;
                        } else if (typeof fix?.out === 'string' && fix.out.trim()) {
                            model[key] = fix.out.trim();
                        }
                    }
                }


                // NEW: fix quickAnswer only if validator flagged it
                const needsQuickAnswerFix = validationErrors.some(e =>
                    e.includes('best: quickAnswer too short') || e.includes('best: quickAnswer must include the exact title phrase')
                );

                if (needsQuickAnswerFix) {
                    const qaPrompt = `
                    Return ONLY valid JSON: {"quickAnswer": string}

                    Rules:
                    - 30–60 words.
                    - Directly, explicitly answer the exact title: "${title}" (include this exact phrase in the answer).
                    - One concise paragraph; neutral, practical.
                    - No lists, no HTML, no hype.
                    - Keep it relevant to "${serviceType || "(not set)"}".
                    `.trim();

                    const qaFix = await fetchJSONFromOpenAI(qaPrompt, 'BEST_QUICKANSWER_FIX', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::best::quickAnswer`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });

                    if (qaFix && typeof qaFix.quickAnswer === 'string' && qaFix.quickAnswer.trim()) {
                        model.quickAnswer = qaFix.quickAnswer.trim();
                    }
                }
            }



            if (styleText === 'comparison') {
                const labels = {
                    caseALabel: model.caseAName || 'Option A',
                    caseBLabel: model.caseBName || 'Option B'
                };

                let issues = comparisonLengthIssues(model);
                if (issues.length) {
                    console.log(`[aiblogsQueue:${job.id}] COMPARISON issues (retry):`, issues);
                    const order = [
                        'quickAnswer', 'summaryBullets', 'fastFacts', 'introHtml',
                        'quickVerdictRows', 'quickVerdictNote',
                        'caseAHtml', 'caseBHtml',
                        'headToHeadSections',
                        'chooseA', 'chooseB', 'hybridHtml',
                        'verdictHtml'
                    ];
                    for (const key of order) {
                        const needs = issues.some(i => i.startsWith(key) || i.includes(`${key} <`) || i.includes(`${key} missing`));
                        if (!needs) continue;

                        const prompt = buildComparisonSectionPrompt(key, title, labels);
                        const fix = await fetchJSONFromOpenAI(prompt, 'COMPARISON_SECTION_FIX', {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::${key}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });

                        if (key === 'summaryBullets' && Array.isArray(fix?.bullets)) model.summaryBullets = fix.bullets;
                        else if (key === 'fastFacts' && Array.isArray(fix?.bullets)) model.fastFacts = fix.bullets;
                        else if (key === 'quickVerdictRows' && Array.isArray(fix?.rows)) model.comparisonTable = fix.rows;
                        else if (key === 'headToHeadSections' && Array.isArray(fix?.sections)) model.headToHeadSections = fix.sections;
                        else if (key === 'chooseA' && Array.isArray(fix?.bullets)) model.chooseA = fix.bullets;
                        else if (key === 'chooseB' && Array.isArray(fix?.bullets)) model.chooseB = fix.bullets;
                        else if (typeof fix?.out === 'string') model[key] = fix.out.trim();
                    }
                }
            }

            if (styleText === 'what') {
                const hasBenefitsError = validationErrors.some(e =>
                    /what:\s*(benefit|benefitsHtml|benefitsTitle)/i.test(e)
                );
                const hasConsiderationsError = validationErrors.some(e =>
                    /what:\s*(consideration|considerationsHtml|considerationsTitle)/i.test(e)
                );

                if (hasBenefitsError) {
                    // Keep total count stable and a bit higher by default (6–8)
                    const desiredMin = 6;
                    const fixPrompt = buildWhatBenefitsFixPrompt(projectName, serviceType, title, desiredMin);

                    const fix = await fetchJSONFromOpenAI(fixPrompt, 'WHAT_BENEFITS_FIX', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::benefitsFix`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });

                    if (fix?.benefitsHtml) {
                        model.benefitsHtml = String(fix.benefitsHtml).trim();
                    }
                    if (fix?.benefitsTitle) {
                        model.benefitsTitle = String(fix.benefitsTitle).trim();
                    }
                }

                if (hasConsiderationsError) {
                    // Keep total count stable (4–5)
                    const desiredMin = 4;
                    const fixPrompt = buildWhatConsiderationsFixPrompt(projectName, serviceType, title, desiredMin);

                    const fix = await fetchJSONFromOpenAI(fixPrompt, 'WHAT_CONSIDERATIONS_FIX', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::considerationsFix`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });

                    if (fix?.considerationsHtml) {
                        model.considerationsHtml = String(fix.considerationsHtml).trim();
                    }
                    if (fix?.considerationsTitle) {
                        model.considerationsTitle = String(fix.considerationsTitle).trim();
                    }
                }
            }







            // Retry products if insufficient
            if (validationErrors.some(e => e.includes('products'))) {
                const neededProducts = 5 - (model.products?.length || 0);
                if (neededProducts > 0) {
                    const productsPrompt = buildProductsPrompt(projectName, serviceType, topServicesList, imagesList, model.products || []);
                    const additionalProductsResponse = await fetchJSONFromOpenAI(productsPrompt, 'CREATE_AI_BLOG_PRODUCTS', {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::products`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true
                    });
                    console.log(`[aiblogsQueue:${job.id}] Additional Products Response:`, JSON.stringify(additionalProductsResponse, null, 2));
                    if (additionalProductsResponse?.products?.length) {
                        model.products = [...(model.products || []), ...additionalProductsResponse.products.slice(0, neededProducts)];
                        model.comparisonTable = [...(model.comparisonTable || []), ...(additionalProductsResponse.comparisonTable || [])];
                    }
                }
            }

            // Retry typesList if missing
            if (validationErrors.some(e => e.includes('typesList'))) {
                const typesPrompt = buildTypesListPrompt(projectName, serviceType);
                const typesResponse = await fetchJSONFromOpenAI(typesPrompt, 'CREATE_AI_BLOG_TYPES', {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::typesList`,
                    disableMemory: true,
                    noFewShot: true,
                    newThread: true
                });
                console.log(`[aiblogsQueue:${job.id}] TypesList Response:`, JSON.stringify(typesResponse, null, 2));
                if (typesResponse?.typesList?.length) {
                    model.typesList = typesResponse.typesList;
                }
            }

            // Retry matchingList if missing
            if (validationErrors.some(e => e.includes('matchingList'))) {
                const matchingPrompt = buildMatchingListPrompt(projectName, serviceType);
                const matchingResponse = await fetchJSONFromOpenAI(matchingPrompt, 'CREATE_AI_BLOG_MATCHING', {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::matchingList`,
                    disableMemory: true,
                    noFewShot: true,
                    newThread: true
                });
                console.log(`[aiblogsQueue:${job.id}] MatchingList Response:`, JSON.stringify(matchingResponse, null, 2));
                if (matchingResponse?.matchingList?.length) {
                    model.matchingList = matchingResponse.matchingList;
                }
            }

            // Retry proInstallList if missing
            if (validationErrors.some(e => e.includes('proInstallList'))) {
                const proInstallPrompt = buildProInstallListPrompt(projectName, serviceType);
                const proInstallResponse = await fetchJSONFromOpenAI(proInstallPrompt, 'CREATE_AI_BLOG_PROINSTALL', {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::proInstallList`,
                    disableMemory: true,
                    noFewShot: true,
                    newThread: true
                });
                console.log(`[aiblogsQueue:${job.id}] ProInstallList Response:`, JSON.stringify(proInstallResponse, null, 2));
                if (proInstallResponse?.proInstallList?.length) {
                    model.proInstallList = proInstallResponse.proInstallList;
                }
            }

            // WHAT: regenerate longer quickAnswer if needed
            if (styleText === 'what' && validationErrors.some(e => e.includes('what: quickAnswer length'))) {
                const qaPrompt = buildWhatQuickAnswerPrompt(title, serviceType);
                const qaFix = await fetchJSONFromOpenAI(qaPrompt, 'WHAT_QUICKANSWER_FIX', {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::quickAnswer`,
                    disableMemory: true, noFewShot: true, newThread: true
                });
                if (qaFix && typeof qaFix.quickAnswer === 'string') {
                    model.quickAnswer = qaFix.quickAnswer.trim();
                }
            }

            // WHAT: regenerate longer introHtml if needed
            if (styleText === 'what' && validationErrors.some(e => e.includes('introHtml length'))) {
                const introPrompt = `
Return ONLY valid JSON: {"introHtml": string}

Rules for introHtml:
- HTML fragment with <p>…</p> paragraphs.
- 150–220 words.
- Start with a clear hook for "${title}".
- Expand with 3–4 distinct ideas about "${serviceType}".
- Be engaging, specific, and practical.
`.trim();

                const introFix = await fetchJSONFromOpenAI(introPrompt, 'WHAT_INTRO_FIX', {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::introHtml`,
                    disableMemory: true, noFewShot: true, newThread: true
                });

                if (introFix && typeof introFix.introHtml === 'string') {
                    model.introHtml = introFix.introHtml.trim();
                }
            }


            // WHAT: regenerate longer basicsHtml if needed
            // WHAT: regenerate longer basicsHtml if needed
            if (styleText === 'what' && validationErrors.some(e => e.includes('basicsHtml'))) {
                const basicsPrompt = `
Return ONLY valid JSON: {"basicsHtml": string}

Rules for basicsHtml:
- HTML fragment with <p>…</p> paragraphs (no lists/tables/headings).
- 160–240 words.
- Define "${title}" clearly in the first 1–2 sentences.
- Keep the explanation directly tied to "${title}", not just "${serviceType}".
- Expand with 2–3 practical examples or scenarios where "${title}" is important.
- Be specific, self-contained, and relevant to the blog topic.
`.trim();

                const basicsFix = await fetchJSONFromOpenAI(basicsPrompt, 'WHAT_BASICS_FIX', {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::basicsHtml`,
                    disableMemory: true, noFewShot: true, newThread: true
                });

                if (basicsFix && typeof basicsFix.basicsHtml === 'string') {
                    model.basicsHtml = basicsFix.basicsHtml.trim();
                }
            }




            retries++;
            validationErrors = validateResponse(model);
        }

        // === HARD REQUIREMENT: Quick Verdict (comparisonTable) must exist with 5–6 rows ===
        if (styleText === 'comparison') {
            const ensureQuickVerdict = async () => {
                if (!Array.isArray(model.comparisonTable) || model.comparisonTable.length < 5) {
                    console.log(`[aiblogsQueue:${job.id}] comparisonTable missing/short — regenerating via OpenAI`);


                    const caseALabel = clean(model.caseAName || 'Option A');
                    const caseBLabel = clean(model.caseBName || 'Option B');

                    const tablePrompt = `
                    Return ONLY valid JSON:
                    {"rows":[{"factor":string,"a":string,"b":string}, {"factor":string,"a":string,"b":string}, {"factor":string,"a":string,"b":string}]}

                    Task: Create the "At a Glance — Quick Verdict" table for "${title}".
                    Labels: A = "${caseALabel}", B = "${caseBLabel}"

                    Strict requirements:
                    - 5–6 rows (MANDATORY).
                    - Each "factor" is a short category (e.g., "Ease of Use", "Latency", "Costs", "Structured Output", "Ecosystem", "Security/Compliance").
                    - Cells "a" and "b" are concise verdict snippets (<= 10 words each).
                    - No markdown, no HTML, JSON only.
                        `.trim();

                    // up to 2 attempts
                    for (let i = 0; i < 2; i++) {
                        const tableFix = await fetchJSONFromOpenAI(tablePrompt, 'COMPARISON_TABLE_FORCE', {
                            userId,
                            projectId,
                            pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::comparisonTable`,
                            disableMemory: true,
                            noFewShot: true,
                            newThread: true
                        });

                        if (Array.isArray(tableFix?.rows) && tableFix.rows.length >= 5) {
                            model.comparisonTable = tableFix.rows.slice(0, 6); // cap to 6
                            break;
                        }
                    }
                }
            };

            await ensureQuickVerdict();
        }


        if (validationErrors.length > 0) {
            console.warn(`[aiblogsQueue:${job.id}] Validation errors after retries: ${validationErrors.join('; ')}`);
            // Apply defaults for remaining missing sections
            if (!model.typesList || model.typesList.length < 3) {
                model.typesList = [
                    `Standard ${serviceType}: Reliable for typical use cases with dependable performance.`,
                    `Premium ${serviceType}: Enhanced features for advanced needs and superior results.`,
                    `Budget ${serviceType}: Cost-effective solution for basic requirements.`
                ];
            }
            if (!model.matchingList || model.matchingList.length < 3) {
                model.matchingList = [
                    "Compatibility with user needs for optimal performance.",
                    "Performance in specific conditions to ensure reliability.",
                    "Ease of use or installation to save time.",
                    "Cost-effectiveness to meet budget constraints."
                ];
            }
            if (!model.proInstallList || model.proInstallList.length < 3) {
                model.proInstallList = [
                    "Ensures optimal setup and performance.",
                    "Includes expert assessment for reliability.",
                    "Uses high-quality materials for durability.",
                    "Reduces long-term maintenance costs."
                ];
            }
            if (!model.voicePrompts || model.voicePrompts.length < 3) {
                model.voicePrompts = [
                    `Discover top ${serviceType} services.`,
                    `Learn about ${serviceType} solutions.`,
                    `Find the best ${serviceType} for your needs.`
                ];
            }
        }
     

        // Process OpenAI response
        await step(65, 'Processing OpenAI response');
        let content_html;
        if (styleText.toLowerCase() === 'best') {
            // Replace placeholders in 'best' template
            let {
                title: aiTitle, metaDescription, canonicalUrl, ogTitle, ogDescription, ogUrl, ogImage, siteName,
                twitterTitle, twitterDescription, twitterImage, siteUrl, logoUrl, youtubeUrl, linkedinUrl,
                twitterUrl, searchUrl, guidesUrl, breadcrumbTitle, articleHeadline, articleDescription,
                articleImage, authorName: aiAuthorName, authorJobTitle, datePublished, dateModified, eyebrow, mainTitle, year, dateUpdated, readTime, wordCount,
                quickAnswer, heroImage, heroImageAlt, heroImageSrcset, heroCaption, disclosure, fastFacts, voicePrompts,
                tocItems, introContent, whyTrust, criteria, products, comparisonTable,
                typesIntro, typesList, matchingIntro, matchingList, proInstallIntro, proInstallList,
                faqs, references, authorImage, authorBio, authorXUrl, authorLinkedInUrl, authorPageUrl,
                 verdict, usedLinks, usedImages
            } = model;

            // Generate dynamic sections
            const itemsList = products.map((p, i) => `{"@type":"ListItem","position":${i + 1},"url":"${canonicalUrl}#product-${p.id}","name":"${p.name}"}`).join(',');
            const productsHtml = products.map(p => `
                <article id="product-${p.id}" class="bl-product">
                    <header class="bl-product-head"><h3 class="bl-h3">${p.name} (${p.badge})</h3></header>
                    <div class="bl-product-grid">
                        <div class="bl-product-media">
                            <img src="${p.image}" alt="${p.imageAlt}" width="1120" height="700" loading="lazy" style="max-width:800px;width:100%;height:auto;aspect-ratio:1.600" decoding="async">
                        </div>
                        <div class="bl-product-body">
                            <h4 class="bl-h4">About the Product/Service</h4>
                            <p>${p.description}</p>
                            <h4 class="bl-h4">Pros</h4>
                            <ul class="bl-bullets">${p.pros.map(pro => `<li>${pro}</li>`).join('')}</ul>
                            <h4 class="bl-h4">Cons</h4>
                            <ul class="bl-bullets">${p.cons.map(con => `<li>${con}</li>`).join('')}</ul>
                            <h4 class="bl-h4">Best For</h4>
                            <p>${p.bestFor}</p>
                            <h4 class="bl-h4">Our Expert Take</h4>
                            <p>${p.expertTake}</p>
                        </div>
                    </div>
                </article>
            `).join('');
            const comparisonTableHtml = comparisonTable.map(row => `
                <tr><td>${row.item}</td><td>${row.mainUse}</td><td>${row.typicalPrice}</td><td>${row.skillLevel}</td><td>${row.bestFor}</td></tr>
            `).join('');
            const faqList = faqs.map(faq => `{"@type":"Question","name":"${faq.question}","acceptedAnswer":{"@type":"Answer","text":"${faq.answer}"}}`).join(',');
            const faqHtml = faqs.map(faq => `
            <details>
                <summary><h3 class="bl-h3">${faq.question}</h3></summary>
                <div><p>
                ${faq.answer}
                </p></div>
            </details>
            `).join('');

            const fastFactsHtml = fastFacts.map(fact => `<li>${fact}</li>`).join('');
            const voicePromptsHtml = voicePrompts.map(prompt => `<li>${prompt}</li>`).join('');
            // Build a rich ToC from actual sections + products
            function esc(s) { return String(s || '').replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])); }
            const tocProductsInner = (products || []).map((p, idx) =>
                `<li><a href="#product-${esc(p.id)}">Product ${idx + 1} — ${esc(p.name)}</a></li>`
            ).join('');

            const tocItemsHtml = `
            <li><a href="#learn">What You Will Learn / Introduction</a></li>
            <li><a href="#criteria">Our Ranking Criteria: How We Evaluated the Best</a></li>
            <li><a href="#top-products">The Top ${products?.length || ''} Product/Service Picks</a>
                ${tocProductsInner ? `<ol>${tocProductsInner}</ol>` : ''}
            </li>
            <li><a href="#comparison">At a Glance: Product/Service Comparison Table</a></li>
            <li><a href="#buyers-guide">Buyer’s Guide</a>
                <ol>
                <li><a href="#types">Understanding the Types according to Product/Service topic</a></li>
                <li><a href="#matching">Matching the Product/Service to Your Topic</a></li>
                <li><a href="#pro-install">The Importance of Professional Installation</a></li>
                </ol>
            </li>
            <li><a href="#faq">Frequently Asked Questions (FAQ)</a></li>
            <li><a href="#author">About the Author</a></li>
            <li><a href="#comments">Comments & Reviews</a></li>
            <li><a href="#related">Related Articles</a></li>
            <li><a href="#verdict">The Verdict: Our Top Recommendation & Your Next Step</a></li>
            `.trim();

            const criteriaHtml = criteria.map(c => `<li>${c}</li>`).join('');
            const typesListHtml = typesList.map(t => `<li>${t}</li>`).join('');
            const matchingListHtml = matchingList.map(m => `<li>${m}</li>`).join('');
            const proInstallListHtml = proInstallList.map(p => `<li>${p}</li>`).join('');
            // Clean, dedupe, https-only references; label by hostname
            const bannedHosts = new Set(['example.com', 'www.example.com', 'test.com', 'www.test.com', 'sample.com', 'www.sample.com', 'localhost']);
            const cleanedRefs = (Array.isArray(references) ? references : [])
                .map(u => String(u || '').trim())
                .filter(Boolean)
                .map(u => {
                    try {
                        const url = new URL(u);
                        if (url.protocol !== 'https:') return '';               // enforce https
                        if (bannedHosts.has(url.hostname.toLowerCase())) return ''; // block placeholders
                        // strip tracking params
                        ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid', 'igshid'].forEach(p => url.searchParams.delete(p));
                        url.hash = '';
                        return url.toString();
                    } catch { return ''; }
                })
                .filter(Boolean)
                .filter((u, i, a) => a.indexOf(u) === i); // dedupe

            const referencesHtml = cleanedRefs
                .map(u => `<li><a class="bl-external" target="_blank" rel="noopener" href="${u}">${hostnameLabel(u)}</a></li>`)
                .join('');

            // If no valid references survived, append notice to whyTrust
            const whyTrustFinal = String(whyTrust || '').trim() + (cleanedRefs.length === 0
                ? (String(whyTrust || '').trim() ? ' ' : '') + 'Live-source citations are pending editorial review.'
                : '');


            const relatedArticlesHtml = internalLinks.map(article => `
                <article class="bl-related-item">
                    <a class="bl-related-media" href="${article.url}">
                        <img src="${article.image}" alt="${article.imageAlt}" width="1200" height="800" style="max-width:800px;width:100%;height:auto;aspect-ratio:1.500" loading="lazy" decoding="async">
                    </a>
                    <h3 class="bl-h3"><a href="${article.url}">${article.title}</a></h3>
                    <p class="bl-related-snippet">${article.snippet}</p>
                </article>
            `).join('');

            // Define defaults for placeholders
            const currentYear = new Date().getFullYear();
            const defaults = {
                siteName: projectName,
                siteUrl: domain,
                logoUrl: `${domain}/logo.png`,
                authorName: authorName || 'John Doe',
                authorJobTitle: `${serviceType} Expert`,
                category: serviceType || 'Services',
                heroImage: coverUrl || imagePool[0] || 'https://apis.smartlybuild.dev/images/blogs/1756875396079_1756875396078_2.webp',
                heroImageSrcset: `${coverUrl || imagePool[0]}?q=80&w=800 800w, ${coverUrl || imagePool[0]}?q=80&w=1200 1200w, ${coverUrl || imagePool[0]}?q=80&w=1600 1600w`,
                heroImageAlt: bestAlt(coverUrl, projectName, serviceType),
                heroCaption: bestAlt(coverUrl, projectName, serviceType),
                references: [

                ]
            };


            if (!Array.isArray(faqs) || faqs.length < 3) {
                faqs = [
                    { question: `What’s the fastest improvement in ${serviceType}?`, answer: `Start with a quick checkup and minor adjustments ...` },
                    { question: `How often should I service ${serviceType}?`, answer: `For typical use, plan maintenance at least ...` },
                    { question: `When should I hire a pro for ${serviceType}?`, answer: `Call a professional when you notice ...` }
                ];
            }
            if (!Array.isArray(criteria) || criteria.length < 5) {
                criteria = [
                    'Effectiveness and real-world performance',
                    'Value for money at typical prices',
                    'Durability and build quality',
                    'Ease of use or installation',
                    'Local availability and support'
                ];
            }

             if (quickAnswer === '' || quickAnswer.trim().split(/\s+/).length < 15) {
                console.log("m.quickAnswer is empty, generating via OpenAI...");

                let prompt = `You are an expert content writer. Write a concise, informative answer (80-100 words) for the question below. Use a neutral and helpful tone.
                Question: ${title} `

                quickAnswer = await fetchStringFromOpenAI(prompt, label = "HowBlogQuickanswerPrompt", {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: "BlogsQueue",
                    promptFor: "HowquickAnswer"
                });

                console.log(quickAnswer, "hi bro quickanswer")

            }

            const map = {
                title: clean(title),
                metaDescription: clean(metaDescription || `${projectName} ${serviceType}`),
                canonicalUrl: clean(canonicalUrl || `${domain}/services/${normDash(serviceType)}`),
                ogTitle: clean(ogTitle || title),
                ogDescription: clean(ogDescription || metaDescription || defaults.category),
                ogUrl: clean(ogUrl || canonicalUrl || `${domain}/services/${normDash(serviceType)}`),
                ogImage: clean(ogImage || coverUrl || defaults.heroImage),
                siteName: clean(siteName || defaults.siteName),
                twitterTitle: clean(twitterTitle || title),
                twitterDescription: clean(twitterDescription || metaDescription || defaults.category),
                twitterImage: clean(twitterImage || coverUrl || defaults.heroImage),
                siteUrl: clean(siteUrl || defaults.siteUrl),
                logoUrl: clean(logoUrl || defaults.logoUrl),
                youtubeUrl: clean(youtubeUrl || `${domain}/youtube`),
                linkedinUrl: clean(linkedinUrl || `${domain}/linkedin`),
                twitterUrl: clean(twitterUrl || `${domain}/twitter`),
                searchUrl: clean(searchUrl || `${domain}/search`),
                guidesUrl: clean(guidesUrl || `${domain}/guides`),
                breadcrumbTitle: clean(breadcrumbTitle || title),
                articleHeadline: clean(articleHeadline || title),
                articleDescription: clean(articleDescription || metaDescription || defaults.category),
                articleImage: clean(articleImage || coverUrl || defaults.heroImage),

                datePublished: clean(datePublished || new Date().toISOString().split('T')[0]),
                dateModified: clean(dateModified || new Date().toISOString().split('T')[0]),
                eyebrow: clean(eyebrow || defaults.category),
                mainTitle: clean(title),
                year: clean(year || '2025'),
                dateUpdated: clean(dateUpdated || new Date().toISOString().split('T')[0]),
                readTime: clean(readTime || '10 minutes'),
                wordCount: clean(wordCount || '1500 words'),
                quickAnswer: clean(quickAnswer || metaDescription || defaults.category),
                heroImage: clean(heroImage || defaults.heroImage),
                heroImageAlt: clean(heroImageAlt || defaults.heroImageAlt),
                heroImageSrcset: clean(heroImageSrcset || defaults.heroImageSrcset),
                heroCaption: clean(heroCaption || defaults.heroCaption),
                disclosure: clean(disclosure || 'This post contains affiliate links.'),
                fastFacts: fastFactsHtml || `<li>High-quality ${serviceType} services</li><li>Experienced professionals</li><li>Effective solutions</li>`,
                voicePrompts: voicePromptsHtml || `<li>Discover top ${serviceType} services.</li><li>Learn about ${serviceType} solutions.</li><li>Find the best ${serviceType} for your needs.</li>`,
                tocItems: tocItemsHtml || '<li>Introduction</li><li>Top Picks</li><li>Buyer’s Guide</li>',
                introContent: clean(introContent || `Explore the best ${serviceType} services for your needs.`),
                whyTrust: clean(whyTrustFinal || `Our recommendations are based on extensive research and industry expertise.`),

                criteria: criteriaHtml || `<li>Effectiveness</li><li>Cost</li><li>Durability</li>`,
                numItems: String(products.length),
                category: clean(serviceType || defaults.category),
                itemsList: itemsList,
                productsHtml: productsHtml,
                comparisonTable: comparisonTableHtml,
                typesIntro: clean(typesIntro || `Learn about different types of ${serviceType} services.`),
                typesList: typesListHtml || `<li>Standard ${serviceType}</li><li>Premium ${serviceType}</li><li>Budget ${serviceType}</li>`,
                matchingIntro: clean(matchingIntro || `Choose the right ${serviceType} service for your needs.`),
                matchingList: matchingListHtml || `<li>Compatibility</li><li>Performance</li><li>Budget</li>`,
                proInstallIntro: clean(proInstallIntro || `Professional installation ensures optimal performance.`),
                proInstallList: proInstallListHtml || `<li>Secure setup</li><li>Expert assessment</li><li>Long-term reliability</li>`,
                faqList: faqList,
                faqHtml: faqHtml,
                references: referencesHtml,
                relatedArticlesHtml: relatedArticlesHtml,
                verdict: clean(verdict || `Choose ${projectName} for top-quality ${serviceType} services.`),


                authorName: clean(WriterName),
                authorJobTitle: clean(WriterJobTitle),
                authorImage: clean(WriterImage),
                authorBio: clean(WriterBio || `${WriterName} writes about ${serviceType}.`),
                authorXUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinkedInUrl: clean(`https://linkedin.com/in/${normDash(WriterName)}`),
                authorPageUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinksHtml,
                authorSameAs,



            };

            content_html = fillAllPlaceholders(template, map);
        }

        else if (styleText === 'comparison') {
            let m = model;
            const { cleanedRefs: compRefs, referencesHtml: referencesHtmlComp } = cleanReferences(m.references);

            // ===== tiny utils (scoped to this branch) =====
            const cleanList = (arr) => (arr || []).map(x => clean(x));
            const ul = arr => `<ul class="bl-bullets">${cleanList(arr).map(x => `<li>${x}</li>`).join('')}</ul>`;
            const replaceOptionAB = (s, a, b) => {
                if (!s) return s;
                let out = String(s);
                if (a) out = out.replace(/\bOption\s*A\b/gi, a);
                if (b) out = out.replace(/\bOption\s*B\b/gi, b);
                return out;
            };
            const inferLabelsFromTitleLocal = (t) => {
                const txt = String(t || '').replace(/\s+/g, ' ').trim();

                let m = txt.match(/(.+?)\s+vs\.?\s+(.+?)(?:\s+—|\s*:-|\s*–|\s*—|$)/i);
                if (m) return { a: m[1].trim(), b: m[2].trim() };

                m = txt.match(/(.+?):\s*(.+)/);
                if (m) {
                    const right = m[2];
                    const or = right.match(/(.+?)\s+(?:vs\.?|or|and)\s+(.+)/i);
                    if (or) return { a: or[1].trim(), b: or[2].trim() };
                }
                return { a: (model.caseAName || 'Option A'), b: (model.caseBName || 'Option B') };
            };

            // ===== TOC & Related =====
            // TOC - Ensure tocItems exists with default structure
            if (!Array.isArray(m.tocItems) || m.tocItems.length === 0) {
                m.tocItems = [
                    { href: "#intro", label: "Introduction" },
                    { href: "#quick-verdict", label: "Quick Verdict" },
                    { href: "#case-a", label: m.caseAName || "Option A" },
                    { href: "#case-b", label: m.caseBName || "Option B" },
                    { href: "#head-to-head", label: "Head-to-Head Comparison" },
                    { href: "#recommendation", label: "Our Recommendation" },
                    { href: "#verdict", label: "Final Verdict" }
                ];
            }

            const tocInner = (m.tocItems || []).map(i =>
                `<li><a href="${clean(i.href)}">${clean(i.label)}</a></li>`
            ).join('');
            const tocHtml = `<ol class="bl-toc">${tocInner}</ol>`;

            const relatedArticlesHtml = (internalLinks || []).map(a => `
            <article class="bl-related-item">
            <a class="bl-related-media" href="${clean(a.url)}">
                <img src="${clean(a.image)}" alt="${clean(a.imageAlt)}" width="560" height="340" loading="lazy" decoding="async">
            </a>
            <h3 class="bl-h3"><a href="${clean(a.url)}">${clean(a.title)}</a></h3>
            <p class="bl-related-snippet">${clean(a.snippet)}</p>
            </article>
            `).join('');

            // ===== Ensure real labels (no "Option A/B") =====
            {
                const inferred = inferLabelsFromTitleLocal(title);
                if (!m.caseAName || /option\s*a/i.test(m.caseAName)) m.caseAName = inferred.a || m.caseAName || '';
                if (!m.caseBName || /option\s*b/i.test(m.caseBName)) m.caseBName = inferred.b || m.caseBName || '';
            }
            const caseALabel = clean(m.caseAName || 'Option A');
            const caseBLabel = clean(m.caseBName || 'Option B');



            {
                // Basic cleaners/validators
                const stripJunkWrappers = (s) => {
                    let out = String(s || '').trim();

                    out = out.replace(/^<html[^>]*>/i, '')
                        .replace(/<\/html>$/i, '')
                        .replace(/^<body[^>]*>/i, '')
                        .replace(/<\/body>$/i, '')
                        .replace(/^```(?:html|markup)?/i, '')
                        .replace(/```$/i, '')
                        .trim();
                    return out;
                };
                const extractCards = (s) =>
                    (String(s || '').match(/<article[^>]*class=["'][^"']*\bbl-card\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || []);
                const h3IsNumbered = (h) => /^\s*\d+\)\s+/i.test(h || '');
                const hasOptionAB = (s) => /\bOption\s*A\b|\bOption\s*B\b/i.test(String(s || ''));

                const headToHeadValid = (s) => {
                    s = stripJunkWrappers(s);
                    const cards = extractCards(s);
                    if (cards.length < 5 || cards.length > 6) return false;
                    // All cards must have a numbered H3 + a <p> paragraph
                    for (const card of cards) {
                        const h3m = card.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
                        const pm = card.match(/<p[^>]*>[\s\S]*?<\/p>/i);
                        if (!h3m || !pm) return false;
                        if (!h3IsNumbered(h3m[1])) return false;
                        if (/8–16|8-16|TBD|INSERT|{{|}}/i.test(card)) return false; // no placeholders
                    }
                    return true;
                };

                const cleanAB = (s) => replaceOptionAB(stripJunkWrappers(String(s || '')), caseALabel, caseBLabel);

                // Strong prompts
                const buildHeadToHeadFixPrompt = (projectName, serviceType, pageTitle, A, B) => `
                You are fixing the **Head-to-Head** section for a comparison article.

                Context:
                - Project: ${projectName}
                - Service/Category: ${serviceType}
                - Page title: ${pageTitle}
                - Left option: "${A}"
                - Right option: "${B}"

                RETURN ONLY RAW HTML (no markdown fences, no <html> or <body> wrappers).

                STRICT REQUIREMENTS:
                - Output 5–6 <article class="bl-card"> blocks.
                - Each block:
                - <h3 class="bl-h3">N) Concise dimension name</h3>  (N = 1..6)
                - <p>80–160 words of neutral, practical comparison text about "${A}" vs "${B}" specific to "${pageTitle}".</p>
                - Do NOT use "Option A"/"Option B". Use "${A}" and "${B}" when comparing.
                - No placeholders like "8–16", "TBD", "{{...}}".
                `.trim();

                const buildHeadToHeadForcePrompt = (projectName, serviceType, pageTitle, A, B) => `
                    Generate a fresh **Head-to-Head** section.

                    Context:
                    - Project: ${projectName}
                    - Service/Category: ${serviceType}
                    - Page title: ${pageTitle}
                    - Options: "${A}" vs "${B}"

                    RETURN ONLY RAW HTML with 6 <article class="bl-card"> blocks, numbered 1) to 6), each with:
                    - <h3 class="bl-h3">N) Dimension</h3>
                    - <p>80–140 words of specific, neutral comparison text.</p>

                    No wrappers (<html>, <body>, code fences). No placeholders. Never say "Option A/B".
                    `.trim();

                const ensureHeadToHead = async () => {
                    let current = String(m.headToHeadHtml || '').trim();

                    // If already valid, just clean labels and keep
                    if (headToHeadValid(current)) {
                        m.headToHeadHtml = cleanAB(current);
                        return;
                    }

                    // Attempt 1–2: fix prompt
                    const prompt = buildHeadToHeadFixPrompt(projectName, serviceType, title, caseALabel, caseBLabel);
                    for (let i = 0; i < 2; i++) {
                        const fx = await fetchJSONFromOpenAI(prompt, i === 0 ? 'COMPARISON_HEAD2HEAD_FIX' : 'COMPARISON_HEAD2HEAD_FIX_RETRY', {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::headtohead${i ? '::retry' : ''}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });
                        const out = cleanAB(fx?.out || '');
                        if (headToHeadValid(out)) { m.headToHeadHtml = out; return; }
                    }

                    // Salvage any existing valid cards from current
                    const salvagedCards = extractCards(stripJunkWrappers(current)).slice(0, 6);
                    const salvagedHtml = salvagedCards.join('');
                    if (headToHeadValid(salvagedHtml)) { m.headToHeadHtml = cleanAB(salvagedHtml); return; }

                    // Force generate 1–2 times
                    const force = buildHeadToHeadForcePrompt(projectName, serviceType, title, caseALabel, caseBLabel);
                    for (let i = 0; i < 2; i++) {
                        const fx = await fetchJSONFromOpenAI(force, i === 0 ? 'COMPARISON_HEAD2HEAD_FORCE' : 'COMPARISON_HEAD2HEAD_FORCE_RETRY', {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::headtohead::force${i ? '::retry' : ''}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });
                        const out = cleanAB(fx?.out || '');
                        if (headToHeadValid(out)) { m.headToHeadHtml = out; return; }
                    }

                    // Absolute fallback: synthesize 6 generic but valid cards with real labels
                    const dims = [
                        'Developer Experience & Speed',
                        'Output Control & Reliability',
                        'Performance, Latency & Cost',
                        'Integration & Tooling',
                        'Scalability & Operations',
                        'Security, Governance & Compliance'
                    ];
                    const mk = (i, name) => `
<article class="bl-card">
  <h3 class="bl-h3">${i + 1}) ${name}</h3>
  <p>${caseALabel} and ${caseBLabel} approach this dimension differently in the context of “${title}”. ${caseALabel} tends to favor simpler flows with fewer moving parts, while ${caseBLabel} emphasizes convenience and faster routine operation. In practice, teams evaluate typical usage, edge cases, and cost/risk appetite to decide which trade-offs matter most. Pilot with both for your top tasks, measure user impact and total cost, then standardize on the option that keeps your core scenarios smooth without over-optimizing for rare exceptions.</p>
</article>`.trim();

                    m.headToHeadHtml = dims.map((d, i) => mk(i, d)).join('');
                };

                await ensureHeadToHead();

                // Ensure a strong title if missing
                m.headToHeadTitle = m.headToHeadTitle || `Head-to-Head Breakdown: A Detailed Comparison`;
            }


            // ===== Deep Dive validators & prompt =====
            function hasPlaceholderText(html) {
                const t = String(html || '').toLowerCase();
                return (
                    /120[\s–-]?\s*180\s*words/.test(t) ||
                    /8[\s–-]?\s*16\s*word/.test(t) ||
                    /short benefit label/.test(t) ||
                    /placeholder/.test(t) ||
                    /lorem ipsum/.test(t)
                );
            }
            function looksLikeCards(html) {
                const s = String(html || '');
                const articleCount = (s.match(/<article[^>]*\bbl-card\b/gi) || []).length;
                const hasWhy = /<h3[^>]*class=["'][^"']*\bbl-h3\b[^"']*["'][^>]*>\s*why teams love it\s*<\/h3>/i.test(s);
                const hasSig = /<h3[^>]*class=["'][^"']*\bbl-h3\b[^"']*["'][^>]*>\s*(signature strengths|multimodal\s*&\s*real[-\s]*time|google[-\s]*native advantages)\s*<\/h3>/i.test(s);
                const hasPros = /<ul[^>]*\bbl-bullets\b[^>]*\blist-pros\b[^>]*>[\s\S]*?<li/gi.test(s);
                const hasCons = /<ul[^>]*\bbl-bullets\b[^>]*\blist-cons\b[^>]*>[\s\S]*?<li/gi.test(s);
                const prosCount = (s.match(/<ul[^>]*\blist-pros\b[\s\S]*?<\/ul>/i)?.[0].match(/<li/gi) || []).length;
                const consCount = (s.match(/<ul[^>]*\blist-cons\b[\s\S]*?<\/ul>/i)?.[0].match(/<li/gi) || []).length;
                return articleCount >= 4 && hasWhy && hasSig && hasPros && hasCons && prosCount >= 4 && consCount >= 3;
            }
            function deepDiveValid(html) {
                return looksLikeCards(html) && !hasPlaceholderText(html);
            }
            function secondH3For(label) {
                const low = String(label || '').toLowerCase();
                if (low.includes('openai')) return 'Multimodal & real-time';
                if (low.includes('gemini')) return 'Google-native advantages';
                return 'Signature strengths';
            }
            function buildDeepDiveFixPrompt(projectName, serviceType, pageTitle, caseLabel, secondH3) {
                const contextBits = [
                    projectName ? `Project: "${projectName}"` : null,
                    serviceType ? `Service/Niche: "${serviceType}"` : null,
                    pageTitle ? `Blog Title: "${pageTitle}"` : null,
                    caseLabel ? `This deep dive is for: "${caseLabel}" (do NOT say "Option A/B")` : null
                ].filter(Boolean).join('\n- ');
                return `
Return ONLY valid JSON: {"out": "<HTML>"}.

Rules:
- Output "out" MUST be a single HTML fragment containing EXACTLY these 4 <article class="bl-card"> blocks IN ORDER:
  1) <article class="bl-card"><h3 class="bl-h3">Why teams love it</h3><p>120–180 words…</p></article>
  2) <article class="bl-card"><h3 class="bl-h3">${secondH3}</h3><p>120–180 words…</p></article>
  3) <article class="bl-card"><h3 class="bl-h3">Where it especially shines</h3>
       <ul class="bl-bullets list-pros">
         <li><strong>2–5 word label:</strong> 8–16 word detail tied to ${caseLabel}.</li>
         <li>… (4 items total)</li>
       </ul>
     </article>
  4) <article class="bl-card"><h3 class="bl-h3">Potential trade-offs</h3>
       <ul class="bl-bullets list-cons">
         <li>8–16 word realistic trade-off, framed constructively.</li>
         <li>… (3–4 items)</li>
       </ul>
     </article>
- NO paragraphs outside those 4 <article> blocks.
- NO "Option A" or "Option B" anywhere; use "${caseLabel}" where needed.
- NO placeholders like "120–180 words", "Short benefit label", or "8–16 word".
- Be specific to the topic: "${pageTitle}" ${serviceType ? `and the niche "${serviceType}"` : ''}.
- Plain HTML only (no <section>, no wrappers, no scripts).

Context:
- ${contextBits || '(no extra context)'}
`.trim();
            }
            async function ensureDeepDiveHtml(currentHtml, caseLabel, tag) {
                const cleanAB = s => replaceOptionAB(s, caseALabel, caseBLabel);
                if (deepDiveValid(currentHtml)) return cleanAB(currentHtml);

                const prompt1 = buildDeepDiveFixPrompt(projectName, serviceType, title, caseLabel, secondH3For(caseLabel));
                let fix = await fetchJSONFromOpenAI(prompt1, `COMPARISON_DEEPDIVE_FIX_${tag}`, {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::deepDive${tag}`,
                    disableMemory: true, noFewShot: true, newThread: true
                });
                let out = String(fix?.out || '').trim();
                if (deepDiveValid(out)) return cleanAB(out);

                fix = await fetchJSONFromOpenAI(prompt1, `COMPARISON_DEEPDIVE_FIX_${tag}_RETRY`, {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::deepDive${tag}::retry`,
                    disableMemory: true, noFewShot: true, newThread: true
                });
                out = String(fix?.out || '').trim();
                if (deepDiveValid(out)) return cleanAB(out);

                const salvaged = (String(currentHtml || '')
                    .match(/<article[^>]*class=["'][^"']*\bbl-card\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || [])
                    .slice(0, 4).join('');
                if (deepDiveValid(salvaged)) return cleanAB(salvaged);

                return cleanAB(currentHtml || '');
            }

            // ===== Head-to-Head validators & prompts (mandatory 5–6 cards) =====
            function headToHeadValid(html) {
                const s = String(html || '');
                const cards = (s.match(/<article[^>]*\bbl-card\b/gi) || []).length;
                if (cards < 5 || cards > 6) return false;
                const numberedH3s = (s.match(/<h3[^>]*\bbl-h3\b[^>]*>\s*\d+\)\s*[^<]+<\/h3>/gi) || []).length;
                if (numberedH3s < 5) return false;
                return !hasPlaceholderText(s);
            }
            function buildHeadToHeadFixPrompt(projectName, serviceType, pageTitle, aLabel, bLabel) {
                const ctx = [
                    projectName ? `Project: "${projectName}"` : null,
                    serviceType ? `Service/Niche: "${serviceType}"` : null,
                    pageTitle ? `Blog Title: "${pageTitle}"` : null,
                    `Compare: "${aLabel}" vs "${bLabel}"`
                ].filter(Boolean).join('\n- ');
                return `
Return ONLY valid JSON: {"out":"<HTML>"}.

Rules:
- Produce an HTML fragment with 5–6 <article class="bl-card"> blocks.
- Each block MUST start with a numbered H3: <h3 class="bl-h3">N) Title</h3> where N is 1..6
- Each block MUST contain exactly one <p> paragraph (120–180 words) comparing "${aLabel}" vs "${bLabel}" on one factor.
- No lists/tables inside Head-to-Head.
- No placeholders ("lorem", "120–180 words", etc).
- Plain HTML only (no wrappers/section/script).

Suggested factors to cover (adapt to topic): Developer Experience, Output Control/Tool Calling, Context & Retrieval, Multimodality/Real-time, Performance/Latency/Costs, Security/Governance.

Context:
- ${ctx}
`.trim();
            }
            function buildHeadToHeadForcePrompt(projectName, serviceType, pageTitle, aLabel, bLabel) {
                return buildHeadToHeadFixPrompt(projectName, serviceType, pageTitle, aLabel, bLabel);
            }

            // ===== Deep replace for any leftover "Option A/B" =====
            function deepReplace(obj) {
                if (typeof obj === 'string') {
                    return obj.replace(/\bOption A\b/g, caseALabel).replace(/\bOption B\b/g, caseBLabel);
                }
                if (Array.isArray(obj)) return obj.map(deepReplace);
                if (obj && typeof obj === 'object') {
                    const out = {};
                    for (const [k, v] of Object.entries(obj)) out[k] = deepReplace(v);
                    return out;
                }
                return obj;
            }
            m = deepReplace(m);

            // ===== Quick Verdict table (MANDATORY; 5–6 rows; never show "Option A/B" in headers) =====
            async function buildOrFixQuickVerdict() {
                const rows = Array.isArray(m.comparisonTable) ? m.comparisonTable : [];
                const cleanRows = rows
                    .map(r => ({
                        factor: clean(r.factor || ''),
                        a: clean(replaceOptionAB(r.a || '', caseALabel, caseBLabel)),
                        b: clean(replaceOptionAB(r.b || '', caseALabel, caseBLabel))
                    }))
                    .filter(r => r.factor && r.a && r.b);

                if (cleanRows.length >= 5 && cleanRows.length <= 12) return cleanRows.slice(0, 6);

                // Re-ask OpenAI to generate the table (MANDATORY 5–6 factors)
                const prompt = `
Return ONLY valid JSON: {"rows":[{"factor":string,"a":string,"b":string},...]}.

Rules:
- 5–6 rows ONLY.
- "factor" is a concise comparison dimension (e.g., "Developer Experience").
- "a"/"b" must contain content labeled implicitly for "${caseALabel}" and "${caseBLabel}" (NO literal "Option A/B" wording).
- Be specific to: "${title}" ${serviceType ? `in niche "${serviceType}"` : ''}.
- No placeholders.
`.trim();

                const fx = await fetchJSONFromOpenAI(prompt, 'COMPARISON_QUICK_VERDICT_FIX', {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::quickverdict`,
                    disableMemory: true, noFewShot: true, newThread: true
                });

                const got = Array.isArray(fx?.rows) ? fx.rows : [];
                const fixed = got
                    .map(r => ({
                        factor: clean(r.factor || ''),
                        a: clean(replaceOptionAB(r.a || '', caseALabel, caseBLabel)),
                        b: clean(replaceOptionAB(r.b || '', caseALabel, caseBLabel))
                    }))
                    .filter(r => r.factor && r.a && r.b)
                    .slice(0, 6);

                return fixed;
            }

            const quickVerdictRows = await buildOrFixQuickVerdict();
            const comparisonTableHtml = `
    <div class="bl-table-wrap">
      <table class="bl-table">
        <thead>
          <tr><th>Factor</th><th>${caseALabel}</th><th>${caseBLabel}</th></tr>
        </thead>
        <tbody>
          ${quickVerdictRows.map(r => `<tr><td>${r.factor}</td><td>${r.a}</td><td>${r.b}</td></tr>`).join('')}
        </tbody>
      </table>
    </div>`.trim();

            // ===== Hero defaults =====
            const heroSrc = m.heroImage || coverUrl || imagePool[0] || '';
            const heroSrcset = m.heroImageSrcset || (heroSrc
                ? `${heroSrc}?w=800 800w, ${heroSrc}?w=1200 1200w, ${heroSrc}?w=1600 1600w`
                : '');
            const heroAlt = m.heroImageAlt || bestAlt(heroSrc || '', projectName, serviceType);

            // ===== Enforce Deep Dive A & B (MANDATORY 4-card structure) =====
            m.caseAHtml = await ensureDeepDiveHtml(m.caseAHtml, caseALabel || m.caseAName || '', 'A');
            m.caseBHtml = await ensureDeepDiveHtml(m.caseBHtml, caseBLabel || m.caseBName || '', 'B');

            m.caseATitle = m.caseATitle || `Deep Dive: The Case for ${caseALabel}`;
            m.caseBTitle = m.caseBTitle || `Deep Dive: The Case for ${caseBLabel}`;

            // ===== Head-to-Head (MANDATORY 5–6 cards) =====
            async function ensureHeadToHead() {
                const cleanAB = s => replaceOptionAB(s, caseALabel, caseBLabel);
                let current = String(m.headToHeadHtml || '').trim();
                if (headToHeadValid(current)) {
                    m.headToHeadHtml = cleanAB(current);
                    return;
                }
                const prompt = buildHeadToHeadFixPrompt(projectName, serviceType, title, caseALabel, caseBLabel);
                for (let i = 0; i < 2; i++) {
                    const fx = await fetchJSONFromOpenAI(prompt, i === 0 ? 'COMPARISON_HEAD2HEAD_FIX' : 'COMPARISON_HEAD2HEAD_FIX_RETRY', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::headtohead${i ? '::retry' : ''}`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });
                    const out = String(fx?.out || '').trim();
                    if (headToHeadValid(out)) {
                        m.headToHeadHtml = cleanAB(out);
                        return;
                    }
                }
                const salvaged = (current.match(/<article[^>]*class=["'][^"']*\bbl-card\b[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || []).slice(0, 6).join('');
                if (headToHeadValid(salvaged)) {
                    m.headToHeadHtml = cleanAB(salvaged);
                    return;
                }
                const force = buildHeadToHeadForcePrompt(projectName, serviceType, title, caseALabel, caseBLabel);
                for (let i = 0; i < 2; i++) {
                    const fx = await fetchJSONFromOpenAI(force, i === 0 ? 'COMPARISON_HEAD2HEAD_FORCE' : 'COMPARISON_HEAD2HEAD_FORCE_RETRY', {
                        userId, projectId, pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::headtohead::force${i ? '::retry' : ''}`,
                        disableMemory: true, noFewShot: true, newThread: true
                    });
                    const out = String(fx?.out || '').trim();
                    if (headToHeadValid(out)) {
                        m.headToHeadHtml = cleanAB(out);
                        return;
                    }
                }
                // Last chance: still fill (prompt is strict so it'll be structured)
                const fx = await fetchJSONFromOpenAI(force, 'COMPARISON_HEAD2HEAD_FORCE_LAST', {
                    userId, projectId, pageId,
                    promptFrom: 'aiblogsQueue',
                    promptFor: `${projectName}::${title}::headtohead::force::last`,
                    disableMemory: true, noFewShot: true, newThread: true
                });
                const out = String(fx?.out || '').trim();
                m.headToHeadHtml = headToHeadValid(out) ? cleanAB(out) : cleanAB(out);
            }
            await ensureHeadToHead();
            m.headToHeadTitle = m.headToHeadTitle || 'Head-to-Head Breakdown: A Detailed Comparison';


            // ---- RECOMMENDATION: enforce mandatory structure (2 bullet lists + hybrid paragraph) ----
            {
                // helper: placeholder / junk detectors
                const hasPlaceholderish = (s) => /8–16|8-16|TBD|lorem ipsum|Short benefit label|realistic trade-off|INSERT|{{|}}/i.test(String(s || ''));
                const tooGeneric = (s) => /consider your preferences|it depends|both are good choices/i.test(String(s || ''));
                const dedupe = (arr) => Array.from(new Set((arr || []).map(v => String(v || '').trim()).filter(Boolean)));

                // bullet list must have 4–8 concise items; no placeholders
                const bulletsValid = (arr) => {
                    const a = dedupe(arr);
                    if (a.length < 4 || a.length > 8) return false;
                    return a.every(x => x.length >= 6 && x.length <= 180 && !hasPlaceholderish(x));
                };

                // hybrid paragraph: 60–180 words, no placeholders
                const hybridValid = (p) => {
                    const txt = String(p || '').trim();
                    if (!txt || hasPlaceholderish(txt)) return false;
                    const wc = txt.split(/\s+/).length;
                    return wc >= 60 && wc <= 180;
                };

                // clean “Option A/B” anywhere
                const cleanAB = (s) => replaceOptionAB(String(s || ''), caseALabel, caseBLabel);

                // Prompt builder -> returns **strict JSON** (not HTML)
                const buildRecommendationFixPrompt = (projectName, serviceType, pageTitle, aLabel, bLabel) => `
You are writing the **Recommendation** section for a comparison article.

Context:
- Project: ${projectName}
- Service/Category: ${serviceType}
- Page title: ${pageTitle}
- Option A label: "${aLabel}"
- Option B label: "${bLabel}"

STRICT REQUIREMENTS:
- Return ONLY minified JSON (no markdown, no code fences, no commentary).
- JSON shape:
  {
    "chooseA": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "..."],
    "chooseB": ["bullet 1", "bullet 2", "bullet 3", "bullet 4", "..."],
    "hybrid": "one concise paragraph (60–180 words) explaining a pragmatic A+B strategy"
  }
- Each bullet: 1 sentence, concrete and **specific to "${aLabel}" vs "${bLabel}"** in the context of "${pageTitle}".
- No placeholders, no “it depends”, no generic advice like “consider your preferences”.
- NEVER use strings like "Option A" or "Option B"; always use "${aLabel}" and "${bLabel}" where needed.
- 4–6 bullets per side.
- Keep the language neutral, factual, and helpful.
`;

                // Try to parse OpenAI JSON safely
                const safeParse = (t) => {
                    try { return JSON.parse(String(t || '').trim()); } catch { return null; }
                };

                // Ensure recommendation content exists & is valid
                const ensureRecommendation = async () => {
                    // If already valid, keep (after cleaning “Option A/B”)
                    if (bulletsValid(m.chooseAList) && bulletsValid(m.chooseBList) && hybridValid(m.hybridHtml)) {
                        m.chooseAList = dedupe(m.chooseAList).map(cleanAB);
                        m.chooseBList = dedupe(m.chooseBList).map(cleanAB);
                        m.hybridHtml = cleanAB(m.hybridHtml);
                        return;
                    }

                    // Build and call the model (up to 2 attempts)
                    const recPrompt = buildRecommendationFixPrompt(projectName, serviceType, title, caseALabel, caseBLabel);
                    const tryFetch = async (tag) => {
                        const fx = await fetchJSONFromOpenAI(recPrompt, tag, {
                            userId, projectId, pageId,
                            promptFrom: 'aiblogsQueue',
                            promptFor: `${projectName}::${title}::recommendation${tag.includes('RETRY') ? '::retry' : ''}`,
                            disableMemory: true, noFewShot: true, newThread: true
                        });
                        const out = String(fx?.out || '').trim();
                        const json = safeParse(out);
                        if (!json) return null;

                        // Normalize & validate
                        let chooseA = dedupe(json.chooseA || []).map(clean);
                        let chooseB = dedupe(json.chooseB || []).map(clean);
                        let hybrid = clean(json.hybrid || '');

                        // Filter junk
                        chooseA = chooseA.filter(x => !hasPlaceholderish(x) && !tooGeneric(x));
                        chooseB = chooseB.filter(x => !hasPlaceholderish(x) && !tooGeneric(x));
                        hybrid = (!hasPlaceholderish(hybrid) && !tooGeneric(hybrid)) ? hybrid : '';

                        if (bulletsValid(chooseA) && bulletsValid(chooseB) && hybridValid(hybrid)) {
                            return { chooseA, chooseB, hybrid };
                        }
                        return null;
                    };

                    let best = await tryFetch('COMPARISON_RECO_FIX');
                    if (!best) best = await tryFetch('COMPARISON_RECO_FIX_RETRY');

                    // Last-resort fallback (still domain-agnostic but safe)
                    if (!best) {
                        // craft pragmatic, neutral defaults keyed to labels
                        const A = caseALabel, B = caseBLabel;
                        const fallbackA = [
                            `Prefer ${A} when you want a simpler, lower-dependency setup with fewer moving parts.`,
                            `Choose ${A} if reliability under basic conditions matters more than convenience features.`,
                            `Pick ${A} when total cost and maintenance complexity need to stay minimal.`,
                            `Go with ${A} if users are comfortable with the traditional/established workflow.`
                        ];
                        const fallbackB = [
                            `Prefer ${B} when fast, low-effort operation is critical in day-to-day usage.`,
                            `Choose ${B} if accessibility and ease-of-use across all users is a priority.`,
                            `Pick ${B} when quick restarts and frequent stop-start scenarios are common.`,
                            `Go with ${B} if you value added features even at higher initial cost.`
                        ];
                        const fallbackHybrid = `Many teams blend ${A} and ${B}: default to ${B} for everyday convenience and rapid starts, then keep ${A} as a dependable path when conditions, constraints, or edge cases make a simpler mechanism preferable. This dual approach balances reliability, user experience, and total cost of ownership while letting you tune policies over time.`;

                        best = { chooseA: fallbackA, chooseB: fallbackB, hybrid: fallbackHybrid };
                    }

                    // Assign back to the model (template expects arrays for A/B and a paragraph for hybrid)
                    m.chooseATitle = m.chooseATitle || `Choose ${caseALabel} if you…`;
                    m.chooseBTitle = m.chooseBTitle || `Choose ${caseBLabel} if you…`;
                    m.hybridTitle = m.hybridTitle || 'The hybrid play (often best)';
                    m.recommendationTitle = m.recommendationTitle || 'Which Is Right for You? Our Expert Recommendation';

                    m.chooseAList = best.chooseA.map(x => cleanAB(x));
                    m.chooseBList = best.chooseB.map(x => cleanAB(x));
                    m.hybridHtml = cleanAB(best.hybrid);
                };

                await ensureRecommendation();
            }


            // ===== Dates, titles, etc. =====
            const today = new Date().toISOString().split('T')[0];
            const quickVerdictDynamicTitle = `At a Glance: ${caseALabel} vs ${caseBLabel} — The Quick Verdict`;
 if (m.quickAnswer === '' || m.quickAnswer.trim().split(/\s+/).length < 15) {
                console.log("m.quickAnswer is empty, generating via OpenAI...");

                let prompt = `You are an expert content writer. Write a concise, informative answer (80-100 words) for the question below. Use a neutral and helpful tone.
                Question: ${title} `

                m.quickAnswer = await fetchStringFromOpenAI(prompt, label = "HowBlogQuickanswerPrompt", {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: "BlogsQueue",
                    promptFor: "HowquickAnswer"
                });

                console.log(m.quickAnswer, "hi bro quickanswer")

            }
            // ===== map for placeholders in comparison.html =====
            const map = {
                // HEAD/meta
                title: clean(m.title || title),
                metaDescription: clean(m.metaDescription || `${projectName} ${serviceType}`),
                canonicalUrl: clean(m.canonicalUrl || `${domain}/comparisons/${normDash(title)}`),
                ogTitle: clean(m.ogTitle || m.title || title),
                ogDescription: clean(m.ogDescription || m.metaDescription || ''),
                ogUrl: clean(m.ogUrl || m.canonicalUrl || `${domain}/comparisons/${normDash(title)}`),
                ogImage: clean(m.ogImage || heroSrc),
                siteName: clean(m.siteName || projectName),
                twitterTitle: clean(m.twitterTitle || m.title || title),
                twitterDescription: clean(m.twitterDescription || m.metaDescription || ''),
                twitterImage: clean(m.twitterImage || m.ogImage || heroSrc),
                siteUrl: clean(m.siteUrl || domain),
                logoUrl: clean(m.logoUrl || `${domain}/static/logo.png`),
                searchUrl: clean(m.searchUrl || `${domain}/search`),
                references: referencesHtmlComp,

                breadcrumbJson: clean(m.breadcrumbJson || `{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"${domain}/"},{"@type":"ListItem","position":2,"name":"Comparisons","item":"${domain}/comparisons/"},{"@type":"ListItem","position":3,"name":"${clean(m.title || title)}","item":"${clean(m.canonicalUrl || `${domain}/comparisons/${normDash(title)}`)}"}]}`),

                articleHeadline: clean(m.articleHeadline || m.title || title),
                articleDescription: clean(m.articleDescription || m.metaDescription || ''),
                articleImage: clean(m.articleImage || m.ogImage || heroSrc),
                datePublished: clean(m.datePublished || today),
                dateModified: clean(m.dateModified || today),

                // Hero + meta row
                eyebrow: clean(m.eyebrow || 'Comparison'),
                mainTitle: clean(m.mainTitle || m.title || title),
                reviewedBy: clean(m.reviewedBy || 'Platform Architect'),
                dateHuman: clean(m.dateHuman || 'Updated ' + new Date().toLocaleDateString()),
                readTime: clean(m.readTime || '6–8 min read'),
                wordCount: clean(m.wordCount || '— words'),

                quickAnswer: clean(m.quickAnswer || ''),
                tldrAudioUrl: clean(m.tldrAudioUrl || ''),
                heroImage: clean(heroSrc),
                heroImageAlt: clean(heroAlt),
                heroImageSrcset: clean(heroSrcset),
                heroCaption: clean(m.heroCaption || ''),

                // Sidebar minis
                summaryTitle: clean(m.summaryTitle || 'When A vs B?'),
                summaryBulletsHtml: ul(m.summaryBullets || []),
                fastFactsHtml: ul(m.fastFacts || []),
                voicePromptsHtml: ul(m.voicePrompts || []),

                // Tabs labels used in template
                caseALabel,
                caseBLabel,

                // TOC
                tocHtml,

                // Intro
                introTitle: clean(m.introTitle || 'What You Will Learn / Introduction'),
                introHtml: m.introHtml || '',

                // Quick verdict
                quickVerdictTitle: clean(m.quickVerdictTitle || quickVerdictDynamicTitle),
                comparisonTableHtml,
                quickVerdictNote: clean(m.quickVerdictNote || ''),

                // Deep dives
                caseATitle: clean(m.caseATitle || `Deep Dive: The Case for ${caseALabel}`),
                caseBTitle: clean(m.caseBTitle || `Deep Dive: The Case for ${caseBLabel}`),
                caseAHtml: m.caseAHtml || '',
                caseBHtml: m.caseBHtml || '',

                // Head-to-head
                headToHeadTitle: clean(m.headToHeadTitle || 'Head-to-Head Breakdown: A Detailed Comparison'),
                headToHeadHtml: m.headToHeadHtml || '',

                // Recommendation
                recommendationTitle: clean(m.recommendationTitle || 'Which Is Right for You?'),
                chooseATitle: clean(m.chooseATitle || `Choose ${caseALabel} if you…`),
                chooseAListHtml: ul(m.chooseAList || []),
                chooseBTitle: clean(m.chooseBTitle || `Choose ${caseBLabel} if you…`),
                chooseBListHtml: ul(m.chooseBList || []),
                hybridTitle: clean(m.hybridTitle || 'The hybrid play'),
                hybridHtml: m.hybridHtml || '',

                // Verdict
                verdictTitle: clean(m.verdictTitle || 'The Verdict & The Smartest Stack'),
                verdictHtml: clean(m.verdictHtml || ''),
                verdictCtaLabel: clean(m.verdictCtaLabel || 'Review the Quick Verdict'),

                // Related
                relatedTitle: clean(m.relatedTitle || 'Related Articles'),
                relatedArticlesHtml,

                // Comments header / review summary
                reviewSummary: clean(m.reviewSummary || ''),

                // Author
                authorName: clean(WriterName),
                authorJobTitle: clean(WriterJobTitle),
                authorImage: clean(WriterImage),
                authorBio: clean(WriterBio || `${WriterName} writes about ${serviceType}.`),
                authorXUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinkedInUrl: clean(`https://linkedin.com/in/${normDash(WriterName)}`),
                authorPageUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinksHtml,
                authorSameAs,
            };

            content_html = fillAllPlaceholders(template, map);
            content_html = replaceOptionAB(content_html, caseALabel, caseBLabel);
        }


        else if (styleText === 'how') {
            const m = model;

            const { cleanedRefs: howRefs, referencesHtml: referencesHtmlHow } = cleanReferences(m.references);

            // === Build small HTML fragments ===
            // Tabs (top nav)
            // === Build small HTML fragments ===
            // Tabs (top nav)
            const TOC_LABELS = {
                intro: { short: 'Intro', full: 'What You Will Learn / Introduction' },
                why: { short: 'Why', full: 'Why is this task crucial?' },
                gettingStarted: { short: 'Prep', full: 'Getting Started: Tools & Preparation' },
                tools: { short: 'Tools', full: 'Essential Tools & Materials' },
                safety: { short: 'Safety', full: 'Safety First: Key Precautions' },
                steps: { short: 'Steps', full: 'The Step-by-Step Process' },
                mistakes: { short: 'Mistakes', full: 'Common Mistakes to Avoid' },
                faqs: { short: 'FAQ', full: 'FAQs' },
                proHelp: { short: 'Pro Help', full: 'When to Call a Professional' },
                conclusion: { short: 'Conclusion', full: 'Conclusion' }
            };

            // Top nav tabs (use short labels)
            const tocTabs = [
                { href: '#toc', label: 'Contents' },
                { href: '#intro', label: TOC_LABELS.intro.short },
                { href: '#why', label: TOC_LABELS.why.short },
                { href: '#getting-started', label: TOC_LABELS.gettingStarted.short },
                { href: '#steps', label: TOC_LABELS.steps.short },
                { href: '#mistakes', label: TOC_LABELS.mistakes.short },
                { href: '#faqs', label: TOC_LABELS.faqs.short },
                { href: '#pro-help', label: TOC_LABELS.proHelp.short },
                { href: '#conclusion', label: TOC_LABELS.conclusion.short },
            ].map(t => `<li role="presentation"><a role="tab" href="${t.href}" class="bl-tab">${t.label}</a></li>`).join('');

            // Nested ToC card with Getting Started sub-items (use full labels)
            const tocHtml = `
            <ol class="bl-toc">
                <li><a href="#intro">${TOC_LABELS.intro.full}</a></li>
                <li><a href="#why">${TOC_LABELS.why.full}</a></li>
                <li><a href="#getting-started">${TOC_LABELS.gettingStarted.full}</a>
                    <ol>
                        <li><a href="#tools">${TOC_LABELS.tools.full}</a></li>
                        <li><a href="#safety">${TOC_LABELS.safety.full}</a></li>
                    </ol>
                </li>
                <li><a href="#steps">${TOC_LABELS.steps.full}</a></li>
                <li><a href="#mistakes">${TOC_LABELS.mistakes.full}</a></li>
                <li><a href="#faqs">${TOC_LABELS.faqs.full}</a></li>
                <li><a href="#pro-help">${TOC_LABELS.proHelp.full}</a></li>
                <li><a href="#conclusion">${TOC_LABELS.conclusion.full}</a></li>
            </ol>
            `;

            // Sidebar minis
            const toolsListHtml = (m.toolsList || []).map(x => `<li>${clean(x)}</li>`).join('');
            const fastFactsHtml = (m.fastFacts || []).map(x => `<li>${clean(x)}</li>`).join('');
            const voicePromptsHtml = (m.voicePrompts || []).map(x => `<li>${clean(x)}</li>`).join('');

            // Extract PREP inner lists (from m.prepHtml)
            function extractUlInner(html, articleId) {
                const re = new RegExp(
                    `<article[^>]*id=["']${articleId}["'][^>]*>[\\s\\S]*?<ul[^>]*>([\\s\\S]*?)</ul>`,
                    'i'
                );
                const m2 = (html || '').match(re);
                return m2 ? m2[1].trim() : '';
            }
            const prepToolsInnerHtml = extractUlInner(m.prepHtml || '', 'tools');
            const prepSafetyInnerHtml = extractUlInner(m.prepHtml || '', 'safety');

            // === NEW: robust fallbacks if extraction failed ===
            const ensureHasItems = (s) => !!(s && s.replace(/<li[^>]*>.*?<\/li>/gis, 'x').includes('x'));

            // Tools fallback: reuse the sidebar tools list if extracted list is empty
            const prepToolsInnerHtmlFinal = ensureHasItems(prepToolsInnerHtml)
                ? prepToolsInnerHtml
                : (toolsListHtml || '');

            // Safety fallback: prefer m.safetyList[] if given, else default items
            const safetyListHtml = Array.isArray(m.safetyList) && m.safetyList.length
                ? m.safetyList.map(x => `<li>${clean(x)}</li>`).join('')
                : [
                    'Wear gloves and eye protection.',
                    'Work in a well-ventilated area, away from flames.',
                    'Stabilize the bike on a stand before cleaning or polishing.',
                    'Keep chemicals off brakes and rotors; avoid petroleum on rubber.',
                    'Keep kids and pets away from the workspace.'
                ].map(x => `<li>${x}</li>`).join('');

            const prepSafetyInnerHtmlFinal = ensureHasItems(prepSafetyInnerHtml)
                ? prepSafetyInnerHtml
                : safetyListHtml;

            // Related articles (grid)
            const relatedArticlesHtml = (internalLinks || []).map(a => `
            <article class="bl-related-item">
                <a class="bl-related-media" href="${clean(a.url)}">
                <img src="${clean(a.image)}" alt="${clean(a.imageAlt)}">
                </a>
                <h3 class="bl-h3"><a href="${clean(a.url)}">${clean(a.title)}</a></h3>
                <p class="bl-related-snippet">${clean(a.snippet)}</p>
            </article>
            `).join('');

            // Comments (sample fallback, only if your m.commentsHtml is the stock scaffolding)
            const sampleCommentsHtml = (m.commentsHtml && !m.commentsHtml.includes('<form'))
                ? m.commentsHtml
                : `<div class="bl-comment"><div class="bl-comment-head"><span class="bl-comment-name">Taylor R.</span><span class="bl-comment-date">${new Date().toLocaleDateString()}</span></div><div class="bl-comment-rating">★★★★★</div><div class="bl-comment-text">Great tips — wax advice helped a lot.</div></div>`;

            // JSON-LD blocks — ensure <script> wrapped strings
            const websiteJson = m.websiteJson?.trim().startsWith('<script') ? m.websiteJson
                : `<script type="application/ld+json">${m.websiteJson || '{}'}</script>`;
            const breadcrumbJson = m.breadcrumbJson?.trim().startsWith('<script') ? m.breadcrumbJson
                : `<script type="application/ld+json">${m.breadcrumbJson || '{}'}</script>`;
            const schemaJson = m.schemaJson?.trim().startsWith('<script') ? m.schemaJson
                : `<script type="application/ld+json">${m.schemaJson || '{}'}</script>`;

            // Hero defaults
            const heroSrc = m.heroImage || coverUrl || imagePool[0] || '';
            const heroSrcset = m.heroImageSrcset || (heroSrc
                ? `${heroSrc}?w=800 800w, ${heroSrc}?w=1200 1200w, ${heroSrc}?w=1600 1600w`
                : '');
            const heroAlt = m.heroImageAlt || bestAlt(heroSrc || '', projectName, serviceType);

            // Dates
            const today = new Date().toISOString().split('T')[0];

           if (m.quickAnswer === '' || m.quickAnswer.trim().split(/\s+/).length < 15) {
                console.log("m.quickAnswer is empty, generating via OpenAI...");

                let prompt = `You are an expert content writer. Write a concise, informative answer (80-100 words) for the question below. Use a neutral and helpful tone.
                Question: ${title} `

                m.quickAnswer = await fetchStringFromOpenAI(prompt, label = "HowBlogQuickanswerPrompt", {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: "BlogsQueue",
                    promptFor: "HowquickAnswer"
                });

                console.log(m.quickAnswer, "hi bro quickanswer")

            }

            // === Placeholder map ===
            const map = {
                // SEO/head
                title: clean(m.title || title),
                metaDescription: clean(m.metaDescription || `${projectName} ${serviceType}`),
                canonicalUrl: clean(m.canonicalUrl || `${domain}/guides/${normDash(title)}`),
                ogTitle: clean(m.ogTitle || m.title || title),
                ogDescription: clean(m.ogDescription || m.metaDescription || ''),
                ogUrl: clean(m.ogUrl || m.canonicalUrl || `${domain}/guides/${normDash(title)}`),
                ogImage: clean(m.ogImage || heroSrc),
                siteName: clean(m.siteName || projectName),
                twitterTitle: clean(m.twitterTitle || m.title || title),
                twitterDescription: clean(m.twitterDescription || m.metaDescription || ''),
                twitterImage: clean(m.twitterImage || m.ogImage || heroSrc),

                // Author box extras (used in how.html)
                editorialPolicyUrl: clean(`${domain}/editorial-policy`),
                contactUrl: clean(`${domain}/contact`),

                // Ratings (used in comments/reviews header)
                avgRating: clean(m.avgRating || '4.8'),

                // JSON-LD
                websiteJson,
                breadcrumbJson,
                schemaJson,
                references: referencesHtmlHow,


                // Hero + meta row

                reviewedBy: clean(m.reviewedBy || `${serviceType} Expert`),
                datePublished: clean(m.datePublished || today),
                dateHuman: clean(m.dateHuman || 'Updated ' + new Date().toLocaleDateString()),
                readTime: clean(m.readTime || '7–9 min read'),
                wordCount: clean(m.wordCount || '— words'),
                eyebrow: clean(m.eyebrow || 'How&nbsp;to'),
                mainTitle: clean(m.mainTitle || m.title || title),
                quickAnswer: clean(m.quickAnswer || ''),

                heroImage: clean(heroSrc),
                heroImageAlt: clean(heroAlt),
                heroImageSrcset: clean(heroSrcset),
                heroCaption: clean(m.heroCaption || ''),

                // Tabs + ToC
                tocTabs,
                tocHtml,

                // Sidebar lists (aliases)
                toolsListHtml,
                toolsInnerHtml: toolsListHtml,
                fastFactsHtml,
                fastFactsInnerHtml: fastFactsHtml,
                voicePromptsHtml,
                voicePromptsInnerHtml: voicePromptsHtml,

                // PREP (use finals with robust fallbacks)
                prepToolsInnerHtml: prepToolsInnerHtmlFinal,
                prepSafetyInnerHtml: prepSafetyInnerHtmlFinal,

                // Main content
                introHtml: m.introHtml || '',
                whyHtml: m.whyHtml || '',
                prepHtml: m.prepHtml || '',
                stepsHtml: m.stepsHtml || '',
                mistakesHtml: m.mistakesHtml || '',
                faqHtml: m.faqHtml || '',
                proHelpHtml: m.proHelpHtml || '',
                conclusionHtml: m.conclusionHtml || '',


                commentsHtml: m.commentsHtml || '',
                sampleCommentsHtml,

                // Related
                relatedArticlesHtml: relatedArticlesHtml,
            

                authorName: clean(WriterName),
                authorJobTitle: clean(WriterJobTitle),
                authorImage: clean(WriterImage),
                authorBio: clean(WriterBio || `${WriterName} writes about ${serviceType}.`),
                authorXUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinkedInUrl: clean(`https://linkedin.com/in/${normDash(WriterName)}`),
                authorPageUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinksHtml,
                authorSameAs,



            };

            content_html = fillAllPlaceholders(template, map);
        }


        else if (styleText === 'what') {
            const m = model;
            console.log(`[aiblogsQueue:${job.id}] Rendering WHAT template`);
            const { cleanedRefs: whatRefs, referencesHtml: referencesHtmlWhat } = cleanReferences(m.references);


            function normalizeBenefitsHtml(html, topicTitle) {
                const raw = String(html || '').trim();
                if (!raw) return '';

                // Split on </article> while keeping simple blocks
                const chunks = raw.split(/<\/article>\s*/i).filter(s => s.trim());

                // Only process if we have 4+ articles already (don't add extras)
                if (chunks.length < 4) {
                    // Fallback: create minimal articles from fastFacts if needed
                    const fallbackArticles = toArticlesFromList((model.fastFacts || []), 'Benefit').slice(0, 4);
                    return fallbackArticles;
                }

                const fixed = chunks.map((chunk, idx) => {
                    const n = idx + 1;
                    let body = chunk.trim();

                    // Ensure <article> wrapper
                    if (!/^<article\b/i.test(body)) body = `<article>${body}</article>`;

                    // Normalize/insert the <h3> with class and numbering
                    if (/<h3\b/i.test(body)) {
                        body = body.replace(
                            /<h3[^>]*>(.*?)<\/h3>/i,
                            (_m, titleTxt) =>
                                `<h3 class="bl-h3">Benefit ${n} — ${String(titleTxt || '')
                                    .replace(/^Benefit\s*\d+\s*—\s*/i, '')
                                    .trim()}</h3>`
                        );
                    } else {
                        body = body.replace(
                            /<article\b[^>]*>/i,
                            m => `${m}<h3 class="bl-h3">Benefit ${n} — ${topicTitle}</h3>`
                        );
                    }

                    // Close article if missing
                    if (!/<\/article>\s*$/i.test(body)) body = `${body}</article>`;
                    return body;
                });

                return fixed.slice(0, 6).join(''); // Limit to max 6
            }

            // ===== Enforce mandatory sections with retries =====
            async function ensureWhatSection(sectionKey, currentVal) {
                let val = currentVal;
                const validFns = {
                    fastFacts: whatFastFactsValid,
                    benefitsHtml: whatBenefitsValid,
                    faqs: whatFaqsValid,
                    verdictText: whatVerdictValid
                };
                const isValid = validFns[sectionKey];
                if (isValid && isValid(val)) return val;

                let prompt;
                if (sectionKey === 'faqs') {
                    prompt = `Give me array of object of 5 faqs of blog title "${title}" in output i want question and answer objects`;
                } else {
                    prompt = buildWhatSectionPrompt(sectionKey, title, serviceType);
                }

                for (let retry = 0; retry < 3; retry++) {
                    const fx = await fetchJSONFromOpenAI(prompt, `WHAT_${sectionKey.toUpperCase()}_FIX${retry ? '_RETRY' + retry : ''}`, {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::${sectionKey}${retry ? '::retry' + retry : ''}`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true,
                        apiUrl: sectionKey === 'faqs' || sectionKey === 'benefitsHtml' ? 'https://apis.smartlybuild.dev/admin/v1/openAiJSON' : undefined
                    });
                    let newVal;
                    if (sectionKey === 'fastFacts') newVal = fx?.facts || [];
                    else if (sectionKey === 'benefitsHtml') newVal = String(fx?.result || fx?.out || '').trim();
                    else if (sectionKey === 'faqs') newVal = fx?.result || [];
                    else if (sectionKey === 'verdictText') newVal = String(fx?.out || '').trim();

                    // Skip validation for FAQs; always use API data if available
                    if (sectionKey === 'faqs' && newVal.length > 0) {
                        console.log('Using FAQs directly from API:', newVal);
                        return newVal;
                    }
                    if (isValid(newVal)) return newVal;
                }

                // Dynamic API fallback for faqs and benefitsHtml
                // Dynamic API fallback for faqs and benefitsHtml
                if (sectionKey === 'faqs') {
                    const fallbackPrompt = `Give me array of object of 4-8 faqs of blog title "${title}" in output i want question and answer objects answer must be 100 words`;
                    const fx = await fetchJSONFromOpenAI(fallbackPrompt, `WHAT_FAQS_FALLBACK`, {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::faqs::fallback`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true,
                        apiUrl: 'https://apis.smartlybuild.dev/admin/v1/openAiJSON'
                    });

                    console.log(fx, "hii fx")
                    const faqs = fx?.result || [];


                    return faqs
                }
                if (sectionKey === 'benefitsHtml') {
                    const fallbackPrompt = `Give me array of object of 4-6 benefits for blog title "${title}", each with a title (short, 3-5 words) and description (100-160 words) tied to "${serviceType || 'bike repair'}". Output as [{"title": string, "description": string}]`;
                    const fx = await fetchJSONFromOpenAI(fallbackPrompt, `WHAT_BENEFITSHTML_FALLBACK`, {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::benefitsHtml::fallback`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true,
                        apiUrl: 'https://apis.smartlybuild.dev/admin/v1/openAiJSON'
                    });
                    const benefits = fx?.result || [];
                    if (benefits.length >= 4 && benefits.every(b => b.title && b.description && wc(b.description) >= 100 && wc(b.description) <= 160)) {
                        return benefits.map((b, i) => `<article><h3 class="bl-h3">Benefit ${i + 1} — ${clean(b.title)}</h3><p>${clean(b.description)}</p></article>`).join('');
                    }
                }
                if (sectionKey === 'fastFacts') {
                    const fallbackPrompt = `Give me array of 3-6 short phrases (4-5 words each) for blog title "${title}" related to "${serviceType || 'bike repair'}". Output as {"facts": string[]}`;
                    const fx = await fetchJSONFromOpenAI(fallbackPrompt, `WHAT_FASTFACTS_FALLBACK`, {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::fastFacts::fallback`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true,
                        apiUrl: 'https://apis.smartlybuild.dev/admin/v1/openAiJSON'
                    });
                    return fx?.facts || ["Improves performance", "Enhances torque", "Boosts efficiency"];
                }
                if (sectionKey === 'verdictText') {
                    const fallbackPrompt = `Give me a 80-160 word summary for blog title "${title}" related to "${serviceType || 'bike repair'}". Output as {"out": string}`;
                    const fx = await fetchJSONFromOpenAI(fallbackPrompt, `WHAT_VERDICTTEXT_FALLBACK`, {
                        userId,
                        projectId,
                        pageId,
                        promptFrom: 'aiblogsQueue',
                        promptFor: `${projectName}::${title}::verdictText::fallback`,
                        disableMemory: true,
                        noFewShot: true,
                        newThread: true,
                        apiUrl: 'https://apis.smartlybuild.dev/admin/v1/openAiJSON'
                    });
                    return String(fx?.out || `Summary for ${title}: Larger engines enhance performance... (80 words)`);
                }
                return val;
            }

            // Fetch if needed
            m.fastFacts = await ensureWhatSection('fastFacts', m.fastFacts);
            m.benefitsHtml = await ensureWhatSection('benefitsHtml', m.benefitsHtml);
            m.faqs = await ensureWhatSection('faqs', m.faqs);
            m.verdictText = await ensureWhatSection('verdictText', m.verdictText);

            // ===== WHAT: Validation helpers =====

            function hasPlaceholderText(text) {
                const placeholders = /\[.*?\]|\{\{.*?\}\}|lorem\s+ipsum|placeholder|dummy\s+text/i;
                return placeholders.test(String(text).trim());
            }


            function whatFastFactsValid(arr) {
                const cleanArr = Array.isArray(arr) ? arr.filter(Boolean) : [];
                return cleanArr.length >= 3 && cleanArr.length <= 6 && cleanArr.every(s => wc(s) >= 4 && wc(s) <= 20); // Short phrases
            }

            function whatBenefitsValid(html) {
                const s = String(html || '');
                const articles = (s.match(/<article\b/gi) || []).length;
                const totalWc = wc(s);
                return articles >= 4 && articles <= 6 && totalWc >= 400 && !hasPlaceholderText(s);
            }

            function whatFaqsValid(arr) {
                const cleanArr = Array.isArray(arr) ? arr.filter(f => f.question && f.answer) : [];
                return cleanArr.length >= 3 && cleanArr.length <= 5;  // No word count validation
            }

            function whatVerdictValid(txt) {
                const s = String(txt || '').trim();
                return wc(s) >= 80 && wc(s) <= 160 && !hasPlaceholderText(s);
            }

            function toArticlesFromList(list, prefix) {
                const items = Array.isArray(list) ? list.slice(0, 6) : [];
                return items.map((txt, i) => (
                    `<article><h3 class="bl-h3">${prefix} ${i + 1} — ${clean(txt).split('.').slice(0, 1)[0]}</h3><p>${clean(txt)}</p></article>`
                )).join('');
            }
            function ensureMinArticles(html, min, fallbackHtml) {
                const count = (String(html || '').match(/<article\b/gi) || []).length;
                const totalWords = String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
                if (count >= min && totalWords > 400) return html;  // Raised from >50 chars to >400 words
                return (String(html || '').trim() + fallbackHtml);
            }




            // ===== WHAT: Targeted section prompts =====
            function buildWhatSectionPrompt(sectionKey, title, serviceType) {
                const base = `
                Return ONLY valid JSON. No markdown fences. Clear, neutral, helpful tone.
                Topic: "${title}"
                Service/Niche: "${serviceType || '(not set)'}"
                `.trim();

                switch (sectionKey) {
                    case 'fastFacts':
                        return `${base}
                    Return ONLY {"facts": string[]} with 3–6 short phrases (4–5 words each, no periods/emojis).
                    Example: ["Boosts daily efficiency", "Prevents costly repairs"]`;
                    case 'benefitsHtml':
                        return `Give me array of object of 4-6 benefits for blog title "${title}", each with a title (short, 3-5 words) and description (100-160 words) tied to "${serviceType || 'bike repair'}". Output as [{"title": string, "description": string}]`;
                    case 'faqs':
                        return `Give me array of object of 5 faqs of blog title "${title}" in output i want question and answer objects`;
                    case 'verdictText':
                        return `${base}
                    Return ONLY {"out": string} with a 80–160 word balanced summary and recommendation for "${title}". No placeholders.`;
                    default:
                        return `${base}\nReturn ONLY {"out": ""}.`;
                }
            }

            // small helpers
            const cleanList = (arr) => (arr || []).map(x => clean(x));
            const toListHtml = (arr) => cleanList(arr).map(x => `<li>${x}</li>`).join('');

            // build TOC
            const tocHtml = `<ol class="bl-toc">${(m.tocItems || []).map(i =>
                `<li><a href="${clean(i.href)}">${clean(i.label)}</a></li>`
            ).join('')}</ol>`;

            // lists
            const fastFactsHtml = toListHtml(m.fastFacts || []);
            const voicePromptsHtml = toListHtml(m.voicePrompts || []);

            // FAQ HTML + JSON-LD safety (template needs both)
            console.log(m.faqs, "m.faqs")
            // FAQ HTML + JSON-LD safety (template needs both)
            const faqHtml = (m.faqs || []).length > 0
                ? m.faqs.map(f => `
          <details>
            <summary><h3 class="bl-h3">${clean(f.question)}</h3></summary>
            <div><p>${clean(f.answer)}</p></div>
          </details>
        `).join('')
                : '<p>No FAQs available at this time.</p>';

            // wrap JSON-LD if needed (template expects raw <script> blocks via {…Json})
            const ensureScript = (s) => {
                if (!s) return '';
                const trimmed = String(s).trim();
                return trimmed.startsWith('<script') ? trimmed : `<script type="application/ld+json">${trimmed}</script>`;
            };

            const websiteJson = ensureScript(m.websiteJson);
            const breadcrumbJson = ensureScript(m.breadcrumbJson);
            const articleJson = ensureScript(m.articleJson);
            const faqJson = ensureScript(m.faqJson);

            // hero defaults

            // author links row
            const authorLinksHtml = (m.authorLinks || []).map(l =>
                `<a href="${clean(l.href)}"${l.rel ? ` rel="${clean(l.rel)}"` : ''}>${clean(l.label)}</a>`
            ).join(' · ');

            // dates
            const today = new Date().toISOString().split('T')[0];


            // hero defaults
            const heroSrc = m.heroImage || coverUrl || imagePool[0] || '';
            let heroSrcset = m.heroImageSrcset || '';
            const heroAlt = m.heroImageAlt || bestAlt(heroSrc || '', projectName, serviceType);

            // sanitize srcset: remove placeholders like "..." or anything non-URL-ish
            const validSrcset = /https?:\/\/\S+\s+\d+w(?:\s*,\s*https?:\/\/\S+\s+\d+w)*/i;
            if (!validSrcset.test(heroSrcset)) heroSrcset = ''; // will strip later
            // Use fastFacts to synthesize extra <article> blocks if too short
            const benefitsPad = toArticlesFromList(m.fastFacts, 'Benefit');
            // Only pad if we have fewer than 4 articles
            const currentCount = (String(m.benefitsHtml || '').match(/<article\b/gi) || []).length;
            if (currentCount < 4) {
                const pad = toArticlesFromList(model.fastFacts || [], 'Benefit').slice(0, 4 - currentCount);
                m.benefitsHtml = ensureMinArticles(m.benefitsHtml, 4, pad);
            }
            m.considerationsHtml = ensureMinArticles(m.considerationsHtml, 4, '');

            m.benefitsHtml = normalizeBenefitsHtml(m.benefitsHtml, title);
            const benefitCount = (m.benefitsHtml.match(/<article\b/gi) || []).length;
            const computedBenefitsTitle = `The Top ${benefitCount} Benefits of ${title}`;

             if (m.quickAnswer === '' || m.quickAnswer.trim().split(/\s+/).length < 15) {
                console.log("m.quickAnswer is empty, generating via OpenAI...");

                let prompt = `You are an expert content writer. Write a concise, informative answer (80-100 words) for the question below. Use a neutral and helpful tone.
                Question: ${title} `

                m.quickAnswer = await fetchStringFromOpenAI(prompt, label = "HowBlogQuickanswerPrompt", {
                    userId,
                    projectId,
                    pageId,
                    promptFrom: "BlogsQueue",
                    promptFor: "HowquickAnswer"
                });

                console.log(m.quickAnswer, "hi bro quickanswer")

            }
            // HEAD/meta + body placeholders map
            const map = {
                heroImage: clean(heroSrc),
                heroImageAlt: clean(heroAlt),
                heroImageSrcset: clean(heroSrcset),
                references: referencesHtmlWhat,

                title: clean(m.title || title),
                metaDescription: clean(m.metaDescription || `${projectName} ${serviceType}`),
                canonicalUrl: clean(m.canonicalUrl || `${domain}/what/${normDash(title)}`),
                ogTitle: clean(m.ogTitle || m.title || title),
                ogDescription: clean(m.ogDescription || m.metaDescription || ''),
                ogUrl: clean(m.ogUrl || m.canonicalUrl || `${domain}/what/${normDash(title)}`),
                ogImage: clean(m.ogImage || heroSrc),
                siteName: clean(m.siteName || projectName),
                twitterTitle: clean(m.twitterTitle || m.title || title),
                twitterDescription: clean(m.twitterDescription || m.metaDescription || ''),
                twitterImage: clean(m.twitterImage || m.ogImage || heroSrc),

                // JSON-LD blocks (raw script tags)
                websiteJson,
                breadcrumbJson,
                articleJson,
                faqJson,

                // hero + meta row
                eyebrow: clean(m.eyebrow || 'What/Why'),
                mainTitle: clean(m.mainTitle || m.title || title),

                reviewedBy: clean(m.reviewedBy || 'Staff Architect'),
                datePublished: clean(m.datePublished || today),
                dateHuman: clean(m.dateHuman || 'Updated ' + new Date().toLocaleDateString()),
                readTime: clean(m.readTime || '6–8 min read'),
                wordCount: clean(m.wordCount || '— words'),


                heroCaption: clean(m.heroCaption || heroAlt),

                // quick answer
                quickAnswer: clean(m.quickAnswer || m.metaDescription || ''),

                // sidebar minis
                fastFactsHtml,
                voicePromptsHtml,

                // toc + sections
                tocHtml,
                introHtml: m.introHtml || '',

                basicsTitle: clean(m.basicsTitle || (/^\s*what\s+is/i.test(m.mainTitle || m.title || title) ? `Understanding the Basics of ${(m.mainTitle || m.title || title).replace(/^\s*what\s+is\s+/i, '')}` : `Understanding the Basics of ${serviceType || (m.mainTitle || m.title || title)}`)),
                basicsHtml: m.basicsHtml || '',

                benefitsTitle: clean(m.benefitsTitle || computedBenefitsTitle),
                benefitsHtml: m.benefitsHtml || '',


                considerationsTitle: clean(m.considerationsTitle || 'Important Considerations & Potential Drawbacks'),
                considerationsHtml: m.considerationsHtml || '',

                faqTitle: 'Frequently Asked Questions',
                faqHtml,

                verdictTitle: clean(m.verdictTitle || 'The Verdict'),
                verdictText: clean(m.verdictText || ''),


                authorName: clean(WriterName),
                authorJobTitle: clean(WriterJobTitle),
                authorImage: clean(WriterImage),
                authorBio: clean(WriterBio || `${WriterName} writes about ${serviceType}.`),
                authorXUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinkedInUrl: clean(`https://linkedin.com/in/${normDash(WriterName)}`),
                authorPageUrl: clean(`${domain}/authors/${normDash(WriterName)}`),
                authorLinksHtml,
                authorSameAs,




                // author & reviewer box
                reviewerImage: clean(m.reviewerImage || `${domain}/authors/reviewer.png`),
                reviewedNote: clean(m.reviewedNote || `Checked for accuracy on ${new Date().toLocaleDateString()}`)
            };







            // fill template
            content_html = fillAllPlaceholders(template, map);
            // If srcset ended empty, remove the attribute entirely so browsers don't choke on it
            content_html = content_html.replace(/\s+srcset=""/g, '');

        }






        else {
            // Fallback for non-'best' templates
            let { title: aiTitle, content_html: rawHtml, used_links: usedLinks, used_images: usedImages, meta } = model;
            aiTitle = clean(aiTitle || title);
            if (!rawHtml || !clean(rawHtml)) throw new Error('Model did not return content_html.');
            content_html = rawHtml.replace(/\b(in|at|within|across)\s+in\b/gi, '$1 ').trim();
            content_html = withImgAttrs(content_html, projectName, serviceType);
        }

        // Enforce in-body anchors
        await step(70, 'Injecting internal links & fixing images');
        const allowedLinks = new Set(selectedLinks);
        const usedLinks = Array.isArray(model.usedLinks) ? model.usedLinks.map(clean).filter(u => allowedLinks.has(u)) : [];
        const minAnchors = Math.min(5, selectedLinks.length);
        const inj = ensureInBodyAnchors(content_html, selectedLinks, minAnchors, locationHints, serviceType);
        content_html = inj.html;
        let finalUsedLinks = Array.from(new Set([...usedLinks, ...inj.added]));
        if (finalUsedLinks.length < 3 && selectedLinks.length >= 3) {
            const extras = selectedLinks.filter(u => !finalUsedLinks.includes(u)).slice(0, 3 - finalUsedLinks.length);
            if (extras.length) {
                const list = extras.map(u => `<li><a href="${u}" rel="noopener noreferrer nofollow">${anchorTextFor(u, locationHints, serviceType)}</a></li>`).join('');
                // content_html += `<section><h2>Explore More Services</h2><ul>${list}</ul></section>`;
                finalUsedLinks.push(...extras);
            }
        }

        // Image attrs + cover/gallery fallback
        content_html = withImgAttrs(content_html, projectName, serviceType);
        if (coverUrl && !/img\s+[^>]*src=/i.test(content_html)) {
            const { w, h } = deriveSize(coverUrl);
            const alt = bestAlt(coverUrl, projectName, serviceType);
            const fig = `<figure><img src="${coverUrl}" alt="${alt}" width="${w}" height="${h}" style="max-width:800px;width:100%;height:auto;aspect-ratio:${(w / h).toFixed(3)}" loading="lazy" decoding="async"><figcaption>${alt}</figcaption></figure>`;
            content_html = `${fig}\n${content_html}`;
        }
        const imgSrcs = Array.from(content_html.matchAll(/<img\b[^>]*src=["']([^"']+)["']/gi)).map(m => clean(m[1]));
        const poolSet = new Set(imagePool);
        const usedImagesFinal = Array.from(new Set(imgSrcs.filter(u => poolSet.has(u))));

        // SEO meta
        const metaTitle = clean(model.meta?.title || title).slice(0, 60);
        const metaDescription = clean(model.meta?.description || model.metaDescription || `${projectName} ${serviceType}`).slice(0, 160);
        let keywords = Array.isArray(model.meta?.keywords) ? model.meta.keywords : [];
        keywords = Array.from(new Set(keywords.map(clean).filter(Boolean)));

        // Idempotent upsert
        await step(85, 'Saving blog');
        const normTitle = clean(title);
        const existing = await Blog.findOne({ projectId, title: normTitle, type: styleText }).lean();
        const stripHtml = (h) => String(h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const information = clean(model.metaDescription || stripHtml(content_html)).slice(0, 200);
        const coverImageObj = coverUrl ? { url: coverUrl, alt: bestAlt(coverUrl, projectName, serviceType) } : undefined;

        const payload = {
            userId,
            projectId,
            title: normTitle,
            slug:slug,
            information,
            content: content_html,
            status: Number(status),
            isSchedule: isSchedule,
            scheduleTime: scheduleTime ,
            type: styleText,
            coverImage: coverImageObj,
            seoMeta: { metaTitle, metaDescription, keywords },

            // 👇 THIS FIXES THE VALIDATION ERROR
            authorId: author._id,                          // <– REQUIRED by your schema
            authorName: clean(authorName || 'John Doe')    // optional but nice to store
        };

        let saved;
        if (existing) {
            saved = await Blog.findByIdAndUpdate(existing._id, { $set: payload }, { new: true });
        } else {
            const doc = new Blog(payload);
            saved = await doc.save();
        }



         try {
                            await axios.post(
                                'https://apis.smartlybuild.dev/admin/v1/updateHostingSitemap',
                                { projectId }, // JSON body
                                {
        
                                    timeout: 10000
                                }
                            );
                        } catch (e) {
                            console.warn('[create_blog] sitemap update call failed:', e?.response?.data || e.message);
                        }


        // Extra guard + richer logs to verify persistence and filters
        if (!saved || !saved._id) {
            throw new Error('Blog save returned no document.');
        }

        // Log what got written so you can verify UI filters
        console.log('[aiblogsQueue:%s] Saved blog -> id=%s type=%s status=%s title=%s',
            job.id, String(saved._id), saved.type, saved.status, saved.title);

        // If your UI only shows published, consider defaulting HOW to status=1:
        if (![0, 1, 2].includes(Number(status)) && styleText === 'how' && saved.status === 0) {
            console.warn('[aiblogsQueue:%s] HOW blog saved with status=0; UI may hide drafts.', job.id);
        }


        await step(100, 'Done');
        return {
            ok: true,
            blogId: saved?._id,
            title: normTitle
        };
    }

    catch (err) {
        console.error(`[aiblogsQueue:${job.id}] Job ${job.id} failed:`, err);
        throw err;
    }

});

module.exports = aiblogsQueue;