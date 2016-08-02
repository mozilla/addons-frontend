/*
 * This is the default (production) config for the discovery pane app.
 */

const amoCDN = 'https://addons.cdn.mozilla.net';
const staticHost = 'https://addons-discovery.cdn.mozilla.net';

module.exports = {
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
    'useUiTour',
  ],

  staticHost,

  CSP: {
    directives: {
      // Script is limited to the discovery specific CDN.
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
      mediaSrc: [staticHost],
    },
  },
  trackingEnabled: true,
  trackingId: 'UA-36116321-7',

  enablePostCssLoader: false,

  // If this is false we'll use an in-page
  // stand-in for the ui-tour.
  useUiTour: false,

  po2jsonFuzzyOutput: true,
};
