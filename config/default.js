// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

import path from 'path';

import { addonsServerProdCDN, analyticsHost, prodDomain, apiProdHost, baseUrlProd, sentryHost } from './lib/shared';

const appName = process.env.NODE_APP_INSTANCE || null;
const validAppNames = [
  'amo',
  'disco',
];

// Throw if the appName supplied is not valid.
if (appName && !validAppNames.includes(appName)) {
  throw new Error(
    `App "${appName}" is not enabled; valid app names: ${validAppNames}`);
}

const basePath = path.resolve(__dirname, '../');
const distPath = path.join(basePath, 'dist');
const loadableStatsFilename = 'loadable-stats.json';

module.exports = {
  appName,
  basePath,

  // This is needed for code-splitting.
  loadableStatsFilename,
  loadableStatsFile: path.join(distPath, loadableStatsFilename),

  // The base URL of the site (for SEO purpose).
  baseURL: baseUrlProd,

  // These are reversed in src/core/client/config.js.
  client: false,
  server: true,

  // Disables the server side render, handy for debugging.
  disableSSR: false,

  // 2592000 is 30 days in seconds.
  cookieMaxAge: 2592000,
  cookieName: 'frontend_auth_token',
  cookieSecure: true,
  cookieDomain: `.${prodDomain}`,
  cookieSameSite: 'lax',

  // Enable devtools for: Redux.
  enableDevTools: false,
  // Logging level, see:
  // https://github.com/pinojs/pino/blob/master/docs/API.md#parameters.
  loggingLevel: 'info',
  // Enable the httpContext/requestId middleware, see:
  // https://github.com/mozilla/addons-frontend/issues/6537
  enableRequestID: true,

  // If true node will serve the static files.
  enableNodeStatics: false,

  enableStrictMode: false,

  isDeployed: true,
  isDevelopment: false,

  // For all Firefox 57+ (Quantum) UAs, send the `appversion` in all API
  // search requests. This will return only compatible add-ons, which is
  // good for UX (it prevents a lot of incompatible old add-ons).
  // Disable this in development when working with stage data, which is
  // very out-of-date and mostly not 57+ compatible.
  restrictSearchResultsToAppVersion: true,

  // The canonical list of enabled apps.
  validAppNames,

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 4000,

  // By default, sending stats to DataDog is enabled but the host setting
  // must also be non-empty.
  useDatadog: true,
  // These are set with environment variables.
  datadogHost: null,
  datadogPort: null,

  // The CDN host for AMO.
  amoCDN: addonsServerProdCDN,
  staticHost: addonsServerProdCDN,
  apiHost: apiProdHost,
  apiPath: '/api/',
  apiVersion: 'v4',

  // The version for the favicon.
  // This should be changed when a new favicon is pushed to the CDN to prevent
  // client caching.
  faviconVersion: 2,

  // URL patterns of anonymous/stateless pages. These pages won't authenticate
  // the logged in user (if any) and should not contain any non-public data (so
  // that we can cache them).
  anonymousPagePatterns: [
    '/blocked-addon/',
  ],

  // The keys listed here will be exposed on the client.
  // Since by definition client-side code is public these config keys
  // must not contain sensitive data.
  //
  // NOTE: when you update this, you may also have to update
  // config/default-disco.js:clientConfigKeys
  //
  clientConfigKeys: [
    'allowErrorSimulation',
    'amoCDN',
    'apiHost',
    'apiPath',
    'apiVersion',
    'appName',
    'authTokenValidFor',
    'baseURL',
    'cookieMaxAge',
    'cookieName',
    'cookieSecure',
    'defaultLang',
    'dismissedExperienceSurveyCookieName',
    'enableDevTools',
    'enableFeatureBlockPage',
    'enableFeatureDiscoTaar',
    'enableFeatureExperienceSurvey',
    'enableFeaturePromotedShelf',
    'enableFeatureUseAdzerk',
    'enableRequestID',
    'enableStrictMode',
    'experiments',
    'extensionWorkshopUrl',
    'fenixCompatibleGuids',
    'fxaConfig',
    'hrefLangsMap',
    'isDeployed',
    'isDevelopment',
    'langMap',
    'langs',
    'loggingLevel',
    'mozillaUserId',
    'publicSentryDsn',
    'restrictSearchResultsToAppVersion',
    'rtlLangs',
    'trackingEnabled',
    'trackingId',
    'trackingSendInitPageView',
    'unsupportedHrefLangs',
    'validClientAppUrlExceptions',
    'validClientApplications',
    'validLocaleUrlExceptions',
    'validTrailingSlashUrlExceptions',
  ],

  // Content Security Policy.
  // NOTE: This config should be overridden on a per app basis
  // if you're not updating the config for all apps.
  // NOTE: if a config contains a var, consider importing it
  // from ./lib/shared.js
  CSP: {
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      childSrc: ["'none'"],
      connectSrc: [analyticsHost, apiProdHost, sentryHost],
      formAction: ["'none'"],
      frameSrc: ["'none'"],
      imgSrc: [
        // Favicons are normally served
        // from the document host.
        "'self'",
        addonsServerProdCDN,
        'data:',
      ],
      manifestSrc: ["'none'"],
      mediaSrc: ["'none'"],
      objectSrc: ["'none'"],
      scriptSrc: [addonsServerProdCDN],
      styleSrc: [addonsServerProdCDN],
      workerSrc: ["'none'"],
      reportUri: '/__cspreport__',
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false,

    // Set to true if you want to blindly set all headers: Content-Security-Policy,
    // X-WebKit-CSP, and X-Content-Security-Policy.
    setAllHeaders: false,

    // Set to true if you want to disable CSP on Android where it can be buggy.
    disableAndroid: false,

    browserSniff: false,
  },

  frameGuard: {
    action: 'deny',
  },

  // Supported languages.
  langs: [
    'af',
    'ar',
    'ast',
    'az',
    'bg',
    'bn',
    'bs',
    'ca',
    'cak',
    'cs',
    'da',
    'de',
    'dsb',
    'el',
    'en-CA',
    'en-GB',
    'en-US',
    'es',
    'et',
    'eu',
    'fa',
    'fi',
    'fr',
    'fy-NL',
    'ga-IE',
    'he',
    'hr',
    'hsb',
    'hu',
    'ia',
    'id',
    'it',
    'ja',
    'ka',
    'kab',
    'ko',
    'lt',
    'lv',
    'mk',
    'mn',
    'ms',
    'mt',
    'nb-NO',
    'nl',
    'nn-NO',
    'pa-IN',
    'pl',
    'pt-BR',
    'pt-PT',
    'ro',
    'ru',
    'sk',
    'sl',
    'sq',
    'sv-SE',
    'te',
    'th',
    'tr',
    'uk',
    'ur',
    'vi',
    'zh-CN',
    'zh-TW',
  ],
  // Exclusion list of unsupported locales for alternate links, see:
  // https://github.com/mozilla/addons-frontend/issues/6644
  unsupportedHrefLangs: [
    'ast',
    'cak',
    'dsb',
    'hsb',
    'kab',
  ],
  // Map of locale aliases for "alternate" links, see:
  // https://github.com/mozilla/addons-frontend/issues/6644
  hrefLangsMap: {
    'x-default': 'en-US',
    en: 'en-US',
    pt: 'pt-PT',
  },
  // Map of langs, usually short to longer ones but can also be used to
  // redirect long langs to shorter ones.
  langMap: {
    'bn-BD': 'bn',
    en: 'en-US',
    ga: 'ga-IE',
    pt: 'pt-PT',
    sv: 'sv-SE',
    zh: 'zh-CN',
  },
  rtlLangs: ['ar', 'fa', 'he', 'ur'],
  defaultLang: 'en-US',
  // Some missing moment locales can be mapped to existing ones. Note: moment
  // locales are lowercase and do not use an underscore.
  // See: https://github.com/mozilla/addons-frontend/issues/1515
  momentLangMap: {
    'fy-nl': 'fy',
    'nb-no': 'nb',
    'nn-no': 'nn',
    'pt-pt': 'pt',
    'sv-se': 'sv',
  },

  po2jsonFuzzyOutput: false,

  enablePrefixMiddleware: true,
  enableTrailingSlashesMiddleware: false,

  localeDir: path.resolve(path.join(__dirname, '../locale')),

  // This is off by default
  // and enabled on a per-app basis.
  trackingEnabled: false,
  trackingId: null,
  // send a page view on initialization.
  trackingSendInitPageView: true,

  enablePostCssLoader: true,

  // The list of valid client application names.
  // These are derived from UA strings when not supplied in the URL.
  validClientApplications: [
    'android',
    'firefox',
  ],

  validLocaleUrlExceptions: [],
  validClientAppUrlExceptions: [],
  validTrailingSlashUrlExceptions: [],
  clientAppRoutes: [],

  // The default app used in the URL.
  defaultClientApp: 'firefox',

  // Dynamic JS chunk patterns to exclude. If these strings match any part of
  // the JS file leaf name they will be excluded from being output in the HTML.
  jsChunkExclusions: [
    'i18n',
  ],

  fxaConfig: null,

  proxyEnabled: false,

  // If true, enable a route that explicitly triggers a server error
  // to test our internal error handler.
  allowErrorSimulation: false,

  sentryDsn: process.env.SENTRY_DSN || null,
  publicSentryDsn: null,

  // The amount of time (in seconds) that an auth token lives for. This is
  // currently only used in AMO.
  authTokenValidFor: null,

  // The number of seconds the client should cache all responses for.
  // If null, no caching headers will be sent.
  // This setting is intended to simulate the Discopane's nginx cache
  // header for development purposes.
  cacheAllResponsesFor: null,

  // See the Discopane config for how this is currently used.
  discoParamsToUse: [],

  // This is the public Mozilla user ID (similar to TASK_USER_ID in
  // addons-server).
  mozillaUserId: 4757633,

  // Feature flags.
  // Please use the `enableFeature` prefix, see:
  // https://github.com/mozilla/addons-frontend/issues/6362.

  enableFeatureDiscoTaar: false,

  enableFeatureBlockPage: true,

  enableFeatureExperienceSurvey: false,
  dismissedExperienceSurveyCookieName: 'dismissedExperienceSurvey',

  enableFeaturePromotedShelf: false,
  enableFeatureUseAdzerk: false,

  extensionWorkshopUrl: 'https://extensionworkshop.com',

  // This defines experiments for use with the withExperiment HOC, but no
  // actual experiments should be defined here. Experiments should be defined
  // in default-amo and/or default-disco depending on the target app for the
  // experiment.
  experiments: {},

  // The list of GUIDs for add-ons that are Fenix compatible. This is based on
  // the contents of the collection at
  // https://addons.mozilla.org/firefox/collections/4757633/3204bb44a6ef44d39ee34917f28055/
  fenixCompatibleGuids: [
    '{7b1bf0b6-a1b9-42b0-b75d-252036438bdc}',
    'jid1-BoFifL9Vbdl2zQ@jetpack',
    'woop-NoopscooPsnSXQ@jetpack',
    '{2e5ff8c8-32fe-46d0-9fc8-6b8986621f3c}',
    'addon@darkreader.org',
    '{73a6fe31-595d-460b-a920-fcc0f8843232}',
    'jid1-MnnxcxisBPnSXQ@jetpack',
    'https-everywhere@eff.org',
    'uBlock0@raymondhill.net',
  ],
};
