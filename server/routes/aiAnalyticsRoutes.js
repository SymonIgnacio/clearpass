const express = require('express');
const AIAnalyticsController = require('../controllers/aiAnalyticsController');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');

module.exports = (db) => {
  const router = express.Router();
  const controller = new AIAnalyticsController(db);

  // Clerk workload insights
  router.get('/clerk-insights', verifyToken, checkRole([4]), (req, res) => controller.getClerkWorkloadInsights(req, res));

  // Captain executive insights
  router.get('/captain-insights', verifyToken, checkRole([2]), (req, res) => controller.getCaptainExecutiveInsights(req, res));

  // Secretary risk analytics
  router.get('/secretary-analytics', verifyToken, checkRole([3]), (req, res) => controller.getSecretaryRiskAnalytics(req, res));

  // Generate reports
  router.get('/reports', verifyToken, checkRole([2, 3, 6]), (req, res) => controller.generateReport(req, res));

  return router;
};