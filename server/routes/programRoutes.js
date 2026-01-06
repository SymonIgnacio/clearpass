const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateId } = require('../middleware/validation');
const ProgramController = require('../controllers/programController');

module.exports = (db) => {
  const programController = new ProgramController(db);

  // GET all programs
  router.get('/', verifyToken, asyncHandler(programController.getAll));
  
  // GET program by ID
  router.get('/:id', verifyToken, validateId, asyncHandler(programController.getById));
  
  // POST create program (Secretary and above)
  router.post('/', verifyToken, checkRole(['admin', 'captain', 'secretary']), asyncHandler(programController.create));
  
  // PUT update program (Secretary and above)
  router.put('/:id', verifyToken, checkRole(['admin', 'captain', 'secretary']), validateId, asyncHandler(programController.update));
  
  // POST add participant to program
  router.post('/:id/add-participant', verifyToken, checkRole(['admin', 'captain', 'secretary', 'clerk']), validateId, asyncHandler(programController.addParticipant));
  
  // POST send SMS notification to participants
  router.post('/:id/notify-participants', verifyToken, checkRole(['admin', 'captain', 'secretary']), validateId, asyncHandler(programController.notifyParticipants));

  return router;
};