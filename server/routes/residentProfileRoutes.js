const express = require('express');
const ResidentProfileController = require('../controllers/residentProfileController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');
const { upload } = require('../middleware/upload');

module.exports = db => {
  const router = express.Router();
  const controller = new ResidentProfileController(db);

  // Get profile
  router.get('/profile', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) =>
    controller.getProfile(req, res)
  );

  // Update profile
  router.put('/profile', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) =>
    controller.updateProfile(req, res)
  );

  // Update beneficiary status
  router.put(
    '/beneficiary-status',
    verifyToken,
    checkRole([ROLES.RESIDENT, ROLES.GUEST]),
    upload.fields([
      { name: 'Is_4Ps_File', maxCount: 1 },
      { name: 'Is_PWD_File_Front', maxCount: 1 },
      { name: 'Is_PWD_File_Back', maxCount: 1 },
      { name: 'Is_Senior_File_Front', maxCount: 1 },
      { name: 'Is_Senior_File_Back', maxCount: 1 },
      { name: 'Is_Solo_Parent_File_Front', maxCount: 1 },
      { name: 'Is_Solo_Parent_File_Back', maxCount: 1 },
      { name: 'Is_Out_of_School_Youth_File', maxCount: 1 },
    ]),
    (req, res) => controller.updateBeneficiaryStatus(req, res)
  );

  // Get verification status
  router.get(
    '/verification-status',
    verifyToken,
    checkRole([ROLES.RESIDENT, ROLES.GUEST]),
    (req, res) => controller.getVerificationStatus(req, res)
  );

  // Resident Dashboard Stats
  router.get('/dashboard', verifyToken, checkRole([ROLES.RESIDENT, ROLES.GUEST]), (req, res) =>
    controller.getDashboardStats(req, res)
  );

  return router;
};
