const winston = require('winston');

// Performance logger
const perfLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.File({ filename: 'logs/performance.log' })],
});

// Query performance wrapper
const monitorQuery = async (db, query, params, label = 'Query') => {
  const start = Date.now();
  try {
    const result = await db.execute(query, params);
    const duration = Date.now() - start;

    if (duration > 1000) {
      perfLogger.warn({
        type: 'SLOW_QUERY',
        label,
        duration,
        query: query.substring(0, 200),
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    perfLogger.error({
      type: 'QUERY_ERROR',
      label,
      duration,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// Request performance middleware
const requestPerformance = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    if (duration > 3000) {
      perfLogger.warn({
        type: 'SLOW_REQUEST',
        method: req.method,
        url: req.originalUrl,
        duration,
        statusCode: res.statusCode,
        timestamp: new Date().toISOString(),
      });
    }
  });

  next();
};

// Cache utility (simple in-memory cache)
class SimpleCache {
  constructor(ttl = 300000) {
    // 5 minutes default
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + this.ttl,
    });
  }

  clear() {
    this.cache.clear();
  }

  delete(key) {
    this.cache.delete(key);
  }
}

// Census data cache (5 minutes)
const censusCache = new SimpleCache(300000);

// Resident list cache (2 minutes)
const residentCache = new SimpleCache(120000);

module.exports = {
  monitorQuery,
  requestPerformance,
  SimpleCache,
  censusCache,
  residentCache,
  perfLogger,
};
