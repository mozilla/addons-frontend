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
    'allowErrorSimulation',
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
    'trackingSendInitPageView',
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
  // We override the initial page view call in order to
  // add custom dimension data.
  trackingSendInitPageView: false,

  enablePostCssLoader: false,

  po2jsonFuzzyOutput: false,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-disco-prod/
  publicSentryDsn: 'https://b9e70d0dca144344a7a5674c29b08355@sentry.prod.mozaws.net/186',
};
