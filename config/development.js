// Config specific to local development
import { amoDevCDN, analyticsHost, apiDevHost, sentryHost } from './lib/shared';

const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
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

  enableDevTools: true,

  serverPort: 3000,
  webpackServerHost,
  webpackServerPort,
  webpackHost,

  CSP: {
    directives: {
      connectSrc: [
        "'self'",
        amoDevCDN,
        analyticsHost,
        sentryHost,
        webpackHost,
        // This is needed for pino-devtools.
        `${webpackServerHost}:3010`,
      ],
      fontSrc: [
        webpackHost,
      ],
      imgSrc: [
        "'self'",
        'data:',
        amoDevCDN,
        webpackHost,
      ],
      scriptSrc: [
        "'self'",
        // webpack injects inline JS
        "'unsafe-inline'",
        amoDevCDN,
        webpackHost,
      ],
      styleSrc: [
        "'self'",
        // webpack injects inline CSS
        "'unsafe-inline'",
      ],
    },
    reportOnly: true,
  },

  // By default, client side errors are not reported to Sentry during
  // development. Override this in a local-*.js config to report errors.
  publicSentryDsn: null,
};
