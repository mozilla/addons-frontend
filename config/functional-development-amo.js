// HOSTNAME=functional.test must be set to use this config.
module.exports = {
  // Statics will be served by node.
  staticHost: '',
  // FIXME: sign-in isn't working.
  // fxaConfig: 'local',

  enableClientConsole: true,
  apiStageHost: 'http://olympia.test',

  CSP: false,

  // This is needed to serve assets locally.
  enableNodeStatics: true,
  trackingEnabled: false,
  // Do not send client side errors to Sentry.
  publicSentryDsn: null,
};
