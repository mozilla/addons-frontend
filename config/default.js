// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

/* eslint-disable object-shorthand */

const path = require('path');
const defer = require('config/defer').deferConfig;

const appName = process.env.NODE_APP_INSTANCE || null;
const validAppNames = [
  'disco',
  'search',
];

// Throw if the appName supplied is not valid.
if (appName && validAppNames.indexOf(appName) === -1) {
  throw new Error(`App ${appName} is not enabled`);
}

module.exports = {
  appName: appName,
  basePath: path.resolve(__dirname, '../'),

  // 2592000 is 30 days in seconds.
  cookieMaxAge: 2592000,
  cookieName: 'jwt_api_auth_token',

  // The canonical list of enabled apps.
  validAppNames: validAppNames,

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 4000,

  // The CDN host for AMO.
  amoCDN: 'https://addons.cdn.mozilla.net',

  apiHost: 'https://addons.mozilla.org',
  apiPath: '/api/v3',
  apiBase: defer((cfg) => cfg.apiHost + cfg.apiPath),
  startLoginUrl: defer((cfg) => `${cfg.apiBase}/internal/accounts/login/start/`),

  // The keys listed here will be exposed on the client.
  // Since by definition client-side code is public these config keys
  // must not contain sensitive data.
  clientConfigKeys: [
    'apiBase',
    'cookieName',
    'cookieMaxAge',
    'startLoginUrl',
  ],

  // Content security policy.
  CSP: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: defer((cfg) => ["'self'", cfg.apiHost]),
      imgSrc: defer((cfg) => [
        "'self'",
        cfg.amoCDN,
      ]),
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      reportUri: '/__cspreport__',
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false,

    // Set to true if you want to blindly set all headers: Content-Security-Policy,
    // X-WebKit-CSP, and X-Content-Security-Policy.
    setAllHeaders: false,

    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: false,
  },

};
