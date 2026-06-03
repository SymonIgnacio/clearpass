const isProduction = env => env.NODE_ENV === 'production';

const hasAny = (env, names) => names.some(name => Boolean(env[name]));

const getMissingServerEnv = (env = process.env) => {
  const missing = [];
  const usesDatabaseUrl = Boolean(env.DATABASE_URL);

  if (!usesDatabaseUrl) {
    ['DB_HOST', 'DB_USER', 'DB_NAME'].forEach(name => {
      if (!env[name]) missing.push(name);
    });
  }

  if (!env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (isProduction(env)) {
    if (!usesDatabaseUrl && !env.DB_PASSWORD) {
      missing.push('DB_PASSWORD');
    }

    if (!hasAny(env, ['FRONTEND_URL', 'FRONTEND_URLS'])) {
      missing.push('FRONTEND_URL or FRONTEND_URLS');
    }

    if ((env.JWT_SECRET || '').length < 32) {
      missing.push('JWT_SECRET with at least 32 characters');
    }
  }

  return missing;
};

const validateServerEnv = (env = process.env) => {
  const missing = getMissingServerEnv(env);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const parseDatabaseUrl = value => {
  const url = new URL(value);
  return {
    host: url.hostname,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    port: Number.parseInt(url.port || '3306', 10),
  };
};

const getDatabaseConfig = (env = process.env) => {
  if (env.DATABASE_URL && env.NODE_ENV !== 'test') {
    return parseDatabaseUrl(env.DATABASE_URL);
  }

  const production = isProduction(env);
  return {
    host: env.DB_HOST || (production ? undefined : 'localhost'),
    user: env.DB_USER || (production ? undefined : 'root'),
    password: env.DB_PASSWORD ?? (production ? undefined : ''),
    database:
      env.NODE_ENV === 'test'
        ? env.DB_NAME_TEST || 'barangay_management_test'
        : env.DB_NAME || (production ? undefined : 'barangay_management'),
    port: Number.parseInt(env.DB_PORT || '3306', 10),
  };
};

module.exports = {
  getDatabaseConfig,
  getMissingServerEnv,
  validateServerEnv,
};
