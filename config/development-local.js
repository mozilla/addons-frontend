const webpackServerHost = process.env.WEBPACK_SERVER_HOST || '127.0.0.1';
const webpackServerPort = 7001;
const webpackDevServer = `${webpackServerHost}:${webpackServerPort}`;

// This config should be used with a local addons-server setup.
module.exports = {
  apiHost: 'http://olympia.test',
  proxyPort: 7000,

  serverHost: 'olympia.test',

  baseURL: 'http://olympia.test',

  webpackServerHost,
  webpackServerPort,

  mozillaUserId: 10968,
  CSP: false,

  // In local dev, we serve static files using webpack-dev-server.
  // We need to remove the protocol because of `yarn amo:dev-https`.
  staticPath: `//${webpackDevServer}/`,

  // See: https://github.com/mozilla/addons-frontend/issues/10545
  enableTrailingSlashesMiddleware: false,
};
