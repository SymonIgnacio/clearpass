const express = require('express');
const ResidentProfileController = require('../controllers/residentProfileController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  const router = express.Router();
  const controller = new ResidentProfileController(db);

  // Get profile
  router.get('/profile', verifyToken, checkRole([12]), (req, res) => controller.getProfile(req, res));

  // Update profile
  router.put('/profile', verifyToken, checkRole([12]), (req, res) => controller.updateProfile(req, res));

  // Update beneficiary status
  router.put('/beneficiary-status', verifyToken, checkRole([12]), (req, res) => controller.updateBeneficiaryStatus(req, res));

  // Get verification status
  router.get('/verification-status', verifyToken, checkRole([12]), (req, res) => controller.getVerificationStatus(req, res));

  return router;
};