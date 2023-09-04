// This config should be used with a local addons-server setup, i.e. run
// addons-server locally (docker env) and use `yarn amo:olympia` in this
// project to allow the frontend to talk to the addons-server API.
//
// This configuration is also used by the `addons-frontend` container in
// addons-server's docker stack, with some configuration values changed by
// using environment variables.
module.exports = {
  apiHost: 'http://olympia.test',
  proxyPort: 7000,

  serverHost: 'olympia.test',

  baseURL: 'http://olympia.test',

  mozillaUserId: 10968,
  CSP: false,

  // See: https://github.com/mozilla/addons-frontend/issues/10545
  enableTrailingSlashesMiddleware: false,

  // For testing until we remove that restriction in stage&prod too
  restrictAndroidToRecommended: false,
};
