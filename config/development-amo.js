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

  CSP: {
    directives: {
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [webpackHost],
      prefetchSrc: [webpackHost],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',
};
