const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');
const AIAnalysisService = require('../services/AIAnalysisService');
const AIAnalyticsController = require('../controllers/aiAnalyticsController');

function normalizeAiServiceUrl(rawUrl) {
  const fallbackUrl = 'http://127.0.0.1:5000';
  const input = (rawUrl || '').trim();
  if (!input) return fallbackUrl;

  try {
    const url = new URL(input);
    if (url.hostname === 'localhost') url.hostname = '127.0.0.1';
    if (url.hostname === '::1') url.hostname = '127.0.0.1';
    return url.toString().replace(/\/$/, '');
  } catch {
    return input.replace(/\/$/, '');
  }
}

const AI_SERVICE_ADDRESS = normalizeAiServiceUrl(process.env.AI_SERVICE_URL);
// Force true default if undefined, but respect 'false' string
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED !== 'false';
const AI_SERVICE_SECRET = process.env.AI_SERVICE_SECRET || 'clearpass-ai-secret-dev';

const aiServiceAxios = axios.create({
  baseURL: AI_SERVICE_ADDRESS,
  timeout: 15000,
  headers: {
    'X-Service-Key': AI_SERVICE_SECRET,
    'Content-Type': 'application/json',
  },
});

module.exports = db => {
  const aiService = new AIAnalysisService(db);
  const analyticsController = new AIAnalyticsController(db);

  // POST chatbot queries
  router.post(
    '/chatbot',
    verifyToken,
    asyncHandler(async (req, res) => {
      if (!AI_SERVICE_ENABLED) {
        return res.status(503).json({
          success: false,
          message: 'AI service is currently disabled',
        });
      }

      try {
        const { message } = req.body;

        if (!message) {
          return res.status(400).json({ error: 'message is required' });
        }

        // Call Python AI service
        const response = await aiServiceAxios.post('/chatbot/message', {
          message,
        });

        // Audit the interaction
        const confidence = response.data.confidence || 0.0;
        await aiService.logAnalysis({
          analysisType: 'CHATBOT_INTERACTION',
          parameters: { message },
          results: response.data,
          confidenceScore: confidence,
          userId: req.user ? req.user.id : null,
          facts: response.data.intent
            ? [
                {
                  fact_type: 'INTENT_DETECTED',
                  fact_value: response.data.intent,
                  source: 'ml_model',
                  confidence: confidence,
                },
              ]
            : [],
        });

        const blocked = (response.data.actions || []).some(a => /schedule|book/i.test(a));
        const safeActions = (response.data.actions || []).filter(a => !/schedule|book/i.test(a));
        const guidanceOnly = {
          response: 'Bantay provides guidance only. I can give step‑by‑step instructions.',
          intent: 'guide_notice',
          confidence: confidence,
          actions: [],
          appointment_booked: false,
          requires_followup: false,
          type: 'text',
          steps: [],
          resources: [],
          disclaimers: ['No scheduling or booking via chat.'],
        };

        const payload = {
          ...response.data,
          actions: safeActions,
          requires_followup: false,
        };

        res.json(blocked ? guidanceOnly : payload);
      } catch (error) {
        console.error('Chatbot service error:', error.message);
        res.status(503).json({
          success: false,
          message: 'Chatbot service unavailable',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
      }
    })
  );

  // GET Patrol Suggestions (Hybrid Analysis)
  router.get(
    '/patrol-suggestions',
    verifyToken,
    checkRole(['admin', 'captain', 'officer']),
    (req, res) => analyticsController.getPatrolSuggestions(req, res)
  );

  // GET AI service health check
  router.get(
    '/health',
    verifyToken,
    checkRole(['admin']),
    asyncHandler(async (req, res) => {
      if (!AI_SERVICE_ENABLED) {
        return res.json({
          status: 'disabled',
          message: 'AI service is disabled in configuration',
        });
      }

      try {
        const response = await aiServiceAxios.get('/health', {
          timeout: 5000, // 5 second timeout
        });

        res.json({
          status: 'healthy',
          ai_service: response.data,
          url: AI_SERVICE_URL,
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          message: 'AI service is not responding',
          url: AI_SERVICE_URL,
          error: error.message,
        });
      }
    })
  );

  return router;
};
