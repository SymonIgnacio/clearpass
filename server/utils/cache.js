const redis = require('redis');
const { logger } = require('../monitoring');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: retries => Math.min(retries * 50, 500),
        },
      });

      this.client.on('error', err => logger.error('Redis error', { error: err.message }));
      this.client.on('connect', () => logger.info('Redis connected'));
      this.client.on('disconnect', () => {
        this.isConnected = false;
        logger.warn('Redis disconnected');
      });

      await this.client.connect();
      this.isConnected = true;
      logger.info('Cache service initialized');
    } catch (error) {
      logger.warn('Redis unavailable, using memory cache fallback', { error: error.message });
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (!this.isConnected) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidate error', { pattern, error: error.message });
      return false;
    }
  }

  async disconnect() {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

const cacheService = new CacheService();

// Middleware for caching GET requests
const cacheMiddleware = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();

    const key = `cache:${req.originalUrl}`;
    const cached = await cacheService.get(key);

    if (cached) {
      logger.info('Cache hit', { key });
      return res.json(cached);
    }

    const originalJson = res.json.bind(res);
    res.json = data => {
      cacheService.set(key, data, ttl);
      return originalJson(data);
    };

    next();
  };
};

module.exports = { cacheService, cacheMiddleware };
