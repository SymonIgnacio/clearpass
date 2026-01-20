const express = require('express');
const router = express.Router();
const ProgramController = require('../controllers/programController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const controller = new ProgramController(db);

  // GET all programs - All authenticated users can view
  router.get('/', verifyToken, asyncHandler(controller.getAll));
  
  // GET program by ID
  router.get('/:id', verifyToken, asyncHandler(controller.getById));
  
  // POST create program (Admin, Captain, Secretary)
  router.post('/', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(controller.create));
  
  // PUT update program (Admin, Captain, Secretary)
  router.put('/:id', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(controller.update));

  // POST add participant (Admin, Captain, Secretary)
  router.post('/:id/add-participant', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(controller.addParticipant));

  // POST notify participants (Admin, Captain, Secretary)
  router.post('/:id/notify-participants', verifyToken, verifyRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY]), asyncHandler(controller.notifyParticipants));

  return router;
};