const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { register } = require('../monitoring');

// Get performance metrics
router.get('/metrics', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const metrics = await register.metrics();
    res.set('Content-Type', register.contentType);
    res.send(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Get system health
router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
    },
    cpu: process.cpuUsage()
  };
  res.json(health);
});

// Get performance summary
router.get('/summary', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const [dbStats] = await db.execute('SHOW STATUS LIKE "Threads_connected"');
    const [slowQueries] = await db.execute('SHOW STATUS LIKE "Slow_queries"');
    const [uptime] = await db.execute('SHOW STATUS LIKE "Uptime"');
    
    const summary = {
      application: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      },
      database: {
        connections: dbStats[0]?.Value || 0,
        slowQueries: slowQueries[0]?.Value || 0,
        uptime: uptime[0]?.Value || 0
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch performance summary' });
  }
});

module.exports = router;