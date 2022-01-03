// Config specific to local development
import { baseUrlDev, analyticsHost, apiDevHost } from './lib/shared';

const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
const webpackServerPort = 3001;
const webpackDevServer = `${webpackServerHost}:${webpackServerPort}`;

module.exports = {
  apiHost: 'http://localhost:3000',

  baseURL: 'http://localhost:3000',

  proxyApiHost: 'http://olympia.test',
  proxyPort: 3000,
  proxyEnabled: true,

  // Setting this to false returns add-ons that are not compatible but means
  // developers can pull from a much larger dataset on the local/-dev/-stage
  // servers. Set this to true to only get compatible add-ons (this is what
  // happens in production) but get a lot fewer add-ons in search results.
  restrictSearchResultsToAppVersion: false,

  fxaConfig: 'local',
  trackingEnabled: false,
  loggingLevel: 'debug',

  isDeployed: false,
  isDevelopment: true,

  cookieSecure: false,

  enableDevTools: true,

  enableStrictMode: true,

  serverPort: 3333,
  webpackServerHost,
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
      ],
      styleSrc: [
        "'self'",
        // webpack injects inline CSS
        "'unsafe-inline'",
      ],
    },
    reportOnly: true,
  },

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableFeatureAddonQRCode: true,
};
