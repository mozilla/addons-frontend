// Config specific to local development
import {
  apiDevHost,
  baseUrlDev,
  devLangs,
  gtmAdditionalAnalyticsHost,
  gtmAnalyticsHost,
  gtmHost,
} from './lib/shared';

const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
const webpackServerPort = process.env.WEBPACK_SERVER_PORT || 3001;
const webpackDevServer = `${webpackServerHost}:${webpackServerPort}`;

module.exports = {
  apiHost: 'http://localhost:3000',

  baseURL: 'http://localhost:3000',

  proxyApiHost: 'http://olympia.test',
  proxyPort: 3000,
  proxyEnabled: true,

  fxaConfig: 'local',
  trackingEnabled: true,
  loggingLevel: 'debug',

  isDeployed: false,
  isDevelopment: true,

  cookieSecure: false,

  enableDevTools: true,

  enableStrictMode: true,

  serverPort: 3333,

  // We need this config variable for `bin/webpack-dev-server.js`.
  webpackServerPort,

  // In local dev, we serve static files using webpack-dev-server.
  // We need to remove the protocol because of `yarn amo:dev-https`.
  staticPath: `//${webpackDevServer}/`,

  CSP: {
    useDefaults: false,
    directives: {
      connectSrc: [
        "'self'",
        baseUrlDev,
        apiDevHost,
        webpackDevServer,
        // This is needed for pino-devtools.
        `${webpackServerHost}:3010`,
        gtmAnalyticsHost,
        gtmAdditionalAnalyticsHost,
        gtmHost,
      ],
      fontSrc: [
        webpackDevServer,
      ],
      imgSrc: [
        "'self'",
        'data:',
        baseUrlDev,
        webpackDevServer,
        gtmAnalyticsHost,
        gtmHost,
      ],
      scriptSrc: [
        "'self'",
        // webpack injects inline JS
        "'unsafe-inline'",
        baseUrlDev,
        webpackDevServer,
        gtmAnalyticsHost,
        gtmHost,
      ],
      styleSrc: [
        "'self'",
        // webpack injects inline CSS
        "'unsafe-inline'",
      ],
    },
    reportOnly: true,
  },

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',

  langs: devLangs,
};
