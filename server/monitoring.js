const client = require('prom-client');
const { logger } = require('./middleware/logger');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'barangay-api'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

module.exports = {
  register,
  logger
};
