// Config specific to local development

const webpackServerHost = '127.0.0.1';
const webpackServerPort = 3001;
const webpackHost = `${webpackServerHost}:${webpackServerPort}`;
const apiHost = 'https://addons-dev.allizom.org';
const amoCDN = 'https://addons-dev-cdn.allizom.org';
const apiBase = `${apiHost}/api/v3`;
const startLoginUrl = `${apiBase}/internal/accounts/login/start/`;


module.exports = {

  apiHost,
  amoCDN,

  isDeployed: false,
  isDevelopment: true,

  serverPort: 3000,
  startLoginUrl,
  webpackServerHost,
  webpackServerPort,
  webpackHost,

  CSP: {
    directives: {
      connectSrc: [
        "'self'",
        amoCDN,
        webpackHost,
      ],
      scriptSrc: [
        "'self'",
        amoCDN,
        webpackHost,
      ],
      styleSrc: ["'self'", 'blob:'],
    },
    reportOnly: true,
  },
};
