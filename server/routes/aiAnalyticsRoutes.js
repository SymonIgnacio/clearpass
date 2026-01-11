const express = require('express');
const AIAnalyticsController = require('../controllers/aiAnalyticsController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = (db) => {
  const router = express.Router();
  const controller = new AIAnalyticsController(db);

  // Clerk workload insights
  router.get('/clerk-insights', verifyToken, checkRole([ROLES.CLERK]), (req, res) => controller.getClerkWorkloadInsights(req, res));

  // Captain executive insights
  router.get('/captain-insights', verifyToken, checkRole([ROLES.CAPTAIN]), (req, res) => controller.getCaptainExecutiveInsights(req, res));

  // Secretary risk analytics
  router.get('/secretary-analytics', verifyToken, checkRole([ROLES.SECRETARY]), (req, res) => controller.getSecretaryRiskAnalytics(req, res));

  // Generate reports
  router.get('/reports', verifyToken, checkRole([ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.BLOTTER_OFFICER]), (req, res) => controller.generateReport(req, res));

  return router;
};
