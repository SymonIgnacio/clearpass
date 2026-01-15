const express = require('express');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');

module.exports = (db) => {
  const router = express.Router();

  // Create new certificate type
  router.post(
    '/',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { name, fee, validity_days, description, purpose, when_needed, required_data, is_active } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Default required_data if not provided
      const defaultRequiredData = JSON.stringify([
        'Valid ID (Government or School ID) - Front & Back',
        'Proof of Residency'
      ]);

      await db.execute(
        `INSERT INTO certificate_types 
        (name, fee, validity_days, description, purpose, when_needed, required_data, is_active, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name, 
          fee || 0, 
          validity_days || 365, 
          description || '', 
          purpose || '', 
          when_needed || '', 
          required_data ? JSON.stringify(required_data) : defaultRequiredData,
          is_active !== false // Default true
        ]
      );

      res.status(201).json({ message: 'Certificate type created successfully' });
    })
  );

  // Update certificate type
  router.put(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;
      const { name, fee, validity_days, description, purpose, when_needed, required_data, is_active } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      await db.execute(
        `UPDATE certificate_types 
        SET name = ?, fee = ?, validity_days = ?, description = ?, purpose = ?, when_needed = ?, required_data = ?, is_active = ?, updated_at = NOW() 
        WHERE id = ?`,
        [
          name, 
          fee || 0, 
          validity_days || 365, 
          description || '', 
          purpose || '', 
          when_needed || '', 
          JSON.stringify(required_data),
          is_active !== false,
          id
        ]
      );

      res.json({ message: 'Certificate type updated successfully' });
    })
  );

  // Delete certificate type
  router.delete(
    '/:id',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      const { id } = req.params;

      // Check for dependencies (e.g., existing certificates or templates)
      const [certs] = await db.execute('SELECT COUNT(*) as count FROM certificates_log WHERE certificate_type = (SELECT name FROM certificate_types WHERE id = ?)', [id]);
      if (certs[0].count > 0) {
        return res.status(400).json({ error: 'Cannot delete: Certificates of this type have already been issued. Deactivate it instead.' });
      }

      await db.execute('DELETE FROM certificate_types WHERE id = ?', [id]);
      res.json({ message: 'Certificate type deleted successfully' });
    })
  );

  return router;
};
