const express = require('express');
const BlotterComplaintController = require('../controllers/blotterComplaintController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  const router = express.Router();
  const controller = new BlotterComplaintController(db);

  // Get incident types
  router.get('/incident-types', verifyToken, checkRole([12]), (req, res) => controller.getIncidentTypes(req, res));

  // Submit complaint
  router.post('/submit', verifyToken, checkRole([12]), (req, res) => controller.submitComplaint(req, res));

  // Get my complaints
  router.get('/my-complaints', verifyToken, checkRole([12]), (req, res) => controller.getMyComplaints(req, res));

  return router;
};