const isProd = import.meta && import.meta.env && import.meta.env.PROD;
const prefix = '[ClearPass]';

const log = (level, ...args) => {
  if (isProd && level === 'debug') return;
  // eslint-disable-next-line no-console
  console[level](`${prefix}`, ...args);
};

export default {
  info: (...args) => log('info', ...args),
  warn: (...args) => log('warn', ...args),
  error: (...args) => log('error', ...args),
  debug: (...args) => log('debug', ...args),
};
