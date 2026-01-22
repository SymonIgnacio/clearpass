const express = require('express');
const AIAnalyticsController = require('../controllers/aiAnalyticsController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/roles');

module.exports = db => {
  const router = express.Router();
  const controller = new AIAnalyticsController(db);

  // Dashboard Summary (Ronda Analytics)
  router.get(
    '/dashboard-summary',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
    (req, res) => controller.getDashboardSummary(req, res)
  );

  // Charts Data (Ronda Analytics)
  router.get(
    '/charts/:type',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.CLERK, ROLES.BLOTTER_OFFICER]),
    (req, res) => controller.getChartData(req, res)
  );

  // Clerk workload insights
  router.get('/clerk-insights', verifyToken, checkRole([ROLES.ADMIN, ROLES.CLERK]), (req, res) =>
    controller.getClerkWorkloadInsights(req, res)
  );

  // Captain executive insights
  router.get(
    '/captain-insights',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.CAPTAIN]),
    (req, res) => controller.getCaptainExecutiveInsights(req, res)
  );

  // Secretary risk analytics
  router.get(
    '/secretary-analytics',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.SECRETARY]),
    (req, res) => controller.getSecretaryRiskAnalytics(req, res)
  );

  // Generate reports (GET)
  router.get(
    '/reports',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.BLOTTER_OFFICER]),
    (req, res) => controller.generateReport(req, res)
  );

  // Generate reports (POST)
  router.post(
    '/generate-report',
    verifyToken,
    checkRole([ROLES.ADMIN, ROLES.CAPTAIN, ROLES.SECRETARY, ROLES.BLOTTER_OFFICER]),
    (req, res) => controller.generateReport(req, res)
  );

  return router;
};
