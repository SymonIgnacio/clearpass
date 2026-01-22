const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = db => {
  // GET all announcements (public)
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const { page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const [announcements] = await db.execute(
        `
      SELECT id, title, content, category, priority, created_at, expires_at
      FROM announcements
      WHERE is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY priority DESC, created_at DESC
      LIMIT ? OFFSET ?
    `,
        [parseInt(limit), offset]
      );

      const [total] = await db.execute(`
      SELECT COUNT(*) as count
      FROM announcements
      WHERE is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
    `);

      res.json({
        announcements,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total[0].count,
        },
      });
    })
  );

  // POST create announcement (admin/secretary only)
  router.post(
    '/',
    verifyToken,
    checkRole(['admin', 'secretary']),
    asyncHandler(async (req, res) => {
      const { title, content, category, priority, expires_at } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const [result] = await db.execute(
        `
      INSERT INTO announcements (title, content, category, priority, expires_at, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
        [title, content, category || 'general', priority || 'normal', expires_at, req.user.id]
      );

      res.status(201).json({
        id: result.insertId,
        message: 'Announcement created successfully',
      });
    })
  );

  // PUT update announcement
  router.put(
    '/:id',
    verifyToken,
    checkRole(['admin', 'secretary']),
    asyncHandler(async (req, res) => {
      const { title, content, category, priority, expires_at, is_active } = req.body;

      const updates = [];
      const values = [];

      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (content !== undefined) {
        updates.push('content = ?');
        values.push(content);
      }
      if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
      }
      if (priority !== undefined) {
        updates.push('priority = ?');
        values.push(priority);
      }
      if (expires_at !== undefined) {
        updates.push('expires_at = ?');
        values.push(expires_at);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      values.push(req.params.id);
      await db.execute(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, values);

      res.json({ message: 'Announcement updated successfully' });
    })
  );

  // DELETE announcement
  router.delete(
    '/:id',
    verifyToken,
    checkRole(['admin', 'secretary']),
    asyncHandler(async (req, res) => {
      await db.execute('UPDATE announcements SET is_active = FALSE WHERE id = ?', [req.params.id]);
      res.json({ message: 'Announcement deleted successfully' });
    })
  );

  return router;
};
