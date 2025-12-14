const express = require('express');
const promClient = require('prom-client');
const { createLogger, format, transports } = require('winston');
const crypto = require('crypto');

// Sensitive data sanitization patterns
const SENSITIVE_PATTERNS = [
  // Email addresses
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Philippine mobile numbers (Philippines typically uses +63 format)
  /(\+63|63|0)[0-9]{10}/g,
  // Credit card numbers (basic pattern - 13-19 digits)
  /\b\d{13,19}\b/g,
  // Home addresses (simple pattern for streets)
  /\b\d+\s+[A-Za-z0-9\s,.#-]+\b/g, // Like "123 Main St, Barangay, City"
  // SSN-like patterns
  /\b\d{4}-\d{2}-\d{4}\b/g  // Philippine format
];

// Sanitization function to redact sensitive data
const sanitizeData = (data) => {
  if (typeof data !== 'string') return data;

  let sanitized = data;
  SENSITIVE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });

  return sanitized;
};

// Enhanced logging format with sanitization
const sanitizedFormat = format((info) => {
  // Sanitize all string values in the log info object
  const sanitized = {};
  for (const [key, value] of Object.entries(info)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeData(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = JSON.parse(sanitizeData(JSON.stringify(value)));
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
});

// Log encryption for sensitive logs
class LogEncryptor {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.encryptionKey = process.env.LOG_ENCRYPTION_KEY ||
                         crypto.randomBytes(32).toString('hex').substring(0, 32);
  }

  encrypt(text) {
    try {
      const salt = crypto.randomBytes(64);
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      return JSON.stringify({
        encrypted,
        salt: salt.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      });
    } catch (error) {
      console.error('Log encryption failed:', error.message);
      return text; // Return unencrypted on failure
    }
  }

  decrypt(encryptedData) {
    try {
      const data = JSON.parse(encryptedData);
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));

      let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Log decryption failed:', error.message);
      return encryptedData; // Return as-is on failure
    }
  }
}

const logEncryptor = new LogEncryptor();

// Encrypted log transport for sensitive data
class EncryptedFileTransport extends transports.File {
  log(level, message, meta, callback) {
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      // Encrypt error logs in production
      const encrypted = logEncryptor.encrypt(message);
      super.log(level, encrypted, meta, callback);
    } else {
      super.log(level, message, meta, callback);
    }
  }
}

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

// Winston logger configuration with sanitization
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    sanitizedFormat(),
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'barangay-api' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple(),
        sanitizedFormat()
      )
    }),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.combine(
        sanitizedFormat(),
        format.timestamp(),
        format.json()
      )
    }),
    new transports.File({
      filename: 'logs/combined.log',
      format: format.combine(
        sanitizedFormat(),
        format.timestamp(),
        format.json()
      )
    })
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

// Log retention policies - automatically clean old logs
class LogRetentionPolicy {
  constructor() {
    this.retentionDays = process.env.LOG_RETENTION_DAYS || 90; // Default 90 days
    this.archiveDir = path.join(__dirname, 'logs', 'archive');
    this.fs = require('fs').promises;
    this.path = require('path');
  }

  /**
   * Initialize log cleanup schedule
   */
  initializeCleanupSchedule() {
    // Run cleanup daily at 2 AM
    const cleanupInterval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    setInterval(() => {
      console.log('🔄 Running automated log cleanup...');
      this.cleanupOldLogs().catch(err => {
        console.error('Log cleanup failed:', err.message);
      });
    }, cleanupInterval);

    console.log(`📋 Log retention policy active: ${this.retentionDays} days`);

    // Run initial cleanup
    this.cleanupOldLogs().catch(err => {
      console.warn('Initial log cleanup failed:', err.message);
    });
  }

  /**
   * Clean up logs older than retention period
   */
  async cleanupOldLogs() {
    try {
      const logsDir = this.path.join(__dirname, 'logs');
      const files = await this.fs.readdir(logsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let cleanedCount = 0;
      let archivedCount = 0;

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = this.path.join(logsDir, file);
        const stats = await this.fs.stat(filePath);

        if (stats.mtime < cutoffDate) {
          try {
            // Archive file before deleting
            await this.archiveLogFile(filePath, file);
            archivedCount++;

            // Delete original file
            await this.fs.unlink(filePath);
            cleanedCount++;
          } catch (error) {
            console.error(`Failed to clean up log file ${file}:`, error.message);
          }
        }
      }

      if (cleanedCount > 0 || archivedCount > 0) {
        logger.info('Log cleanup completed', {
          cleanedCount,
          archivedCount,
          retentionDays: this.retentionDays
        });
      }

    } catch (error) {
      logger.error('Log cleanup error', { error: error.message });
    }
  }

  /**
   * Archive a log file with compression
   */
  async archiveLogFile(filePath, filename) {
    try {
      // Ensure archive directory exists
      await this.fs.mkdir(this.archiveDir, { recursive: true });

      const archivePath = this.path.join(
        this.archiveDir,
        `${filename}.${Date.now()}.archived`
      );

      // Copy file to archive (in a real implementation, this could be compressed)
      await this.fs.copyFile(filePath, archivePath);

    } catch (error) {
      console.warn(`Failed to archive log file ${filename}:`, error.message);
      // Don't throw - we still want to delete the original file
    }
  }

  /**
   * Get log statistics
   */
  async getLogStatistics() {
    try {
      const logsDir = this.path.join(__dirname, 'logs');
      const files = await this.fs.readdir(logsDir);

      const stats = {
        totalLogs: 0,
        totalSize: 0,
        oldestLog: null,
        newestLog: null
      };

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = this.path.join(logsDir, file);
        const fileStats = await this.fs.stat(filePath);

        stats.totalLogs++;
        stats.totalSize += fileStats.size;

        if (!stats.oldestLog || fileStats.mtime < stats.oldestLog.mtime) {
          stats.oldestLog = { name: file, mtime: fileStats.mtime };
        }

        if (!stats.newestLog || fileStats.mtime > stats.newestLog.mtime) {
          stats.newestLog = { name: file, mtime: fileStats.mtime };
        }
      }

      return stats;
    } catch (error) {
      console.error('Failed to get log statistics:', error.message);
      return null;
    }
  }
}

// Initialize log retention policy
const logRetentionPolicy = new LogRetentionPolicy();
logRetentionPolicy.initializeCleanupSchedule();

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
  logRetentionPolicy,
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
