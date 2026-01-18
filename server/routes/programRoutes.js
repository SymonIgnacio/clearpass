const express = require('express');
const router = express.Router();
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

console.log('DEBUG: programRoutes.js ROLES:', ROLES);

// ...Simple ID validation middleware
const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid ID parameter' });
  }
  next();
};

module.exports = (db) => {
  // GET all programs - All authenticated users can view
  router.get('/', verifyToken, asyncHandler(async (req, res) => {
    try {
      const [programs] = await db.execute(
        'SELECT * FROM community_programs ORDER BY program_date DESC'
      );
      res.json(programs);
    } catch (error) {
      console.error('Error fetching programs:', error);
      // Return empty array if table doesn't exist
      res.json([]);
    }
  }));
  
  // GET program by ID
  router.get('/:id', verifyToken, validateId, asyncHandler(async (req, res) => {
    try {
      const [programs] = await db.execute(
        'SELECT * FROM community_programs WHERE id = ?',
        [req.params.id]
      );
      if (programs.length === 0) {
        return res.status(404).json({ error: 'Program not found' });
      }
      res.json(programs[0]);
    } catch (error) {
      console.error('Error fetching program:', error);
      res.status(500).json({ error: 'Failed to fetch program' });
    }
  }));
  
  // POST create program (Admin, Captain, Secretary)
  router.post('/', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(async (req, res) => {
    try {
      const { program_name, description, program_date, sitio_id, target_beneficiaries, status } = req.body;
      const id = `PROG-${Date.now()}`;
      
      const [result] = await db.execute(
        'INSERT INTO community_programs (id, program_name, description, program_date, sitio_id, target_beneficiaries, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [id, program_name, description, program_date, sitio_id || null, JSON.stringify(target_beneficiaries || []), status || 'Planned', req.user.id]
      );
      res.status(201).json({ id: id, message: 'Program created successfully' });
    } catch (error) {
      console.error('Error creating program:', error);
      res.status(500).json({ error: 'Failed to create program' });
    }
  }));
  
  // PUT update program (Admin, Captain, Secretary)
  router.put('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), validateId, asyncHandler(async (req, res) => {
    try {
      const { program_name, description, program_date, sitio_id, target_beneficiaries, status } = req.body;
      await db.execute(
        'UPDATE community_programs SET program_name = ?, description = ?, program_date = ?, sitio_id = ?, target_beneficiaries = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [program_name, description, program_date, sitio_id || null, JSON.stringify(target_beneficiaries || []), status, req.params.id]
      );
      res.json({ message: 'Program updated successfully' });
    } catch (error) {
      console.error('Error updating program:', error);
      res.status(500).json({ error: 'Failed to update program' });
    }
  }));

  return router;
};