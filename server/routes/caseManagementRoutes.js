const express = require('express');
const CaseManagementController = require('../controllers/caseManagementController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new CaseManagementController(db);

  router.get('/cases', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getCasesByOfficer(req, res));
  router.get('/cases/:case_id', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getCaseDetails(req, res));
  router.put('/cases/:case_id/status', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.updateCaseStatus(req, res));
  router.post('/cases/:case_id/notes', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.addCaseNote(req, res));
  
  router.get('/hearings', verifyToken, checkRole([ROLES.BLOTTER_OFFICER]), (req, res) => controller.getHearings(req, res));

  return router;
};
