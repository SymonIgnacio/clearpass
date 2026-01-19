const express = require('express');
const ResidentProfileController = require('../controllers/residentProfileController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new ResidentProfileController(db);

  // Get profile
  router.get('/profile', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) => controller.getProfile(req, res));

  // Update profile
  router.put('/profile', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) => controller.updateProfile(req, res));

  // Update beneficiary status
  router.put('/beneficiary-status', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) => controller.updateBeneficiaryStatus(req, res));

  // Get verification status
  router.get('/verification-status', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) => controller.getVerificationStatus(req, res));

  // Resident Dashboard Stats
  router.get('/dashboard', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) => controller.getDashboardStats(req, res));

  return router;
};
