// This config should be used with a local addons-server setup.
module.exports = {
  apiHost: 'http://olympia.test',
  proxyPort: 6000,

  serverHost: 'olympia.test',

  baseURL: 'http://olympia.test',

  webpackServerPort: 6001,

  mozillaUserId: 10968,
  CSP: false,
  enableNodeStatics: true,
};
