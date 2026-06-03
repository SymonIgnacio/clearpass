const parseOrigins = value =>
  String(value || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const getCorsOrigins = (env = process.env) =>
  env.NODE_ENV === 'production'
    ? [...parseOrigins(env.FRONTEND_URLS), ...parseOrigins(env.FRONTEND_URL)]
    : [
        'http://localhost:3002',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ];

const createCorsOptions = (env = process.env, logger = console) => ({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, env.NODE_ENV !== 'production' || env.ALLOW_NO_ORIGIN_REQUESTS === 'true');
    }

    if (getCorsOrigins(env).includes(origin)) {
      return callback(null, true);
    }

    logger.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
});

module.exports = {
  createCorsOptions,
  getCorsOrigins,
  parseOrigins,
};
