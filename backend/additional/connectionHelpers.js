const SftpClient = require('ssh2-sftp-client');
const ftp = require('basic-ftp');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data'); // ✅ Must be this package


/**
 * Test FTP connection
 */
async function testFTPConnection(config) {

  console.log(config,"config of test ftp connection")
  const client = new ftp.Client();
  client.ftp.verbose = true; // Log internal FTP steps

  try {
    console.log('Attempting FTP connection to:', config.host);
    await client.access({
      host: config.host,
      user: config.username,
      password: config.password,
      secure: config.secure || false,
      port: config.port || 21
    });
    await client.list('/');
  } catch (err) {
    console.error('FTP connection failed:', err);
    throw new Error('FTP connection failed: ' + err.message);
  } finally {
    client.close();
  }
}


/**
 * Test SSH/SFTP connection
 */
async function testSSHConnection(config) {
  const sftp = new SftpClient();

  try {
    await sftp.connect({
      host: config.host,
      port: config.port || 22,
      username: config.username,
      password: config.password,
      // Optional for key-based:
      // privateKey: fs.readFileSync(config.privateKeyPath),
    });

    // Optional: list root dir
    await sftp.list('/');
  } catch (err) {
    throw new Error('SSH/SFTP connection failed: ' + err.message);
  } finally {
    await sftp.end();
  }
}

/**
 * Test cPanel connection
 */
async function testCpanelConnection(config) {
  if (!config.testUrl || !config.username || !config.token) {
    throw new Error('Missing testUrl, username or token for cPanel connection');
  }

  console.log(config,"config data inside the funtion!!")

  try {
    const response = await axios.get(config.testUrl, {
      headers: {
        Authorization: `cpanel ${config.username}:${config.token}`
      },
      validateStatus: false // allow non-200 responses
    });

    if (response.status !== 200) {
      console.log(response,"error response")
      throw new Error(`cPanel responded with status code ${response.status}`);
    }

    return response.data;
  } catch (err) {
    console.log(err)
    throw new Error('cPanel connection failed: ' + err.message);
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
        await sftp.connect({
            host: sftpConfig.host,
            port: sftpConfig.port || 22,
            username: sftpConfig.username,
            password: sftpConfig.password,
            privateKey: sftpConfig.privateKey || undefined
        });

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
  testFTPConnection,
  testSSHConnection,
  testCpanelConnection,
  uploadFolderFTP,
  uploadFolderSFTP,
  uploadToCPanel,
  uploadFileCPanel,
  uploadZipSFTP,
  uploadZipFTP

};