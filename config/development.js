// Config specific to local development
import { baseUrlDev, analyticsHost, apiDevHost, ga4ConnectHost, ga4Host } from './lib/shared';

const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
const webpackServerPort = process.env.WEBPACK_SERVER_PORT || 3001;
const webpackDevServer = `${webpackServerHost}:${webpackServerPort}`;

module.exports = {
  apiHost: 'http://localhost:3000',

  baseURL: 'http://localhost:3000',

  proxyApiHost: 'http://olympia.test',
  proxyPort: 3000,
  proxyEnabled: true,

  // For testing until we remove that restriction in stage&prod too
  restrictAndroidToRecommended: false,

  fxaConfig: 'local',
  trackingEnabled: false,
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
        analyticsHost,
        ga4ConnectHost,
        apiDevHost,
        webpackDevServer,
        // This is needed for pino-devtools.
        `${webpackServerHost}:3010`,
      ],
      fontSrc: [
        webpackDevServer,
      ],
      imgSrc: [
        "'self'",
        'data:',
        baseUrlDev,
        webpackDevServer,
      ],
      scriptSrc: [
        "'self'",
        // webpack injects inline JS
        "'unsafe-inline'",
        baseUrlDev,
        webpackDevServer,
        `${analyticsHost}/analytics.js`,
        `${ga4Host}/gtag/js`,
      ],
      styleSrc: [
        "'self'",
        // webpack injects inline CSS
        "'unsafe-inline'",
      ],
    },
    reportOnly: true,
  },

  ga4DebugMode: true,

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',
};
