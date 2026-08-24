// controllers/DomainController.js
const dns = require('dns').promises;
const crypto = require('crypto');
const mongoose = require('mongoose');

const Domain = require('../models/domains');

// === YOUR FIXED TARGETS ===
const OUR_IPS = (process.env.OUR_HOSTING_IPS || '82.25.110.201')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const OUR_NAMESERVERS = (process.env.OUR_NAMESERVERS || 'ns1.dns-parking.com,ns2.dns-parking.com')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

/** normalize: strip protocol, path, www → apex, lowercase */
function normalizeHost(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let s = raw.trim().toLowerCase();
  s = s.replace(/^(https?:\/\/|ftp:\/\/)/i, '');
  s = s.replace(/\/.*$/, '');
  s = s.replace(/:\d+$/, '');
  s = s.replace(/\.$/, '');
  s = s.replace(/^www\./, '');
  if (!s || !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i.test(s)) {
    return null;
  }
  return s;
}

function buildVerificationOptions(domain, dnsToken) {
  const ip = OUR_IPS[0] || '0.0.0.0';
  return {
    nameservers: [...OUR_NAMESERVERS],
    a_records: [
      { type: 'A', host: '@', value: ip, ttl: 300 },
      { type: 'A', host: 'www', value: ip, ttl: 300 },
    ],
    dns_txt: {
      recommended_host: `_hosting-verify.${domain}`,
      fallback_host: domain,
      type: 'TXT',
      value: dnsToken || '',
      ttl: 300,
    },
  };
}

function statusLabel(status) {
  switch (status) {
    case 'verified':
      return 'Verified (TXT)';
    case 'connected_to_our_server':
      return 'Connected (NS/IP)';
    case 'verification_failed':
      return 'Failed';
    case 'inactive':
      return 'Inactive';
    default:
      return 'Pending';
  }
}

function toClientRow(doc) {
  const details = doc.verificationDetails || {};
  const dnsToken = details.dnsToken || null;
  const row = {
    ok: doc.status === 'verified' || doc.status === 'connected_to_our_server',
    id: String(doc._id),
    domain: doc.domain,
    status: doc.status || 'pending',
    statusLabel: statusLabel(doc.status),
    method: doc.verificationMethod || null,
    lastVerifiedAt: doc.lastVerifiedAt || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    projectId: doc.projectId ? String(doc.projectId) : null,
    dnsToken,
    message: details.lastMessage || details.message || null,
    verificationDetails: {
      dnsToken,
      matchedBy: details.matchedBy || null,
      resolvedIps: details.resolvedIps || null,
      ns: details.ns || null,
    },
  };

  if (doc.status === 'pending' || doc.status === 'verification_failed') {
    row.verification_options = buildVerificationOptions(doc.domain, dnsToken);
    if (dnsToken) {
      row.instructions = {
        type: 'TXT',
        recommended_host: `_hosting-verify.${doc.domain}`,
        fallback_host: doc.domain,
        value: dnsToken,
        ttl: 300,
      };
    }
  }

  return row;
}

async function resolveAandAAAA(host) {
  const ips = [];
  try {
    ips.push(...(await dns.resolve4(host)));
  } catch (_) {}
  try {
    ips.push(...(await dns.resolve6(host)));
  } catch (_) {}
  // also check www for apex domains
  try {
    ips.push(...(await dns.resolve4(`www.${host}`)));
  } catch (_) {}
  return Array.from(new Set(ips));
}

async function resolveNS(host) {
  try {
    return (await dns.resolveNs(host)).map((s) => s.toLowerCase());
  } catch (_) {
    return [];
  }
}

async function resolveTxt(host) {
  try {
    return await dns.resolveTxt(host);
  } catch (_) {
    return [];
  }
}

function txtHostsFor(host) {
  const out = new Set();
  out.add(`_hosting-verify.${host}`);
  out.add(host);
  out.add(`_hosting-verify.www.${host}`);
  out.add(`www.${host}`);
  return Array.from(out);
}

function newDnsToken() {
  return `hosting-verify-${crypto.randomBytes(10).toString('hex')}`;
}

async function ensureDnsToken(doc) {
  const details = doc.verificationDetails || {};
  if (details.dnsToken) return details.dnsToken;
  const token = newDnsToken();
  await Domain.updateOne(
    { _id: doc._id },
    {
      $set: {
        verificationMethod: 'dns-txt',
        status: doc.status === 'verified' || doc.status === 'connected_to_our_server' ? doc.status : 'pending',
        'verificationDetails.dnsToken': token,
        'verificationDetails.issuedAt': new Date(),
        'verificationDetails.method': 'dns-txt',
      },
      $unset: { 'verificationDetails.txtRecords': '' },
    }
  );
  return token;
}

async function verifySingle(doc) {
  const host = doc.domain;

  // Already verified — still refresh lastVerifiedAt lightly without forcing re-DNS every time
  // Callers that want force can pass; for now re-check NS/IP always for pending only.
  if (doc.status === 'verified' && doc.verificationMethod === 'dns-txt') {
    return {
      ...toClientRow(doc),
      ok: true,
      skipped: ['nameserver_or_ip'],
      message: 'Already verified via DNS-TXT.',
    };
  }
  if (doc.status === 'connected_to_our_server' && doc.verificationMethod === 'nameserver_or_ip') {
    return {
      ...toClientRow(doc),
      ok: true,
      skipped: ['dns-txt'],
      message: 'Already connected via nameservers or A record.',
    };
  }

  // 1) Nameserver / IP
  const [ips, ns] = await Promise.all([resolveAandAAAA(host), resolveNS(host)]);
  const ipMatch = ips.some((ip) => OUR_IPS.includes(ip));
  const nsMatch = ns.some((n) => OUR_NAMESERVERS.includes(String(n).replace(/\.$/, '')));

  if (ipMatch || nsMatch) {
    await Domain.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: 'connected_to_our_server',
          verificationMethod: 'nameserver_or_ip',
          'verificationDetails.checkedAt': new Date(),
          'verificationDetails.resolvedIps': ips,
          'verificationDetails.ns': ns,
          'verificationDetails.matchedBy': ipMatch ? 'ip' : 'ns',
          'verificationDetails.lastMessage': ipMatch
            ? 'A record points to our server IP.'
            : 'Nameservers match our NS.',
          lastVerifiedAt: new Date(),
        },
      }
    );
    const latest = await Domain.findById(doc._id).lean();
    return {
      ...toClientRow(latest),
      ok: true,
      details: { ips, ns, matchedBy: ipMatch ? 'ip' : 'ns' },
      message: ipMatch
        ? 'Connected: A record points to our IP.'
        : 'Connected: nameservers point to us.',
    };
  }

  // 2) DNS-TXT
  const token = await ensureDnsToken(doc);
  const fresh = await Domain.findById(doc._id).lean();
  const candidates = txtHostsFor(host);

  for (const h of candidates) {
    const txts = await resolveTxt(h);
    const flat = txts.flat().map((x) => String(x).trim());
    if (flat.includes(token)) {
      await Domain.updateOne(
        { _id: doc._id },
        {
          $set: {
            status: 'verified',
            verificationMethod: 'dns-txt',
            'verificationDetails.checkedAt': new Date(),
            'verificationDetails.txtRecords': flat,
            'verificationDetails.lastMessage': 'TXT ownership record found.',
            lastVerifiedAt: new Date(),
          },
        }
      );
      const latest = await Domain.findById(doc._id).lean();
      return {
        ...toClientRow(latest),
        ok: true,
        usedDnsToken: token,
        message: 'Verified via DNS-TXT ownership record.',
      };
    }
  }

  await Domain.updateOne(
    { _id: doc._id },
    {
      $set: {
        status: 'pending',
        verificationMethod: 'dns-txt',
        'verificationDetails.lastMessage':
          'Not verified yet. Point NS/A to us, or add the TXT record, then click Verify again (DNS can take a few minutes).',
        lastVerifiedAt: new Date(),
      },
    }
  );

  const pendingDoc = await Domain.findById(doc._id).lean();
  return {
    ...toClientRow(pendingDoc),
    ok: false,
    message:
      'Not verified yet. Use Nameservers, A record, or DNS-TXT, wait for DNS, then click Verify.',
    checkedHosts: candidates,
    dnsToken: token,
  };
}

module.exports = {
  addDomain: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const { domainName, projectId } = req.body;
      if (!domainName) {
        return res.status(400).json({
          ok: false,
          error: 'Enter a domain name (e.g. example.com).',
        });
      }

      const domain = normalizeHost(domainName);
      if (!domain) {
        return res.status(400).json({
          ok: false,
          error:
            'Invalid domain. Use a name like example.com (no http://, no path). www is optional — we store the apex.',
        });
      }

      const now = new Date();
      const userOid = new mongoose.Types.ObjectId(userId);

      let doc = await Domain.findOne({ userId: userOid, domain });

      // Also catch legacy www. duplicate for this user
      if (!doc) {
        doc = await Domain.findOne({ userId: userOid, domain: `www.${domain}` });
        if (doc) {
          doc.domain = domain;
          await doc.save();
        }
      }

      let token;
      if (!doc) {
        token = newDnsToken();
        const createData = {
          domain,
          userId: userOid,
          status: 'pending',
          verificationMethod: 'dns-txt',
          verificationDetails: {
            dnsToken: token,
            issuedAt: now,
            method: 'dns-txt',
            lastMessage: 'Domain added. Complete one verification method, then click Verify.',
          },
        };
        if (projectId && mongoose.Types.ObjectId.isValid(projectId)) {
          createData.projectId = new mongoose.Types.ObjectId(projectId);
        }
        doc = await Domain.create(createData);
      } else {
        token = await ensureDnsToken(doc);
        doc = await Domain.findById(doc._id);
      }

      const options = buildVerificationOptions(domain, token);
      const lean = doc.toObject ? doc.toObject() : doc;

      return res.status(doc.createdAt && Date.now() - new Date(doc.createdAt).getTime() < 5000 ? 201 : 200).json({
        ok: true,
        message: 'Domain ready. Pick any verification method below, then click Verify.',
        domain: lean,
        verification_options: options,
        result: toClientRow({ ...lean, verificationDetails: { ...(lean.verificationDetails || {}), dnsToken: token } }),
      });
    } catch (err) {
      if (err?.code === 11000) {
        return res.status(409).json({
          ok: false,
          error: 'This domain is already in your account.',
        });
      }
      console.error('addDomain error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  },

  removeDomain: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const userOid = new mongoose.Types.ObjectId(userId);
      const id = req.params?.id || req.body?.id || null;

      if (id && mongoose.Types.ObjectId.isValid(id)) {
        const removed = await Domain.findOneAndDelete({ _id: id, userId: userOid });
        if (!removed) return res.status(404).json({ ok: false, error: 'Domain not found.' });
        return res.status(200).json({ ok: true, message: 'Domain removed', domain: removed });
      }

      const domainName = req.body?.domainName || req.query?.domainName;
      if (!domainName) {
        return res.status(400).json({ ok: false, error: 'Provide domainName or id.' });
      }

      const domain = normalizeHost(domainName);
      if (!domain) return res.status(400).json({ ok: false, error: 'Invalid domainName' });

      let removed = await Domain.findOneAndDelete({ userId: userOid, domain });
      if (!removed) {
        removed = await Domain.findOneAndDelete({ userId: userOid, domain: `www.${domain}` });
      }
      if (!removed) {
        return res.status(404).json({
          ok: false,
          error: 'Domain not found. It may already be removed.',
        });
      }

      return res.status(200).json({ ok: true, message: 'Domain removed', domain: removed });
    } catch (err) {
      console.error('removeDomain error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  },

  /**
   * Fast list (no live DNS). Use for Domains page + deploy pickers.
   * Query: page, limit, full=1 for rich rows.
   * Always returns `domains: string[]` for backward compatibility.
   */
  listDomains: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const page = Math.max(1, parseInt(req.query.page ?? req.body?.page ?? 1, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? req.body?.limit ?? 50, 10) || 50));
      const skip = (page - 1) * limit;

      const filter = { userId: new mongoose.Types.ObjectId(userId) };
      const total = await Domain.countDocuments(filter);
      const pages = Math.max(1, Math.ceil(total / limit));

      const docs = await Domain.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const enriched = [];
      for (const doc of docs) {
        if (
          (doc.status === 'pending' || doc.status === 'verification_failed') &&
          !doc.verificationDetails?.dnsToken
        ) {
          const token = await ensureDnsToken(doc);
          doc.verificationDetails = {
            ...(doc.verificationDetails || {}),
            dnsToken: token,
          };
        }
        enriched.push(doc);
      }

      const domains = enriched.map((d) => d.domain).filter(Boolean);

      // Attach which project currently uses each domain (for Deploy UI warnings)
      const UserProject = require('../models/userProjects');
      const ProjectDeployment = require('../models/ProjectDeployment');
      const usageByDomain = {};

      const projects = await UserProject.find({
        userId: new mongoose.Types.ObjectId(userId),
        domainName: { $in: [...domains, ...domains.map((d) => `www.${d}`)] },
      })
        .select('_id projectName domainName')
        .lean();

      for (const p of projects) {
        const key = String(p.domainName || '')
          .toLowerCase()
          .replace(/^www\./, '');
        if (!key) continue;
        usageByDomain[key] = {
          projectId: String(p._id),
          projectName: p.projectName || 'Project',
          source: 'project',
        };
      }

      const deps = await ProjectDeployment.find({
        domainName: { $in: [...domains, ...domains.map((d) => `www.${d}`)] },
      })
        .populate('projectId', 'projectName userId')
        .lean();

      for (const dep of deps) {
        const key = String(dep.domainName || '')
          .toLowerCase()
          .replace(/^www\./, '');
        if (!key || usageByDomain[key]) continue;
        const ownerId = String(dep.projectId?.userId || '');
        if (ownerId && ownerId !== String(userId)) continue;
        usageByDomain[key] = {
          projectId: String(dep.projectId?._id || dep.projectId || ''),
          projectName: dep.projectId?.projectName || 'Project',
          source: 'deployment',
        };
      }

      const results = enriched.map((doc) => {
        const row = toClientRow(doc);
        const used = usageByDomain[doc.domain];
        if (used) {
          row.usedBy = used;
        }
        return row;
      });

      return res.status(200).json({
        ok: true,
        domains,
        results,
        page,
        limit,
        total,
        pages,
      });
    } catch (err) {
      console.error('listDomains error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  },

  verifyDomain: async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return res.status(401).json({ ok: false, error: 'Unauthorized' });

      const pageRaw = req.query.page ?? req.body?.page ?? 1;
      const limitRaw = req.query.limit ?? req.body?.limit ?? 10;
      const page = Math.max(1, parseInt(pageRaw, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 10));
      const skip = (page - 1) * limit;
      const force = String(req.query.force || req.body?.force || '') === '1';

      const baseFilter = { userId: new mongoose.Types.ObjectId(userId) };

      // Single domain
      if (req.params?.id || req.body?.domainName || req.query?.domainName) {
        const lookName = normalizeHost(String(req.body?.domainName || req.query?.domainName || ''));
        let one;
        if (req.params?.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
          one = await Domain.findOne({ _id: req.params.id, ...baseFilter }).lean();
        } else if (lookName) {
          one = await Domain.findOne({ ...baseFilter, domain: lookName }).lean();
          if (!one) {
            one = await Domain.findOne({ ...baseFilter, domain: `www.${lookName}` }).lean();
          }
        } else {
          return res.status(400).json({ ok: false, error: 'Invalid domainName' });
        }
        if (!one) return res.status(404).json({ ok: false, error: 'Domain not found' });

        // Force re-check: temporarily clear "already verified" short-circuit
        if (force && (one.status === 'verified' || one.status === 'connected_to_our_server')) {
          one = { ...one, status: 'pending', verificationMethod: null };
        }

        const result = await verifySingle(one);
        return res.status(200).json({ ok: true, page: 1, limit: 1, total: 1, pages: 1, results: [result] });
      }

      const total = await Domain.countDocuments(baseFilter);
      const pages = Math.max(1, Math.ceil(total / limit));
      const docs = await Domain.find(baseFilter).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean();

      if (docs.length === 0) {
        return res.status(200).json({ ok: true, page, limit, total, pages, results: [] });
      }

      const results = await Promise.all(docs.map((d) => verifySingle(d)));
      return res.status(200).json({ ok: true, page, limit, total, pages, results });
    } catch (err) {
      console.error('verifyDomain error', err);
      return res.status(500).json({ ok: false, error: err.message || String(err) });
    }
  },
};
