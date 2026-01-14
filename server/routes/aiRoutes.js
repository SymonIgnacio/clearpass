const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');
const AIAnalysisService = require('../services/AIAnalysisService');

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

const AI_SERVICE_URL = normalizeAiServiceUrl(process.env.AI_SERVICE_URL);
// Force true default if undefined, but respect 'false' string
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED !== 'false';

module.exports = (db) => {
  const aiService = new AIAnalysisService(db);

  // POST chatbot queries
  router.post('/chatbot', verifyToken, asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/chatbot/message`, {
        message
      }, {
        timeout: 15000 // 15 second timeout
      });

      // Audit the interaction
      const confidence = response.data.confidence || 0.0;
      await aiService.logAnalysis({
        analysisType: 'CHATBOT_INTERACTION',
        parameters: { message },
        results: response.data,
        confidenceScore: confidence,
        userId: req.user ? req.user.id : null,
        facts: response.data.intent ? [{
          fact_type: 'INTENT_DETECTED',
          fact_value: response.data.intent,
          source: 'ml_model',
          confidence: confidence
        }] : []
      });

      res.json(response.data);
    } catch (error) {
      console.error('Chatbot service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'Chatbot service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  // POST Social Aid Priority Calculation
  router.post('/priority', verifyToken, checkRole(['admin', 'secretary', 'clerk', 'captain']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      // Call Python AI service with resident data
      const response = await axios.post(`${AI_SERVICE_URL}/api/calculate-priority`, req.body, {
        timeout: 10000
      });

      // Audit the priority calculation
      const auditId = await aiService.logAnalysis({
        analysisType: 'PRIORITY_CALCULATION',
        parameters: req.body,
        results: response.data,
        confidenceScore: 1.0, // Rule-based
        userId: req.user ? req.user.id : null,
        facts: [{
          fact_type: 'PRIORITY_LEVEL',
          fact_value: response.data.priority,
          source: 'rule_engine'
        }]
      });

      res.json({
        success: true,
        audit_id: auditId,
        data: response.data
      });
    } catch (error) {
      console.error('Priority service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'Priority calculation service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  // POST Intelligent Patrol Suggestions
  router.post('/patrol', verifyToken, checkRole(['admin', 'captain', 'officer']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      // 1. Fetch real blotter data from the last 30 days
      const [rows] = await db.execute(`
        SELECT Location_Sitio, Incident_Type, DateTime_Incident 
        FROM blotter 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY DateTime_Incident DESC
      `);

      // 2. Send to AI service for analysis
      const response = await axios.post(`${AI_SERVICE_URL}/suggest-patrol`, {
        blotter_data: rows
      }, {
        timeout: 30000 // 30 second timeout for analysis
      });

      // 3. Audit the patrol suggestion
      const confidence = aiService.calculateConfidence(rows.length);
      const auditId = await aiService.logAnalysis({
        analysisType: 'PYTHON_PATROL_SUGGESTION',
        parameters: { range: '30_days', data_points: rows.length },
        results: response.data,
        confidenceScore: confidence,
        userId: req.user ? req.user.id : null
      });

      res.json({
        success: true,
        audit_id: auditId,
        confidence_score: confidence,
        data: response.data,
        analyzed_count: rows.length
      });
    } catch (error) {
      console.error('Patrol service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'Patrol suggestion service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  // GET AI service health check
  router.get('/health', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.json({ 
        status: 'disabled',
        message: 'AI service is disabled in configuration'
      });
    }

    try {
      const response = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000 // 5 second timeout
      });

      res.json({
        status: 'healthy',
        ai_service: response.data,
        url: AI_SERVICE_URL
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        message: 'AI service is not responding',
        url: AI_SERVICE_URL,
        error: error.message
      });
    }
  }));

  // GET General AI Analytics
  router.get('/analytics', verifyToken, checkRole(['admin']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      // Call Python AI service for general analytics
      const response = await axios.get(`${AI_SERVICE_URL}/analytics/general`, {
        timeout: 5000
      });

      res.json(response.data);
    } catch (error) {
      console.error('AI analytics service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'AI analytics service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  return router;
};
