const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

const { encryptFileToEncryptedPath } = require('../utils/documentStorage');

const mockDb = {
  execute: jest.fn(),
  getConnection: jest.fn()
};

jest.mock('../database', () => mockDb);

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'RES-A', resident_id: 'RES-A', role: 12 };
    next();
  },
  checkRole: () => (req, res, next) => next(),
  enforceReadOnly: (req, res, next) => next()
}));

describe('encrypted resident document downloads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.DOCUMENTS_ENCRYPTION_ENABLED = 'true';
    process.env.DOCUMENTS_MASTER_KEY = crypto.randomBytes(32).toString('base64');
  });

  afterEach(() => {
    delete process.env.DOCUMENTS_ENCRYPTION_ENABLED;
    delete process.env.DOCUMENTS_MASTER_KEY;
  });

  test('downloads and decrypts encrypted resident document', async () => {
    const residentRoutes = require('../routes/residentRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/residents', residentRoutes({}));

    const documentsRoot = path.join(__dirname, '../uploads/documents');
    await fs.mkdir(documentsRoot, { recursive: true });
    const plainPath = path.join(documentsRoot, `enc-${Date.now()}.pdf`);
    const payload = Buffer.from('%PDF-1.4\n%encrypted-test\n');
    await fs.writeFile(plainPath, payload);

    const encrypted = await encryptFileToEncryptedPath(plainPath);

    mockDb.execute.mockResolvedValueOnce([
      [
        {
          resident_id: 'RES-A',
          file_path: encrypted.outputPath,
          file_name: 'test.pdf',
          encryption_alg: encrypted.encryption_alg,
          encryption_iv: encrypted.encryption_iv,
          encryption_tag: encrypted.encryption_tag
        }
      ]
    ]);

    const binaryParser = (response, callback) => {
      response.setEncoding('binary');
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        callback(null, Buffer.from(data, 'binary'));
      });
    };

    const res = await request(app)
      .get('/api/residents/RES-A/documents/1/download')
      .buffer(true)
      .parse(binaryParser);

    expect(res.status).toBe(200);
    expect(res.body).toEqual(payload);

    await fs.unlink(encrypted.outputPath);
  });
});
