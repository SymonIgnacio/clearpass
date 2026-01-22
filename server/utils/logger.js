const winston = require('winston');
const path = require('path');

// Define log levels and colors
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Custom format for logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(meta).length > 0 && { meta }),
    };
    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;

    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }

    return log;
  })
);

// Create main logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: logFormat,
  transports: [
    // Error log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      handleExceptions: true,
      handleRejections: true,
    }),

    // Combined log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Security-specific log file
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    }),
  ],

  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log'),
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: 'debug',
    })
  );
}

// Security logging utilities
const securityLogger = {
  logAuthAttempt: (req, success, reason = null) => {
    logger.warn('Authentication attempt', {
      type: 'auth_attempt',
      success,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      username: req.body?.username,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  logAuthorizationFailure: (req, resource, reason) => {
    logger.warn('Authorization failure', {
      type: 'authz_failure',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      resource: `${req.method} ${req.originalUrl}`,
      reason,
      timestamp: new Date().toISOString(),
    });
  },

  logSuspiciousActivity: (req, activity, details = {}) => {
    logger.error('Suspicious activity detected', {
      type: 'suspicious_activity',
      activity,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  logDataBreach: (req, dataType, details = {}) => {
    logger.error('Potential data breach', {
      type: 'data_breach',
      dataType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      details,
      timestamp: new Date().toISOString(),
    });
  },

  logRateLimitExceeded: (req, limitType) => {
    logger.warn('Rate limit exceeded', {
      type: 'rate_limit',
      limitType,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      endpoint: `${req.method} ${req.originalUrl}`,
      timestamp: new Date().toISOString(),
    });
  },

  logCsrfViolation: (req, reason) => {
    logger.error('CSRF violation detected', {
      type: 'csrf_violation',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      referer: req.get('Referer'),
      origin: req.get('Origin'),
      reason,
      timestamp: new Date().toISOString(),
    });
  },
};

// API request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.http('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    return res.send(data);
  };

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    logger.log(level, 'Request completed', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

// Database operation logger
const dbLogger = {
  logQuery: (query, params, duration, error = null) => {
    const level = error ? 'error' : 'debug';
    const logData = {
      type: 'database_query',
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      paramCount: params ? params.length : 0,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    if (error) {
      logData.error = error.message;
    }

    logger.log(level, 'Database operation', logData);
  },

  logTransaction: (operation, success, details = {}) => {
    const level = success ? 'info' : 'error';
    logger.log(level, 'Database transaction', {
      type: 'database_transaction',
      operation,
      success,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// System health logger
const healthLogger = {
  logSystemMetrics: metrics => {
    logger.info('System metrics', {
      type: 'system_metrics',
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  },

  logServiceStatus: (service, status, details = {}) => {
    const level = status === 'healthy' ? 'info' : 'warn';
    logger.log(level, 'Service status', {
      type: 'service_status',
      service,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },
};

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
  logger,
  securityLogger,
  requestLogger,
  dbLogger,
  healthLogger,
};
