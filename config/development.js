// Config specific to local development
import { amoDevCDN, apiDevHost, sentryHost } from './lib/shared';

const webpackServerHost = '127.0.0.1';
const webpackServerPort = 3001;
const webpackHost = `${webpackServerHost}:${webpackServerPort}`;


module.exports = {
  apiHost: apiDevHost,
  amoCDN: amoDevCDN,

  // Statics will be served by node.
  staticHost: undefined,

  isDeployed: false,
  isDevelopment: true,

  cookieSecure: false,

  enableClientConsole: true,

  serverPort: 3000,
  webpackServerHost,
  webpackServerPort,
  webpackHost,

  CSP: {
    directives: {
      connectSrc: [
        "'self'",
        amoDevCDN,
        sentryHost,
        webpackHost,
      ],
      imgSrc: [
        "'self'",
        webpackHost,
      ],
      scriptSrc: [
        "'self'",
        amoDevCDN,
        webpackHost,
      ],
      styleSrc: [
        "'self'",
        'blob:',
      ],
    },
    reportOnly: true,
  },
};
