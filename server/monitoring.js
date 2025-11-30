const express = require('express');
const promClient = require('prom-client');
const { createLogger, format, transports } = require('winston');

// Create metrics registry
const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const databaseQueryDuration = new promClient.Histogram({
  name: 'database_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['query_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

const aiServiceRequestsTotal = new promClient.Counter({
  name: 'ai_service_requests_total',
  help: 'Total number of AI service requests',
  labelNames: ['service', 'status']
});

const certificateIssuanceTotal = new promClient.Counter({
  name: 'certificate_issuance_total',
  help: 'Total number of certificates issued',
  labelNames: ['type', 'status']
});

const errorTotal = new promClient.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'endpoint']
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(databaseQueryDuration);
register.registerMetric(aiServiceRequestsTotal);
register.registerMetric(certificateIssuanceTotal);
register.registerMetric(errorTotal);

// Winston logger configuration
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'barangay-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  ]
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log incoming request
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Track response
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    // Update Prometheus metrics
    httpRequestDuration
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .observe(duration);

    httpRequestsTotal
      .labels(req.method, req.route?.path || req.url, res.statusCode)
      .inc();

    // Log response
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration.toFixed(3)}s`,
      contentLength: res.get('Content-Length')
    });
  });

  next();
};

// Database query monitoring
const monitorDatabaseQuery = async (queryType, queryFn) => {
  const start = process.hrtime.bigint();

  try {
    const result = await queryFn();
    const duration = Number(process.hrtime.bigint() - start) / 1e9;

    databaseQueryDuration
      .labels(queryType)
      .observe(duration);

    return result;
  } catch (error) {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;

    databaseQueryDuration
      .labels(queryType)
      .observe(duration);

    errorTotal
      .labels('database', queryType)
      .inc();

    logger.error('Database query error', {
      queryType,
      duration,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
};

// AI service monitoring
const monitorAIService = async (serviceName, serviceFn) => {
  try {
    const result = await serviceFn();

    aiServiceRequestsTotal
      .labels(serviceName, 'success')
      .inc();

    return result;
  } catch (error) {
    aiServiceRequestsTotal
      .labels(serviceName, 'error')
      .inc();

    errorTotal
      .labels('ai_service', serviceName)
      .inc();

    logger.error('AI service error', {
      service: serviceName,
      error: error.message,
      stack: error.stack
    });

    throw error;
  }
};

// Certificate issuance monitoring
const monitorCertificateIssuance = (certificateType, status) => {
  certificateIssuanceTotal
    .labels(certificateType, status)
    .inc();

  logger.info('Certificate issued', {
    type: certificateType,
    status
  });
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  errorTotal
    .labels('application', req.route?.path || req.url)
    .inc();

  logger.error('Unhandled error', {
    method: req.method,
    url: req.url,
    error: error.message,
    stack: error.stack,
    ip: req.ip
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const errorResponse = {
    error: isDevelopment ? error.message : 'Internal server error',
    timestamp: new Date().toISOString(),
    path: req.url
  };

  if (isDevelopment) {
    errorResponse.stack = error.stack;
  }

  res.status(error.status || 500).json(errorResponse);
};

// Health check with detailed metrics
const healthCheck = async (db) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.hrtime()[0],
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // Database health check
    await db.execute('SELECT 1');
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unhealthy';
    checks.status = 'unhealthy';
    logger.error('Database health check failed', { error: error.message });
  }

  try {
    // AI service health check
    const axios = require('axios');
    await axios.get(`${process.env.AI_SERVICE_URL}/health`, { timeout: 5000 });
    checks.ai_service = 'healthy';
  } catch (error) {
    checks.ai_service = 'unhealthy';
    logger.warn('AI service health check failed', { error: error.message });
  }

  // Performance metrics
  checks.metrics = {
    active_connections: 0, // Would be populated from connection pool
    pending_requests: 0,
    average_response_time: 0
  };

  const isHealthy = checks.status === 'healthy';
  return { checks, isHealthy };
};

// Alerting thresholds
const ALERT_THRESHOLDS = {
  response_time_p95: 2.0, // seconds
  error_rate: 0.05, // 5%
  database_connection_pool_exhausted: 0.9, // 90%
  memory_usage: 0.85 // 85%
};

// Alert checking function
const checkAlerts = (metrics) => {
  const alerts = [];

  // Response time alert
  if (metrics.response_time_p95 > ALERT_THRESHOLDS.response_time_p95) {
    alerts.push({
      severity: 'warning',
      message: `High response time: ${metrics.response_time_p95}s (threshold: ${ALERT_THRESHOLDS.response_time_p95}s)`,
      metric: 'response_time_p95'
    });
  }

  // Error rate alert
  if (metrics.error_rate > ALERT_THRESHOLDS.error_rate) {
    alerts.push({
      severity: 'error',
      message: `High error rate: ${(metrics.error_rate * 100).toFixed(2)}% (threshold: ${(ALERT_THRESHOLDS.error_rate * 100).toFixed(2)}%)`,
      metric: 'error_rate'
    });
  }

  // Memory usage alert
  const memoryUsage = process.memoryUsage().heapUsed / process.memoryUsage().heapTotal;
  if (memoryUsage > ALERT_THRESHOLDS.memory_usage) {
    alerts.push({
      severity: 'warning',
      message: `High memory usage: ${(memoryUsage * 100).toFixed(2)}% (threshold: ${(ALERT_THRESHOLDS.memory_usage * 100).toFixed(2)}%)`,
      metric: 'memory_usage'
    });
  }

  return alerts;
};

module.exports = {
  register,
  logger,
  requestLogger,
  monitorDatabaseQuery,
  monitorAIService,
  monitorCertificateIssuance,
  errorHandler,
  healthCheck,
  checkAlerts,
  ALERT_THRESHOLDS,
  // Export individual metrics for testing
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    databaseQueryDuration,
    aiServiceRequestsTotal,
    certificateIssuanceTotal,
    errorTotal
  }
};
