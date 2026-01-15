const winston = require('winston');
require('winston-daily-rotate-file');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'barangay-api' },
  transports: [
    // Error logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    // Combined logs
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
    // Audit logs (for CRUD operations)
    new winston.transports.DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info',
    })
  ]
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Audit logging middleware
const auditLog = (action, resource) => (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    logger.info('Audit Log', {
      action,
      resource,
      user: req.user?.id || 'anonymous',
      username: req.user?.username || 'anonymous',
      role: req.user?.role || 'none',
      method: req.method,
      path: req.path,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      body: req.method !== 'GET' ? req.body : undefined
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = { logger, auditLog };
