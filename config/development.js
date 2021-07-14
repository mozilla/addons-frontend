// Config specific to local development
import { addonsServerDevCDN, analyticsHost, apiDevHost } from './lib/shared';

const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
const webpackServerPort = 3001;
const webpackHost = `${webpackServerHost}:${webpackServerPort}`;

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

  amoCDN: addonsServerDevCDN,

  // Statics will be served by node.
  staticHost: undefined,

  isDeployed: false,
  isDevelopment: true,

  cookieSecure: false,

  enableDevTools: true,

  enableStrictMode: true,

  serverPort: 3333,
  webpackServerHost,
  webpackServerPort,
  webpackHost,

  CSP: {
    directives: {
      connectSrc: [
        "'self'",
        addonsServerDevCDN,
        analyticsHost,
        apiDevHost,
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
        addonsServerDevCDN,
        webpackHost,
      ],
      scriptSrc: [
        "'self'",
        // webpack injects inline JS
        "'unsafe-inline'",
        addonsServerDevCDN,
        webpackHost,
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

  enableFeatureVPNPromo: true,

  experiments: {'20210714_amo_vpn_promo': true},
};
