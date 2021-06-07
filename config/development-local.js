// This config should be used with a local addons-server setup.
module.exports = {
  apiHost: 'http://olympia.test',
  proxyPort: 7000,

  serverHost: 'olympia.test',

  baseURL: 'http://olympia.test',

  webpackServerPort: 7001,

  mozillaUserId: 10968,
  CSP: false,
  enableNodeStatics: true,

  // See: https://github.com/mozilla/addons-frontend/issues/10545
  enableTrailingSlashesMiddleware: false,
};
