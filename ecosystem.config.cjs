module.exports = {
  apps: [{
    name: 'clearpass-server',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    }
  }, {
    name: 'clearpass-client',
    script: 'serve',
    env: {
      PM2_SERVE_PATH: './client/dist',
      PM2_SERVE_PORT: 5173,
      PM2_SERVE_SPA: 'true',
      PM2_SERVE_HOMEPAGE: '/index.html'
    }
  }]
};
