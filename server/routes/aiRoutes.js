const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../middleware/errorHandler');
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5001';
const AI_SERVICE_ENABLED = process.env.AI_SERVICE_ENABLED === 'true';

module.exports = (db) => {
  // POST OCR processing
  router.post('/ocr', verifyToken, checkRole(['admin', 'secretary', 'clerk']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      const { image_data, document_type } = req.body;
      
      if (!image_data) {
        return res.status(400).json({ error: 'image_data is required' });
      }

      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/ocr/extract`, {
        image_data,
        document_type: document_type || 'general'
      }, {
        timeout: 30000 // 30 second timeout
      });

      res.json({
        success: true,
        extracted_text: response.data.text,
        extracted_fields: response.data.fields || {},
        confidence: response.data.confidence || 0
      });
    } catch (error) {
      console.error('OCR service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'OCR service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  // POST chatbot queries
  router.post('/chatbot', verifyToken, asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'message is required' });
      }

      // Call Python AI service
      const response = await axios.post(`${AI_SERVICE_URL}/chatbot/query`, {
        message,
        context: context || {},
        user_id: req.user.id
      }, {
        timeout: 15000 // 15 second timeout
      });

      res.json({
        success: true,
        response: response.data.response,
        intent: response.data.intent || 'general',
        confidence: response.data.confidence || 0
      });
    } catch (error) {
      console.error('Chatbot service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'Chatbot service unavailable',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }));

  // GET AI analytics
  router.get('/analytics', verifyToken, checkRole(['admin', 'captain']), asyncHandler(async (req, res) => {
    if (!AI_SERVICE_ENABLED) {
      return res.status(503).json({ 
        success: false, 
        message: 'AI service is currently disabled' 
      });
    }

    try {
      const { type, period } = req.query;

      // Call Python AI service
      const response = await axios.get(`${AI_SERVICE_URL}/analytics/${type || 'general'}`, {
        params: { period: period || '30d' },
        timeout: 20000 // 20 second timeout
      });

      res.json({
        success: true,
        analytics: response.data,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics service error:', error.message);
      res.status(503).json({ 
        success: false, 
        message: 'Analytics service unavailable',
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

  return router;
};