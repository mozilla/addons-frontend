// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

import 'babel-polyfill';

const path = require('path');

const appName = process.env.NODE_APP_INSTANCE || null;
const validAppNames = [
  'admin',
  'amo',
  'disco',
];

// Throw if the appName supplied is not valid.
if (appName && !validAppNames.includes(appName)) {
  throw new Error(`App ${appName} is not enabled`);
}

const amoCDN = 'https://addons.cdn.mozilla.net';
const apiHost = 'https://addons.mozilla.org';


module.exports = {
  appName,
  basePath: path.resolve(__dirname, '../'),

  // These are reversed in src/core/client/config.js.
  client: false,
  server: true,

  // Disables the server side render, handy for debugging.
  disableSSR: false,

  // 2592000 is 30 days in seconds.
  cookieMaxAge: 2592000,
  cookieName: 'jwt_api_auth_token',
  cookieSecure: true,

  enableClientConsole: false,

  // If true node will serve the static files.
  enableNodeStatics: false,

  isDeployed: true,
  isDevelopment: false,

  // The canonical list of enabled apps.
  validAppNames,

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 4000,

  // The CDN host for AMO.
  amoCDN,
  staticHost: amoCDN,
  apiHost,
  apiPath: '/api/v3',

  // The keys listed here will be exposed on the client.
  // Since by definition client-side code is public these config keys
  // must not contain sensitive data.
  clientConfigKeys: [
    'appName',
    'amoCDN',
    'apiHost',
    'apiPath',
    'cookieName',
    'cookieMaxAge',
    'cookieSecure',
    'enableClientConsole',
    'defaultLang',
    'isDeployed',
    'isDevelopment',
    'langs',
    'langMap',
    'rtlLangs',
    'trackingEnabled',
    'trackingId',
  ],

  // Content Security Policy.
  // NOTE: This config should be overridden on a per app basis
  // if you're not updating the config for all apps.
  // NOTE: if a config contains a var, it must be set
  // for all overriding configs.
  CSP: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      childSrc: ["'none'"],
      connectSrc: [apiHost],
      formAction: ["'none'"],
      frameSrc: ["'none'"],
      imgSrc: [
        // Favicons are normally served
        // from the document host.
        "'self'",
        amoCDN,
        'data:',
      ],
      mediaSrc: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: [amoCDN],
      styleSrc: [amoCDN],
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

  frameGuard: {
    action: 'deny',
  },

  // Supported languages.
  langs: [
    'af', 'ar', 'bg', 'bn-BD', 'ca', 'cs', 'da', 'de', 'dbl', 'dbr', 'dsb', 'el',
    'en-GB', 'en-US', 'es', 'eu', 'fa', 'fi', 'fr', 'ga-IE', 'he', 'hsb', 'hu', 'id',
    'it', 'ja', 'ko', 'mk', 'mn', 'nl', 'pl', 'pt-BR', 'pt-PT', 'ro', 'ru', 'sk',
    'sl', 'sq', 'sv-SE', 'uk', 'vi', 'zh-CN', 'zh-TW',
  ],
  // Map of short langs to longer ones.
  langMap: {
    en: 'en-US',
    ga: 'ga-IE',
    pt: 'pt-PT',
    sv: 'sv-SE',
    zh: 'zh-CN',
  },
  rtlLangs: ['ar', 'dbr', 'fa', 'he'],
  defaultLang: 'en-US',

  po2jsonFuzzyOutput: false,

  enablePrefixMiddleware: true,

  localeDir: path.resolve(path.join(__dirname, '../locale')),

  // This is off by default
  // and enabled on a per-app basis.
  trackingEnabled: false,
  trackingId: null,

  enablePostCssLoader: true,

  // The list of valid client application names. These are derived from UA strings when
  // not supplied in the URL.
  validClientApplications: [
    'firefox',
    'android',
  ],

  // The default app used in the URL.
  defaultClientApp: 'firefox',
};
