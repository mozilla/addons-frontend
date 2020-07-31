/*
 * This is the default (production) config for the discovery pane app.
 */
import { addonsServerProdCDN, analyticsHost } from './lib/shared';

const addonsFrontendCDN = 'https://addons-discovery.cdn.mozilla.net';

module.exports = {
  // The keys listed here will be exposed on the client.
  // Since by definition client-side code is public these config keys
  // must not contain sensitive data.
  clientConfigKeys: [
    'allowErrorSimulation',
    'amoCDN',
    'apiHost',
    'apiPath',
    'apiVersion',
    'appName',
    'cookieMaxAge',
    'cookieName',
    'cookieSecure',
    'defaultLang',
    'discoParamsToUse',
    'enableDevTools',
    'enableFeatureDiscoTaar',
    'enableFeatureUseUtmParams',
    'enableRequestID',
    'enableStrictMode',
    'experiments',
    'hrefLangsMap',
    'isDeployed',
    'isDevelopment',
    'langMap',
    'langs',
    'loggingLevel',
    'publicSentryDsn',
    'rtlLangs',
    'trackingEnabled',
    'trackingId',
    'trackingSendInitPageView',
    'unsupportedHrefLangs',
  ],

  staticHost: addonsFrontendCDN,

  CSP: {
    directives: {
      // Script is limited to the discovery specific CDN.
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [addonsFrontendCDN],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerProdCDN,
        addonsFrontendCDN,
      ],
      mediaSrc: [addonsFrontendCDN],
    },
  },
  // Firefox sets these query params when loading the Discovery Pane.
  // These are the allowed list of query params we will forward to AMO for statistics.
  discoParamsToUse: [
    'branch',
    'clientId',
    'edition',
    'platform',
    'study',
  ],
  trackingEnabled: true,
  trackingId: 'UA-36116321-7',
  // We override the initial page view call in order to
  // add custom dimension data.
  trackingSendInitPageView: false,

  enableFeatureDiscoTaar: true,

  // This is disabled for the disco pane because Firefox is the only target
  // so we don't need auto-prefixing, etc.
  enablePostCssLoader: false,

  po2jsonFuzzyOutput: false,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-disco-prod/
  publicSentryDsn: 'https://b9e70d0dca144344a7a5674c29b08355@sentry.prod.mozaws.net/186',

  // The withExperiment HOC relies on this config to enable/disable A/B
  // experiments on disco pane.
  experiments: {},

};
