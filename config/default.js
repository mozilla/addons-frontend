// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

const path = require('path');

const appName = process.env.NODE_APP_INSTANCE || null;
const validAppNames = [
  'disco',
  'search',
];

// Throw if the appName supplied is not valid.
if (appName && validAppNames.indexOf(appName) === -1) {
  throw new Error(`App ${appName} is not enabled`);
}

const amoCDN = 'https://addons.cdn.mozilla.net';
const apiHost = 'https://addons.mozilla.org';
const apiBase = `${apiHost}/api/v3`;
const startLoginUrl = `${apiBase}/internal/accounts/login/start/`;


module.exports = {
  appName,
  basePath: path.resolve(__dirname, '../'),

  // 2592000 is 30 days in seconds.
  cookieMaxAge: 2592000,
  cookieName: 'jwt_api_auth_token',

  isDeployed: true,
  isDevelopment: false,

  // The canonical list of enabled apps.
  validAppNames,

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 4000,

  // The CDN host for AMO.
  amoCDN,
  apiHost,
  apiBase,
  startLoginUrl,

  // The keys listed here will be exposed on the client.
  // Since by definition client-side code is public these config keys
  // must not contain sensitive data.
  clientConfigKeys: [
    'apiBase',
    'cookieName',
    'cookieMaxAge',
    'isDeployed',
    'isDevelopment',
    'startLoginUrl',
  ],

  // Content security policy.
  CSP: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: [
        "'self'",
        apiHost,
      ],
      imgSrc: [
        "'self'",
        amoCDN,
      ],
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
