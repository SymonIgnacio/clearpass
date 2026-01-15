const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

const documentsRoot = path.join(__dirname, '../uploads/documents');

const getDocumentsMasterKey = () => {
  const raw = process.env.DOCUMENTS_MASTER_KEY || '';
  if (!raw) return null;
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length !== 32) return null;
    return buf;
  } catch {
    return null;
  }
};

const isEncryptionEnabled = () => process.env.DOCUMENTS_ENCRYPTION_ENABLED === 'true';

const resolveAndValidateUploadedDocumentPath = (filePath) => {
  const absolute = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', String(filePath || '').replace(/^\//, ''));
  const relative = path.relative(documentsRoot, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }
  return absolute;
};

const encryptFileToEncryptedPath = async (inputPath) => {
  const masterKey = getDocumentsMasterKey();
  if (!masterKey) {
    throw new Error('DOCUMENTS_MASTER_KEY missing or invalid');
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', masterKey, iv);
  const outputPath = `${inputPath}.enc`;

  await pipeline(fs.createReadStream(inputPath), cipher, fs.createWriteStream(outputPath));
  const authTag = cipher.getAuthTag();
  await fs.promises.unlink(inputPath);

  return {
    outputPath,
    encryption_alg: 'aes-256-gcm',
    encryption_version: 1,
    encryption_iv: iv.toString('base64'),
    encryption_tag: authTag.toString('base64')
  };
};

const sendStoredDocument = async (res, absolutePath, meta = {}) => {
  const { encryption_alg, encryption_iv, encryption_tag, file_name } = meta || {};

  res.setHeader('Content-Disposition', `inline; filename="${file_name || 'document'}"`);

  if (!encryption_alg) {
    return res.sendFile(absolutePath);
  }

  if (!isEncryptionEnabled()) {
    return res.status(500).json({ error: 'Document encryption is enabled for this file but server decryption is disabled' });
  }

  const masterKey = getDocumentsMasterKey();
  if (!masterKey) {
    return res.status(500).json({ error: 'Server encryption key is not configured' });
  }

  const iv = Buffer.from(String(encryption_iv || ''), 'base64');
  const tag = Buffer.from(String(encryption_tag || ''), 'base64');
  if (iv.length !== 12 || tag.length !== 16) {
    return res.status(400).json({ error: 'Invalid encryption metadata' });
  }

  const decipher = crypto.createDecipheriv('aes-256-gcm', masterKey, iv);
  decipher.setAuthTag(tag);

  try {
    await pipeline(fs.createReadStream(absolutePath), decipher, res);
    return;
  } catch {
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to decrypt document' });
    }
  }
};

module.exports = {
  documentsRoot,
  getDocumentsMasterKey,
  isEncryptionEnabled,
  resolveAndValidateUploadedDocumentPath,
  encryptFileToEncryptedPath,
  sendStoredDocument
};

