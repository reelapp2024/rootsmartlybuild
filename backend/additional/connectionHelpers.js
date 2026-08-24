const SftpClient = require('ssh2-sftp-client');
const ftp = require('basic-ftp');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data'); // ✅ Must be this package


/** Strip protocol / path / whitespace from hostnames users often paste. */
function sanitizeHost(host) {
  return String(host || '')
    .trim()
    .replace(/^(ftp|ftps|sftp|http|https):\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '') // port handled separately
    .trim();
}

function friendlyConnectionError(kind, host, port, err) {
  const msg = String(err?.message || err || '');
  const h = host || 'host';
  const p = port != null ? String(port) : '';

  if (/ENOTFOUND|getaddrinfo/i.test(msg)) {
    return (
      `${kind} host not found (${h}). ` +
      `Tip: use the exact hostname from your host panel (often ftp.yourdomain.com or the server IP) — not the website URL.`
    );
  }
  if (/ETIMEDOUT|ECONNREFUSED|Timed out|handshake/i.test(msg)) {
    return (
      `${kind} could not reach ${h}${p ? `:${p}` : ''}. ` +
      `Tip: check host, port, firewall, and whether FTPS/SSH is enabled. Ask your host to whitelist this server IP if needed.`
    );
  }
  if (/530|login|auth|password|credential|permission denied|All configured authentication methods failed/i.test(msg)) {
    return (
      `${kind} login failed for ${h}. ` +
      `Tip: double-check username and password (or API token / SSH key). cPanel FTP users are often full emails like user@domain.com.`
    );
  }
  if (/certificate|SSL|TLS|secure/i.test(msg)) {
    return (
      `${kind} secure connection failed for ${h}. ` +
      `Tip: try toggling FTPS (secure) on/off, or use the host/IP your panel lists for FTP.`
    );
  }
  return `${kind} connection failed: ${msg}`;
}

/** Build SFTP connect options from stored hosting config (password and/or private key). */
function buildSshConnectOptions(config) {
  if (!config?.host || !config?.username) {
    throw new Error('SSH/SFTP requires host and username');
  }
  const opts = {
    host: sanitizeHost(config.host),
    port: Number(config.port) || 22,
    username: String(config.username).trim(),
    readyTimeout: 12000,
  };
  if (!opts.host) {
    throw new Error('SSH/SFTP requires a valid host or IP');
  }
  const privateKey = (config.privateKey || '').trim();
  if (privateKey) {
    opts.privateKey = privateKey;
    if (config.passphrase) opts.passphrase = config.passphrase;
  } else if (config.password) {
    opts.password = config.password;
  } else {
    throw new Error('SSH/SFTP requires a password or private key');
  }
  return opts;
}

/**
 * Normalize cPanel config: accept host/domain and build testUrl when missing.
 */
function normalizeCpanelConfig(config) {
  const next = { ...(config || {}) };
  const username = (next.username || next.cpanelUsername || '').trim();
  const token = (next.token || next.cpanelToken || '').trim();
  let host = sanitizeHost(next.host || next.cpanelDomain || next.domain || '');
  let testUrl = (next.testUrl || '').trim();

  if (!host && testUrl) {
    try {
      host = sanitizeHost(new URL(testUrl).hostname);
    } catch {
      /* ignore */
    }
  }
  if (!testUrl && host) {
    testUrl = `https://${host}:2083/execute/Version/get`;
  }

  next.username = username;
  next.token = token;
  next.host = host;
  next.cpanelDomain = host;
  next.testUrl = testUrl;
  return next;
}

/**
 * Test FTP connection
 */
async function testFTPConnection(config) {
  if (!config?.host || !config?.username || !config?.password) {
    throw new Error('FTP requires host, username, and password');
  }

  const host = sanitizeHost(config.host);
  const port = Number(config.port) || 21;
  if (!host) {
    throw new Error('FTP requires a valid host (e.g. ftp.yourdomain.com)');
  }
  // Persist cleaned host back so future connects work.
  config.host = host;
  config.port = port;

  const client = new ftp.Client();
  client.ftp.verbose = false;

  try {
    await client.access({
      host,
      user: String(config.username).trim(),
      password: config.password,
      secure: Boolean(config.secure),
      port,
    });
    try {
      await client.list();
    } catch {
      await client.pwd();
    }
  } catch (err) {
    throw new Error(friendlyConnectionError('FTP', host, port, err));
  } finally {
    client.close();
  }
}

/**
 * Test SSH/SFTP connection
 */
async function testSSHConnection(config) {
  const sftp = new SftpClient();
  let host = sanitizeHost(config?.host);
  const port = Number(config?.port) || 22;
  if (config && host) {
    config.host = host;
    config.port = port;
  }

  try {
    await sftp.connect(buildSshConnectOptions(config));
    try {
      await sftp.list('.');
    } catch {
      await sftp.list('/');
    }
  } catch (err) {
    throw new Error(friendlyConnectionError('SSH/SFTP', host || config?.host, port, err));
  } finally {
    try {
      await sftp.end();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Test cPanel connection
 */
async function testCpanelConnection(rawConfig) {
  const config = normalizeCpanelConfig(rawConfig);
  if (!config.testUrl || !config.username || !config.token) {
    throw new Error(
      'cPanel requires host (or domain), username, and API token. Tip: create a token in cPanel → Security → Manage API Tokens.'
    );
  }

  try {
    const response = await axios.get(config.testUrl, {
      headers: {
        Authorization: `cpanel ${config.username}:${config.token}`,
      },
      timeout: 20000,
      validateStatus: false,
    });

    if (response.status !== 200) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          'cPanel login failed. Tip: check username and API token. Token must belong to this cPanel account.'
        );
      }
      throw new Error(
        `cPanel responded with status ${response.status}. Tip: confirm host supports https://HOST:2083 and API tokens.`
      );
    }

    return response.data;
  } catch (err) {
    if (err.message && /cPanel/i.test(err.message)) throw err;
    throw new Error(friendlyConnectionError('cPanel', config.host, 2083, err));
  }
}

/**
 * Merge incoming config with stored secrets when password/token/key left blank (edit flow).
 */
function mergeHostingConfig(existingConfigStr, incoming, connectionType) {
  let existing = {};
  try {
    existing = JSON.parse(existingConfigStr || '{}') || {};
  } catch {
    existing = {};
  }
  const next = { ...existing, ...(incoming || {}) };
  const type = String(connectionType || '').toLowerCase();

  if (type === 'ftp' || type === 'ssh' || type === 'vps') {
    if (!String(incoming?.password || '').trim() && existing.password) {
      next.password = existing.password;
    }
    if (!String(incoming?.privateKey || '').trim() && existing.privateKey) {
      next.privateKey = existing.privateKey;
    }
    if (incoming?.host) next.host = sanitizeHost(incoming.host);
  }
  if (type === 'cpanel') {
    if (!String(incoming?.token || '').trim() && existing.token) {
      next.token = existing.token;
    }
  }
  return next;
}

/**
 * Stable identity for a hosting connection (ignores password/token differences).
 * Used to prevent duplicate rows for the same host+user.
 */
function hostingIdentityKey(connectionType, connectionConfig) {
  const type = String(connectionType || '').toLowerCase().trim();
  let config = connectionConfig;
  if (typeof config === 'string') {
    try {
      config = JSON.parse(config);
    } catch {
      config = {};
    }
  }
  config = config || {};

  if (type === 'cpanel') {
    const normalized = normalizeCpanelConfig(config);
    const host = String(normalized.host || normalized.cpanelDomain || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/^www\./, '');
    const username = String(normalized.username || '').trim().toLowerCase();
    return `cpanel|${host}|${username}`;
  }

  const host = String(config.host || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./, '');
  const username = String(config.username || '').trim().toLowerCase();
  const defaultPort = type === 'ftp' ? 21 : 22;
  const port = Number(config.port) || defaultPort;
  // Treat ssh and vps as the same endpoint identity so the same server isn't listed twice.
  const family = type === 'vps' || type === 'ssh' ? 'ssh' : type;
  return `${family}|${host}|${username}|${port}`;
}

/** Prefer isOur, then success, then newest updatedAt/createdAt. */
function pickPreferredHosting(a, b) {
  const score = (h) => {
    let s = 0;
    if (h.isOur) s += 100;
    if (h.status === 'success') s += 10;
    const t = new Date(h.updatedAt || h.createdAt || 0).getTime();
    return s * 1e15 + t;
  };
  return score(a) >= score(b) ? a : b;
}

/**
 * Deduplicate a list of hosting docs by identity key. Optionally delete losers from DB.
 * @returns {{ unique: object[], removedIds: string[] }}
 */
async function dedupeHostingConnections(hostings, { persist = false } = {}) {
  const list = Array.isArray(hostings) ? hostings : [];
  const byKey = new Map();
  /** @type {Array<{ winnerId: string, loserId: string }>} */
  const remaps = [];

  for (const doc of list) {
    const plain = typeof doc.toObject === 'function' ? doc.toObject() : doc;
    let key;
    try {
      key = hostingIdentityKey(plain.connectionType, plain.connectionConfig);
    } catch {
      key = String(plain._id);
    }
    if (!byKey.has(key)) {
      byKey.set(key, plain);
      continue;
    }
    const current = byKey.get(key);
    const winner = pickPreferredHosting(current, plain);
    const loser = winner === current ? plain : current;
    byKey.set(key, winner);
    if (loser?._id && winner?._id && String(loser._id) !== String(winner._id)) {
      remaps.push({ winnerId: String(winner._id), loserId: String(loser._id) });
    }
  }

  const removedIds = remaps.map((r) => r.loserId);

  if (persist && removedIds.length) {
    const Model = getHostingConnectionModel();
    try {
      const ProjectDeployment = require('../models/ProjectDeployment');
      const UserProject = require('../models/userProjects');
      for (const { winnerId, loserId } of remaps) {
        await ProjectDeployment.updateMany(
          { hostingId: loserId },
          { $set: { hostingId: winnerId } }
        ).catch(() => {});
        await UserProject.updateMany(
          { hostingId: loserId },
          { $set: { hostingId: winnerId } }
        ).catch(() => {});
      }
    } catch {
      /* models optional during isolated require */
    }
    await Model.deleteMany({ _id: { $in: removedIds } }).catch(() => {});
  }

  return { unique: Array.from(byKey.values()), removedIds };
}

// Lazy require to avoid circular deps if HostingConnection ever imports helpers
let HostingConnectionModel;
function getHostingConnectionModel() {
  if (!HostingConnectionModel) {
    HostingConnectionModel = require('../models/HostingConnection');
  }
  return HostingConnectionModel;
}

async function findExistingHostingByIdentity(userId, connectionType, connectionConfig) {
  const Model = getHostingConnectionModel();
  const key = hostingIdentityKey(connectionType, connectionConfig);
  const family =
    connectionType === 'ssh' || connectionType === 'vps'
      ? ['ssh', 'vps']
      : [String(connectionType).toLowerCase()];

  const candidates = await Model.find({
    userId,
    connectionType: { $in: family },
  }).sort({ updatedAt: -1 });

  for (const doc of candidates) {
    try {
      if (hostingIdentityKey(doc.connectionType, doc.connectionConfig) === key) {
        return doc;
      }
    } catch {
      /* ignore bad config */
    }
  }
  return null;
}

/**
 * Run the correct connection test for a hosting type. Mutates/normalizes config in place for cPanel.
 */
async function testHostingConnection(connectionType, connectionConfig) {
  const type = String(connectionType || '').toLowerCase();
  switch (type) {
    case 'ftp':
      await testFTPConnection(connectionConfig);
      return connectionConfig;
    case 'ssh':
    case 'vps':
      await testSSHConnection(connectionConfig);
      return connectionConfig;
    case 'cpanel': {
      const normalized = normalizeCpanelConfig(connectionConfig);
      await testCpanelConnection(normalized);
      return normalized;
    }
    default:
      throw new Error('Invalid connectionType. Use ftp, cpanel, ssh, or vps.');
  }
}



async function uploadFolderFTP(client, localDir, remoteDir) {
    console.log("Inside uploadFolderFTP function", client, localDir, remoteDir);

    try {
        // Ensure the remote directory exists or create it
        console.log(`Creating remote directory: ${remoteDir}`);
        await client.ensureDir(remoteDir);  // This method works with basic-ftp
        console.log(`Remote directory created: ${remoteDir}`);
    } catch (error) {
        console.error(`Error creating remote directory: ${remoteDir}`, error);
    }

    const items = fs.readdirSync(localDir);  // Read all files and subdirectories in the local directory

    for (const item of items) {
        const localPath = path.join(localDir, item);  // Local path for the file/folder
        const remotePath = path.posix.join(remoteDir, item);  // Remote path for the file/folder
        const stat = fs.statSync(localPath); // Check if it's a file or directory

        if (stat.isDirectory()) {
            // Recursively upload subdirectories
            console.log(`Directory found, creating remote directory and uploading contents: ${remotePath}`);
            await uploadFolderFTP(client, localPath, remotePath);  // Recursive upload for directories
        } else {
            // Upload files and replace if they already exist on the remote server
            console.log(`Uploading file: ${localPath} to ${remotePath}`);
            try {
                await client.uploadFrom(localPath, remotePath);  // Overwrite existing files on the remote server
                console.log(`File uploaded: ${remotePath}`);
            } catch (error) {
                console.error(`Error uploading file: ${localPath} to ${remotePath}`, error);
            }
        }
    }
}




async function uploadFolderSFTP(sftp, localDir, remoteDir) {
    try {
        // Create the remote directory if it doesn't exist
        await sftp.mkdir(remoteDir, true);  // Using SFTP client’s mkdir
    } catch (_) {}

    const items = fs.readdirSync(localDir);
    for (const item of items) {
        const localPath = path.join(localDir, item);
        const remotePath = path.posix.join(remoteDir, item);
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
            await uploadFolderSFTP(sftp, localPath, remotePath);
        } else {
            await sftp.fastPut(localPath, remotePath);
        }
    }
}


async function uploadFolderCPanel(config, localDir, remoteDir) {
    const cpanelUsername = config.username || config.cpanelUsername;
    const cpanelToken = config.token || config.cpanelToken;

    // Extract domain from testUrl or use directly
    let cpanelDomain = config.cpanelDomain;
    if (!cpanelDomain && config.testUrl) {
        try {
            const parsed = new URL(config.testUrl);
            cpanelDomain = parsed.hostname;
        } catch (err) {
            throw new Error('Invalid testUrl in config');
        }
    }

    if (!cpanelDomain || !cpanelUsername || !cpanelToken) {
        throw new Error('Missing cPanel domain, username, or token');
    }

    const items = fs.readdirSync(localDir);
    for (const item of items) {
        const localPath = path.join(localDir, item);
        const remotePath = path.posix.join(remoteDir, item);
        const stat = fs.statSync(localPath);

        if (stat.isDirectory()) {
            await uploadFolderCPanel(config, localPath, remotePath);
        } else {
            const form = new FormData();
            form.append('file', fs.createReadStream(localPath));
            form.append('dir', remoteDir);

            const uploadUrl = `https://${cpanelDomain}:2083/execute/Fileman/upload_files`;
            await axios.post(uploadUrl, form, {
                headers: {
                    ...form.getHeaders(),
                    Authorization: `cpanel ${cpanelUsername}:${cpanelToken}`
                }
            });
        }
    }
}



async function uploadToCPanel(config, localPath, rootPath = '/public_html') {
    const cpanelUsername = config.username || config.cpanelUsername;
    const cpanelToken = config.token || config.cpanelToken;

    // Extract domain from testUrl or use directly
    let cpanelDomain = config.cpanelDomain;
    if (!cpanelDomain && config.testUrl) {
        try {
            const parsed = new URL(config.testUrl);
            cpanelDomain = parsed.hostname;
        } catch (err) {
            throw new Error('Invalid testUrl in config');
        }
    }

    if (!cpanelDomain || !cpanelUsername || !cpanelToken) {
        throw new Error('Missing cPanel domain, username, or token');
    }

    const files = fs.readdirSync(localPath).filter(file => {
        const stat = fs.statSync(path.join(localPath, file));
        return stat.isFile();
    });

    // Step 1: Try deleting existing files
    const deleteUrl = `https://${cpanelDomain}:2083/execute/Fileman/delete`;
    const deletePayload = new URLSearchParams();
    for (const file of files) {
        deletePayload.append('files', `${rootPath}/${file}`);
    }

    try {
        const deleteRes = await axios.post(deleteUrl, deletePayload.toString(), {
            headers: {
                Authorization: `cpanel ${cpanelUsername}:${cpanelToken}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log('✅ Deleted files if they existed:', deleteRes.data);
    } catch (err) {
        console.warn('⚠️ Failed to delete existing files (not fatal):', err.response?.data || err.message);
    }

    // Step 2: Upload files
    const form = new FormData();
    let fileIndex = 1;
    for (const file of files) {
        const filePath = path.join(localPath, file);
        form.append(`file-${fileIndex++}`, fs.createReadStream(filePath));
    }
    form.append('dir', rootPath);

    const uploadUrl = `https://${cpanelDomain}:2083/execute/Fileman/upload_files`;

    const response = await axios.post(uploadUrl, form, {
        headers: {
            ...form.getHeaders(),
            Authorization: `cpanel ${cpanelUsername}:${cpanelToken}`
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
    });

    if (!response.data || response.data.status !== 1) {
        throw new Error('cPanel upload failed: ' + JSON.stringify(response.data));
    }

    return response.data;
}




async function uploadFileCPanel(config, localFilePath, remoteFullPath) {
  const cpanelUsername = config.username || config.cpanelUsername;
  const cpanelToken = config.token || config.cpanelToken;

  // Derive domain from testUrl if not explicitly provided
  let cpanelDomain = config.cpanelDomain;
  if (!cpanelDomain && config.testUrl) {
    const parsed = new URL(config.testUrl);
    cpanelDomain = parsed.hostname;
  }

  if (!cpanelDomain || !cpanelUsername || !cpanelToken) {
    throw new Error('Missing cPanel domain, username, or token');
  }

  const remoteDir = path.posix.dirname(remoteFullPath || '/public_html/sitemap.xml');
  const remoteBase = path.posix.basename(remoteFullPath || '/public_html/sitemap.xml');

  // 1) Best-effort delete existing sitemap.xml (ignore failure if not present)
  const deleteUrl = `https://${cpanelDomain}:2083/execute/Fileman/delete`;
  const deletePayload = new URLSearchParams();
  deletePayload.append('files', path.posix.join(remoteDir, remoteBase));

  try {
    await axios.post(deleteUrl, deletePayload.toString(), {
      headers: {
        Authorization: `cpanel ${cpanelUsername}:${cpanelToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  } catch {
    // not fatal if file didn't exist
  }

  // 2) Upload the new sitemap.xml into the target dir with the exact name
  const form = new FormData();
  // Ensure the uploaded name is EXACTLY 'sitemap.xml' (or whatever remoteBase is)
  form.append('file-1', fs.createReadStream(localFilePath), { filename: remoteBase });
  form.append('dir', remoteDir);

  const uploadUrl = `https://${cpanelDomain}:2083/execute/Fileman/upload_files`;
  const res = await axios.post(uploadUrl, form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `cpanel ${cpanelUsername}:${cpanelToken}`
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (!res.data || res.data.status !== 1) {
    throw new Error('cPanel upload failed: ' + JSON.stringify(res.data));
  }

  return res.data;
}


const extract = require('extract-zip');


async function extractZip(zipPath, destDir) {
    await extract(zipPath, { dir: destDir });
    console.log(`✅ Extracted zip to ${destDir}`);
}




async function uploadZipFTP(ftpConfig, localZipPath, remoteDir) {
    const client = new ftp.Client();
    client.ftp.verbose = true;

    const tempExtractDir = path.join(__dirname, 'temp_extract_' + Date.now());

    try {
        await fs.ensureDir(tempExtractDir);

        await extractZip(localZipPath, tempExtractDir);

        await client.access({
            host: ftpConfig.host,
            user: ftpConfig.username,
            password: ftpConfig.password,
            port: ftpConfig.port || 21,
            secure: ftpConfig.secure || false
        });

        await uploadFolderFTP(client, tempExtractDir, remoteDir);

        console.log(`✅ Uploaded contents to FTP: ${remoteDir}`);
    } catch (err) {
        console.error(`❌ FTP upload failed: ${err.message}`);
        throw err;
    } finally {
        client.close();
        await fs.remove(tempExtractDir);  // clean temp files
    }
}



const sftp = new SftpClient();

async function uploadZipSFTP(sftpConfig, localZipPath, remoteZipPath) {
    const sftp = new SftpClient(); // <-- instantiate inside

    try {
        await sftp.connect(buildSshConnectOptions(sftpConfig));

        await sftp.fastPut(localZipPath, remoteZipPath);
        console.log(`✅ Uploaded ZIP to SFTP: ${remoteZipPath}`);
    } catch (err) {
        console.error(`❌ SFTP upload failed: ${err.message}`);
        throw err;
    } finally {
        await sftp.end();
    }
}



module.exports = {
  sanitizeHost,
  friendlyConnectionError,
  buildSshConnectOptions,
  normalizeCpanelConfig,
  mergeHostingConfig,
  hostingIdentityKey,
  findExistingHostingByIdentity,
  dedupeHostingConnections,
  testFTPConnection,
  testSSHConnection,
  testCpanelConnection,
  testHostingConnection,
  uploadFolderFTP,
  uploadFolderSFTP,
  uploadFolderCPanel,
  uploadToCPanel,
  uploadFileCPanel,
  uploadZipSFTP,
  uploadZipFTP,
};