const express = require('express');
const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;

jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => {
    req.user = { id: 'ADMIN-1', role: 1 };
    next();
  },
  checkRole: () => (req, res, next) => next()
}));

describe('system assets upload and fetch', () => {
  test('uploads a seal and fetches latest', async () => {
    const uploaded = [];
    const mockDb = {
      execute: jest.fn(async (sql, params) => {
        const q = String(sql).toLowerCase();
        if (q.includes('insert into system_assets')) {
          return [{ insertId: 123 }];
        }
        if (q.includes('select file_path')) {
          return [[{ file_path: uploaded[0].file_path, mime_type: 'image/png', original_name: 'seal.png' }]];
        }
        if (q.includes('select asset_type')) {
          return [[{ asset_type: 'seal', id: 123 }]];
        }
        return [[]];
      })
    };

    const systemAdminRoutes = require('../routes/systemAdminRoutes');
    const app = express();
    app.use(express.json());
    app.use('/api/system-admin', systemAdminRoutes(mockDb));

    const tmpDir = path.join(__dirname, 'tmp');
    await fs.mkdir(tmpDir, { recursive: true });
    const tmpFile = path.join(tmpDir, `seal-${Date.now()}.png`);
    await fs.writeFile(tmpFile, Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

    const uploadRes = await request(app)
      .post('/api/system-admin/upload-seal')
      .field('type', 'seal')
      .attach('file', tmpFile);

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.file_path).toBe('/api/system-admin/assets/seal/latest');

    const insertCall = mockDb.execute.mock.calls.find(c => String(c[0]).toLowerCase().includes('insert into system_assets'));
    const storedFilePath = insertCall[1][1];
    uploaded.push({ file_path: storedFilePath });

    const fetchRes = await request(app).get('/api/system-admin/assets/seal/latest');
    expect(fetchRes.status).toBe(200);
    expect(fetchRes.headers['content-type']).toMatch(/image\/png/);

    await fs.unlink(tmpFile);
  });
});

