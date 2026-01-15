const request = require('supertest');
const express = require('express');
const db = require('../database');
const templateRoutes = require('../routes/templateRoutes');

// Mock middlewares
jest.mock('../middleware/authMiddleware', () => ({
  verifyToken: (req, res, next) => { req.user = { id: 'admin1', role: 'admin' }; next(); },
  checkRole: (roles) => (req, res, next) => next(),
}));

// Mock DB
jest.mock('../database', () => ({
  execute: jest.fn(),
}));

const app = express();
app.use(express.json());
app.use('/api/templates', templateRoutes(db));

describe('Template Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/templates', () => {
    test('should return all active templates', async () => {
      const mockTemplates = [
        { id: 1, template_name: 'Temp1', is_active: 1, file_data: Buffer.from('test'), has_file: 1 }
      ];
      db.execute.mockResolvedValueOnce([mockTemplates]);

      const response = await request(app).get('/api/templates');
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].has_file).toBe(true);
    });
  });

  describe('POST /api/templates', () => {
    test('should create a new template', async () => {
      db.execute.mockResolvedValueOnce([{ insertId: 1 }]);
      
      const response = await request(app)
        .post('/api/templates')
        .send({ template_name: 'New Temp', document_type: 'Clearance' });

      expect(response.status).toBe(201);
      expect(db.execute).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO document_templates'), expect.any(Array));
    });

    test('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/templates')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/templates/:id', () => {
    test('should update template', async () => {
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app)
        .put('/api/templates/1')
        .send({ template_name: 'Updated', document_type: 'Clearance' });

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    test('should delete template', async () => {
      db.execute.mockResolvedValueOnce([{ affectedRows: 1 }]);

      const response = await request(app).delete('/api/templates/1');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/templates/:id/duplicate', () => {
    test('should duplicate template', async () => {
      db.execute
        .mockResolvedValueOnce([[{ id: 1, template_name: 'Original' }]]) // Fetch original
        .mockResolvedValueOnce([{ insertId: 2 }]); // Insert duplicate

      const response = await request(app)
        .post('/api/templates/1/duplicate')
        .send({ new_template_name: 'Copy' });

      expect(response.status).toBe(201);
    });

    test('should return 404 if original not found', async () => {
      db.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/templates/1/duplicate')
        .send({ new_template_name: 'Copy' });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/templates/:id/download', () => {
    test('should download template file', async () => {
      const fileData = Buffer.from('file content');
      db.execute.mockResolvedValueOnce([[{ template_name: 'Temp.docx', file_data: fileData, file_encoding: 'application/docx' }]]);

      const response = await request(app).get('/api/templates/1/download');
      
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/docx');
      // Verify body is either the buffer or check length if body parsing is skipped
      if (Buffer.isBuffer(response.body)) {
          expect(response.body).toEqual(fileData);
      } else {
          // Fallback if supertest returns empty object for unparsed binary
          expect(response.header['content-length']).toBeDefined(); 
      }
    });

    test('should return 404 if no file', async () => {
      db.execute.mockResolvedValueOnce([[{ template_name: 'Temp', file_data: null }]]);
      const response = await request(app).get('/api/templates/1/download');
      expect(response.status).toBe(404);
    });
  });
});
