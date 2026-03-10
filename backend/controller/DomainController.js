// controllers/domainController.js
const dns = require('dns').promises;
const crypto = require('crypto');
const mongoose = require('mongoose');

const Domain = require('../models/domains'); // adjust path if needed

// === YOUR FIXED TARGETS ===
// NOTE: put your real infra IPs and NS here
const OUR_IPS = ['82.25.110.201'];
const OUR_NAMESERVERS = ['ns1.dns-parking.com', 'ns2.dns-parking.com'];

/** normalize: strip protocol, trailing slash, to-lower */
function normalizeHost(raw) {
    if (!raw || typeof raw !== 'string') return null;
    let s = raw.trim().toLowerCase();
    s = s.replace(/(^\w+:|^)\/\//, '');
    s = s.replace(/\/+$/, '');
    return s || null;
}

// --- DNS helpers ---
async function resolveAandAAAA(host) {
    const ips = [];
    try { ips.push(...await dns.resolve4(host)); } catch (_) { }
    try { ips.push(...await dns.resolve6(host)); } catch (_) { }
    return Array.from(new Set(ips));
}
async function resolveNS(host) {
    try { return (await dns.resolveNs(host)).map(s => s.toLowerCase()); } catch (_) { return []; }
}
async function resolveTxt(host) {
    try { return await dns.resolveTxt(host); } catch (_) { return []; }
}

// TXT candidate hosts for a stored domain
function txtHostsFor(host) {
    const out = new Set();
    out.add(`_hosting-verify.${host}`);
    out.add(host);
    const m = host.match(/^www\.(.+)$/);
    if (m && m[1]) {
        const apex = m[1];
        out.add(`_hosting-verify.${apex}`);
        out.add(apex);
    }
    return Array.from(out);
}

module.exports = {
    // ---------------------------
    // 1) ADD DOMAIN (projectId optional)
    //    - Always return verification options: NS, A records, DNS-TXT (no expiry)
    //    - Reuse existing dnsToken if present; else create one
    // ---------------------------
    addDomain: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

            const { domainName, projectId } = req.body;
            if (!domainName) return res.status(400).json({ ok: false, error: 'domainName is required' });

            const domain = normalizeHost(domainName);
            if (!domain) return res.status(400).json({ ok: false, error: 'Invalid domainName' });

            const now = new Date();

            // Find existing doc (projectId optional)
            const findFilter = { userId: new mongoose.Types.ObjectId(userId), domain };
            if (projectId) {
                try { findFilter.projectId = new mongoose.Types.ObjectId(projectId); }
                catch { return res.status(400).json({ ok: false, error: 'Invalid projectId' }); }
            }

            let doc = await Domain.findOne(findFilter);

            // ensure we have a token; reuse if exists
            const ensureToken = async (existingDoc) => {
                const d = existingDoc?.verificationDetails || {};
                if (d.dnsToken) return { token: d.dnsToken, reused: true };
                const token = `hosting-verify-${crypto.randomBytes(10).toString('hex')}`;
                if (existingDoc) {
                    await Domain.updateOne({ _id: existingDoc._id }, {
                        $set: {
                            verificationMethod: 'dns-txt',
                            status: 'pending',
                            'verificationDetails.dnsToken': token,
                            'verificationDetails.issuedAt': now,
                            'verificationDetails.method': 'dns-txt',
                            updatedAt: now
                        },
                        $unset: { 'verificationDetails.txtRecords': "" } // clear stale observed TXT
                    });
                }
                return { token, reused: false };
            };

            if (!doc) {
                // Create fresh doc with a new token
                const token = `hosting-verify-${crypto.randomBytes(10).toString('hex')}`;
                const createData = {
                    domain,
                    userId: new mongoose.Types.ObjectId(userId),
                    status: 'pending',
                    verificationMethod: 'dns-txt',
                    verificationDetails: {
                        dnsToken: token,
                        issuedAt: now,
                        method: 'dns-txt'
                    },
                    updatedAt: now,
                    createdAt: now
                };
                if (projectId) createData.projectId = new mongoose.Types.ObjectId(projectId);

                doc = await Domain.create(createData);

                return res.status(201).json({
                    ok: true,
                    message: 'Domain added (pending). Use any method to verify.',
                    domain: doc,
                    verification_options: {
                        nameservers: OUR_NAMESERVERS,
                        a_records: [
                            { type: 'A', host: '@', value: OUR_IPS[0], ttl: 300 },
                            { type: 'A', host: 'www', value: OUR_IPS[0], ttl: 300 }
                        ],
                        dns_txt: {
                            recommended_host: `_hosting-verify.${domain}`,
                            fallback_host: domain,
                            type: 'TXT',
                            value: token,
                            ttl: 300
                        }
                    }
                });
            }

            // Existing doc → reuse or set token
            const { token } = await ensureToken(doc);
            const latest = await Domain.findById(doc._id).lean();

            return res.status(200).json({
                ok: true,
                message: 'Domain already exists. Use any method to verify.',
                domain: latest,
                verification_options: {
                    nameservers: OUR_NAMESERVERS,
                    a_records: [
                        { type: 'A', host: '@', value: OUR_IPS[0], ttl: 300 },
                        { type: 'A', host: 'www', value: OUR_IPS[0], ttl: 300 }
                    ],
                    dns_txt: {
                        recommended_host: `_hosting-verify.${domain}`,
                        fallback_host: domain,
                        type: 'TXT',
                        value: token,
                        ttl: 300
                    }
                }
            });
        } catch (err) {
            console.error('addDomain error', err);
            return res.status(500).json({ ok: false, error: err.message || String(err) });
        }
    },

    // ---------------------------
    // 2) REMOVE DOMAIN (by :id OR by domainName in body/query)
    // ---------------------------
    removeDomain: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

            // Prefer :id if present
            const id = req.params?.id || null;
            if (id) {
                const removed = await Domain.findOneAndDelete({
                    _id: new mongoose.Types.ObjectId(id),
                    userId: new mongoose.Types.ObjectId(userId),
                });
                if (!removed) return res.status(404).json({ ok: false, error: 'Domain not found' });
                return res.status(200).json({ ok: true, message: 'Domain removed', domain: removed });
            }

            // Accept domainName via body or query (some proxies strip DELETE bodies)
            const domainName = req.body?.domainName || req.query?.domainName;
            if (!domainName) return res.status(400).json({ ok: false, error: 'Provide domainName or use /domains/:id' });

            const domain = normalizeHost(domainName);
            if (!domain) return res.status(400).json({ ok: false, error: 'Invalid domainName' });

            const base = { userId: new mongoose.Types.ObjectId(userId) };

            // Try exact match first
            let removed = await Domain.findOneAndDelete({ ...base, domain });

            // If not found, try the www/apex counterpart to be forgiving
            if (!removed) {
                const alt = domain.startsWith('www.') ? domain.replace(/^www\./, '') : `www.${domain}`;
                removed = await Domain.findOneAndDelete({ ...base, domain: alt });
            }

            if (!removed) {
                return res.status(404).json({
                    ok: false,
                    error: 'Domain not found for this user. It may have already been removed or you are viewing a different account.'
                });
            }

            return res.status(200).json({ ok: true, message: 'Domain removed', domain: removed });
        } catch (err) {
            console.error('removeDomain error', err);
            return res.status(500).json({ ok: false, error: err.message || String(err) });
        }
    },

    listDomains: async (req, res) => {

        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

            const docs = await Domain.find(
                { userId: new mongoose.Types.ObjectId(userId) },
                { _id: 0, domain: 1 } // projection: only "domain"
            ).lean();

            const domains = (docs || []).map(d => d.domain).filter(Boolean);

            return res.status(200).json({ ok: true, domains });
        } catch (err) {
            console.error('listdomains error', err);
            return res.status(500).json({ ok: false, error: err.message || String(err) });
        }
    }
    ,
    // ---------------------------
    // 3) VERIFY DOMAIN (paginated)
    //    - Query/body: ?page=&limit= (query wins), defaults 1/10
    //    - Verifies only that page (fast)
    //    - If domainName or :id provided -> verify only that domain (bypass pagination)
    // ---------------------------
    verifyDomain: async (req, res) => {
        try {
            const userId = req.user?.userId;
            if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

            // Pagination input
            const pageRaw = (req.query.page ?? req.body?.page ?? 1);
            const limitRaw = (req.query.limit ?? req.body?.limit ?? 10);
            const page = Math.max(1, parseInt(pageRaw, 10) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 10));
            const skip = (page - 1) * limit;

            async function verifySingle(doc) {
                const host = doc.domain;

                // 0) Skip when already verified by one method
                if (doc.status === 'verified' && doc.verificationMethod === 'dns-txt') {
                    return { ok: true, domain: host, status: 'verified', method: 'dns-txt', skipped: ['nameserver_or_ip'], lastVerifiedAt: doc.lastVerifiedAt };
                }
                if (doc.status === 'connected_to_our_server' && doc.verificationMethod === 'nameserver_or_ip') {
                    return { ok: true, domain: host, status: 'connected_to_our_server', method: 'nameserver_or_ip', skipped: ['dns-txt'], lastVerifiedAt: doc.lastVerifiedAt };
                }

                // 1) Try nameserver/ip first
                const [ips, ns] = await Promise.all([resolveAandAAAA(host), resolveNS(host)]);
                const ipMatch = ips.some(ip => OUR_IPS.includes(ip));
                const nsMatch = ns.some(n => OUR_NAMESERVERS.includes(n));

                if (ipMatch || nsMatch) {
                    await Domain.updateOne({ _id: doc._id }, {
                        $set: {
                            status: 'connected_to_our_server',
                            verificationMethod: 'nameserver_or_ip',
                            'verificationDetails.checkedAt': new Date(),
                            'verificationDetails.resolvedIps': ips,
                            'verificationDetails.ns': ns,
                            'verificationDetails.matchedBy': ipMatch ? 'ip' : 'ns',
                            lastVerifiedAt: new Date()
                        },
                        $unset: {
                            // remove TXT artefacts when connecting by IP/NS
                            'verificationDetails.dnsToken': "",
                            'verificationDetails.txtRecords': ""
                        }
                    });
                    return {
                        ok: true,
                        domain: host,
                        status: 'connected_to_our_server',
                        method: 'nameserver_or_ip',
                        details: { ips, ns, matchedBy: ipMatch ? 'ip' : 'ns' }
                    };
                }

                // 2) DNS-TXT route (no expiry)
                const details = doc.verificationDetails || {};
                const hasToken = !!details.dnsToken;

                // Issue token if missing
                if (!hasToken) {
                    const token = `hosting-verify-${crypto.randomBytes(10).toString('hex')}`;
                    await Domain.updateOne({ _id: doc._id }, {
                        $set: {
                            verificationMethod: 'dns-txt',
                            status: 'pending',
                            'verificationDetails.dnsToken': token,
                            'verificationDetails.issuedAt': new Date(),
                            'verificationDetails.method': 'dns-txt',
                            lastVerifiedAt: new Date()
                        },
                        $unset: {
                            'verificationDetails.txtRecords': ""
                        }
                    });

                    const candidates = txtHostsFor(host);
                    return {
                        ok: true,
                        domain: host,
                        status: 'pending',
                        method: 'dns-txt',
                        action: 'create-dns-txt',
                        dnsToken: token,
                        instructions: {
                            type: 'TXT',
                            recommended_host: candidates.find(h => h.startsWith('_hosting-verify.')) || `_hosting-verify.${host}`,
                            fallback_host: host,
                            value: token,
                            ttl: 300
                        }
                    };
                }

                // Token exists → look it up
                const token = details.dnsToken;
                const candidates = txtHostsFor(host);
                for (const h of candidates) {
                    const txts = await resolveTxt(h);
                    const flat = txts.flat().map(x => x.trim());
                    if (flat.includes(token)) {
                        await Domain.updateOne({ _id: doc._id }, {
                            $set: {
                                status: 'verified',
                                verificationMethod: 'dns-txt',
                                'verificationDetails.checkedAt': new Date(),
                                'verificationDetails.txtRecords': flat,
                                lastVerifiedAt: new Date()
                            },
                            $unset: {
                                'verificationDetails.dnsToken': ""
                            }
                        });
                        return { ok: true, domain: host, status: 'verified', method: 'dns-txt', usedDnsToken: token };
                    }
                }

                // Not found yet → still pending; return token so UI can copy
                return {
                    ok: false,
                    domain: host,
                    status: 'pending',
                    method: 'dns-txt',
                    message: 'TXT token not found yet. Add the TXT record and retry after propagation.',
                    checkedHosts: candidates,
                    dnsToken: token
                };
            }

            const baseFilter = { userId: new mongoose.Types.ObjectId(userId) };

            // If verifying a single domain, bypass pagination
            if (req.params?.id || req.body?.domainName || req.query?.domainName) {
                const lookName = normalizeHost(String(req.body?.domainName || req.query?.domainName || ''));
                let one;
                if (req.params?.id) {
                    one = await Domain.findOne({ _id: new mongoose.Types.ObjectId(req.params.id), ...baseFilter }).lean();
                } else if (lookName) {
                    one = await Domain.findOne({ ...baseFilter, domain: lookName }).lean();
                    // be forgiving with www/apex variant
                    if (!one) {
                        const alt = lookName.startsWith('www.') ? lookName.replace(/^www\./, '') : `www.${lookName}`;
                        one = await Domain.findOne({ ...baseFilter, domain: alt }).lean();
                    }
                } else {
                    return res.status(400).json({ ok: false, error: 'Invalid domainName' });
                }
                if (!one) return res.status(404).json({ ok: false, error: 'Domain not found' });
                const result = await verifySingle(one);
                return res.status(200).json({ ok: true, page: 1, limit: 1, total: 1, pages: 1, results: [result] });
            }

            // Bulk paginated
            const total = await Domain.countDocuments(baseFilter);
            const pages = Math.max(1, Math.ceil(total / limit));

            const docs = await Domain.find(baseFilter)
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            if (docs.length === 0) {
                return res.status(200).json({ ok: true, page, limit, total, pages, results: [] });
            }

            const results = await Promise.all(docs.map(verifySingle));
            return res.status(200).json({ ok: true, page, limit, total, pages, results });

        } catch (err) {
            console.error('verifyDomain error', err);
            return res.status(500).json({ ok: false, error: err.message || String(err) });
        }
    }
};
