const performanceMetrics = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (duration > 1000) {
      console.warn('⚠️ Slow request:', logData);
    }
  });
  
  next();
};

module.exports = performanceMetrics;
