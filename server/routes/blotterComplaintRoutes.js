const express = require('express');
const BlotterComplaintController = require('../controllers/blotterComplaintController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new BlotterComplaintController(db);

  // Get incident types
  router.get('/incident-types', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.getIncidentTypes(req, res));

  // Submit complaint
  router.post('/submit', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.submitComplaint(req, res));

  // Get my complaints
  router.get('/my-complaints', verifyToken, checkRole([ROLES.RESIDENT]), (req, res) => controller.getMyComplaints(req, res));

  return router;
};
