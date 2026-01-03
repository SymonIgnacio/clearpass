const healthCheck = async (db) => {
  const checks = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  // Database check
  try {
    const start = Date.now();
    await db.execute('SELECT 1');
    checks.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - start
    };
  } catch (error) {
    checks.status = 'unhealthy';
    checks.checks.database = {
      status: 'unhealthy',
      error: error.message
    };
  }

  // Memory check
  const memUsage = process.memoryUsage();
  checks.checks.memory = {
    status: memUsage.heapUsed < memUsage.heapTotal * 0.9 ? 'healthy' : 'warning',
    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`
  };

  // Disk space check (simplified)
  checks.checks.disk = {
    status: 'healthy',
    message: 'Disk check not implemented'
  };

  return {
    checks,
    isHealthy: checks.status === 'healthy'
  };
};

module.exports = { healthCheck };
