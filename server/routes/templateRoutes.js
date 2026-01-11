const express = require('express');
const multer = require('multer');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const parseTemplateContent = (value) => {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const serializeTemplateContent = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

const mapTemplateRow = (row) => ({
  id: row.id,
  template_name: row.template_name,
  document_type: row.document_type,
  certificate_type_id: row.certificate_type_id ?? null,
  template_content: parseTemplateContent(row.template_content),
  is_active: !!row.is_active,
  created_by: row.created_by ?? null,
  updated_by: row.updated_by ?? null,
  created_at: row.created_at,
  updated_at: row.updated_at,
  file_encoding: row.file_encoding ?? null,
  has_file: !!row.has_file,
});

module.exports = (db) => {
  const router = express.Router();

  router.get(
    '/',
    verifyToken,
    checkRole(['captain', 'admin', 'secretary', 'clerk']),
    asyncHandler(async (req, res) => {
      const includeInactive = String(req.query?.include_inactive || '').toLowerCase() === 'true';
      const documentType = req.query?.document_type || null;

      const whereParts = [];
      const params = [];

      if (!includeInactive) {
        whereParts.push('t.is_active = 1');
      }

      if (documentType) {
        whereParts.push('t.document_type = ?');
        params.push(documentType);
      }

      const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
      const [rows] = await db.execute(
        `
          SELECT
            t.id,
            t.template_name,
            t.document_type,
            t.certificate_type_id,
            t.template_content,
            t.is_active,
            t.created_by,
            t.updated_by,
            t.created_at,
            t.updated_at,
            t.file_encoding,
            (t.file_data IS NOT NULL) as has_file
          FROM document_templates t
          ${whereClause}
          ORDER BY t.template_name ASC
        `,
        params
      );

      res.json({ success: true, data: rows.map(mapTemplateRow) });
    })
  );

  router.get(
    '/stats',
    verifyToken,
    checkRole(['captain', 'admin', 'secretary', 'clerk']),
    asyncHandler(async (req, res) => {
      const [totals] = await db.execute(
        `
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active
          FROM document_templates
        `
      );
      const [byType] = await db.execute(
        `
          SELECT document_type, COUNT(*) as total
          FROM document_templates
          GROUP BY document_type
          ORDER BY total DESC
        `
      );
      res.json({
        success: true,
        data: {
          total: totals?.[0]?.total || 0,
          active: totals?.[0]?.active || 0,
          by_type: byType || [],
        },
      });
    })
  );

  router.post(
    '/',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { template_name, document_type, certificate_type_id, template_content, is_active } = req.body || {};

      if (!template_name || !document_type) {
        return res.status(400).json({ success: false, message: 'template_name and document_type are required' });
      }

      await db.execute(
        `
          INSERT INTO document_templates (
            template_name,
            document_type,
            certificate_type_id,
            template_content,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          String(template_name).trim(),
          String(document_type).trim(),
          certificate_type_id ?? null,
          serializeTemplateContent(template_content) ?? '{}',
          is_active === false ? 0 : 1,
          req.user.id,
          req.user.id,
        ]
      );

      res.status(201).json({ success: true, message: 'Template created successfully' });
    })
  );

  router.put(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { template_name, document_type, certificate_type_id, template_content, is_active } = req.body || {};

      if (!template_name || !document_type) {
        return res.status(400).json({ success: false, message: 'template_name and document_type are required' });
      }

      await db.execute(
        `
          UPDATE document_templates
          SET template_name = ?,
              document_type = ?,
              certificate_type_id = ?,
              template_content = ?,
              is_active = ?,
              updated_by = ?,
              updated_at = NOW()
          WHERE id = ?
        `,
        [
          String(template_name).trim(),
          String(document_type).trim(),
          certificate_type_id ?? null,
          serializeTemplateContent(template_content) ?? '{}',
          is_active === false ? 0 : 1,
          req.user.id,
          id,
        ]
      );

      res.json({ success: true, message: 'Template updated successfully' });
    })
  );

  router.delete(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      await db.execute('DELETE FROM document_templates WHERE id = ?', [id]);
      res.json({ success: true, message: 'Template deleted successfully' });
    })
  );

  router.delete(
    '/:id/with-file',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      await db.execute('DELETE FROM document_templates WHERE id = ?', [id]);
      res.json({ success: true, message: 'Template and file deleted successfully' });
    })
  );

  router.post(
    '/:id/duplicate',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { new_template_name } = req.body || {};

      if (!new_template_name || !String(new_template_name).trim()) {
        return res.status(400).json({ success: false, message: 'new_template_name is required' });
      }

      const [rows] = await db.execute('SELECT * FROM document_templates WHERE id = ?', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      const original = rows[0];

      await db.execute(
        `
          INSERT INTO document_templates (
            template_name,
            document_type,
            certificate_type_id,
            template_content,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at,
            file_data,
            file_encoding
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, ?)
        `,
        [
          String(new_template_name).trim(),
          original.document_type,
          original.certificate_type_id ?? null,
          original.template_content,
          original.is_active,
          req.user.id,
          req.user.id,
          original.file_data ?? null,
          original.file_encoding ?? null,
        ]
      );

      res.status(201).json({ success: true, message: 'Template duplicated successfully' });
    })
  );

  router.post(
    '/upload',
    verifyToken,
    checkRole(['admin']),
    upload.single('template_file'),
    asyncHandler(async (req, res) => {
      const { template_name, document_type, certificate_type_id } = req.body || {};

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'template_file is required' });
      }

      if (!template_name || !document_type) {
        return res.status(400).json({ success: false, message: 'template_name and document_type are required' });
      }

      await db.execute(
        `
          INSERT INTO document_templates (
            template_name,
            document_type,
            certificate_type_id,
            template_content,
            is_active,
            created_by,
            updated_by,
            created_at,
            updated_at,
            file_data,
            file_encoding
          ) VALUES (?, ?, ?, ?, 1, ?, ?, NOW(), NOW(), ?, ?)
        `,
        [
          String(template_name).trim(),
          String(document_type).trim(),
          certificate_type_id ?? null,
          '{}',
          req.user.id,
          req.user.id,
          req.file.buffer,
          req.file.mimetype || null,
        ]
      );

      res.status(201).json({ success: true, message: 'Template file uploaded successfully' });
    })
  );

  router.get(
    '/:id/download',
    verifyToken,
    checkRole(['captain', 'admin', 'secretary', 'clerk']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const [rows] = await db.execute(
        `
          SELECT template_name, file_data, file_encoding
          FROM document_templates
          WHERE id = ?
        `,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Template not found' });
      }

      const row = rows[0];
      if (!row.file_data) {
        return res.status(404).json({ success: false, message: 'No file attached to this template' });
      }

      const mime = row.file_encoding || 'application/octet-stream';
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `attachment; filename="${row.template_name}"`);
      res.send(row.file_data);
    })
  );

  return router;
};

