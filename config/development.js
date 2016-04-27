// Config specific to local development

const defer = require('config/defer').deferConfig;

module.exports = {
  serverPort: 3000,

  apiHost: process.env.API_HOST || 'https://addons-dev.allizom.org',
  amoCDN: 'https://addons-dev-cdn.allizom.org',

  webpackServerHost: '127.0.0.1',
  webpackServerPort: 3001,
  webpackHost: defer((cfg) => `http://${cfg.webpackServerHost}:${cfg.webpackServerPort}`),

  CSP: {
    directives: {
      connectSrc: defer((cfg) => ["'self'", cfg.apiHost, cfg.webpackHost]),
      scriptSrc: defer((cfg) => ["'self'", cfg.webpackHost]),
      styleSrc: ["'self'", 'blob:'],
    },
    reportOnly: true,
  },
};
