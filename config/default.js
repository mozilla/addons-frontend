// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

import path from 'path';

import { addonsServerProdCDN, analyticsHost, prodDomain, apiProdHost, baseUrlProd, sentryHost } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo.cdn.mozilla.net';
const basePath = path.resolve(__dirname, '../');
const distPath = path.join(basePath, 'dist');
const loadableStatsFilename = 'loadable-stats.json';

module.exports = {
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
  staticHost: addonsFrontendCDN,
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
  clientConfigKeys: [
    'allowErrorSimulation',
    'amoCDN',
    'apiHost',
    'apiPath',
    'apiVersion',
    'authTokenValidFor',
    'baseURL',
    'cookieMaxAge',
    'cookieName',
    'cookieSecure',
    'defaultLang',
    'dismissedExperienceSurveyCookieName',
    'enableDevTools',
    'enableFeatureBlockPage',
    'enableFeatureExperienceSurvey',
    'enableFeatureSponsoredShelf',
    'enableFeatureUseAdzerkForSponsoredShelf',
    'enableFeatureAllowAndroidInstall',
    'enableRequestID',
    'enableStrictMode',
    'experiments',
    'extensionWorkshopUrl',
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
      baseUri: ["'self'"],
      childSrc: ["'none'"],
      connectSrc: [analyticsHost, apiProdHost, sentryHost],
      fontSrc: [addonsFrontendCDN],
      formAction: ["'self'"],
      frameSrc: ["'none'"],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerProdCDN,
        addonsFrontendCDN,
      ],
      manifestSrc: ["'none'"],
      mediaSrc: ["'none'"],
      objectSrc: ["'none'"],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [addonsFrontendCDN],
      prefetchSrc: [addonsFrontendCDN],
      // Script is limited to the amo specific CDN.
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [addonsFrontendCDN],
      workerSrc: ["'none'"],
      reportUri: '/__cspreport__',
    },

    // Set to true if you only want browsers to report errors, not block them
    reportOnly: false,
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
  enableTrailingSlashesMiddleware: true,

  localeDir: path.resolve(path.join(__dirname, '../locale')),

  trackingEnabled: true,
  trackingId: 'UA-36116321-7',
  // send a page view on initialization.
  trackingSendInitPageView: true,

  enablePostCssLoader: true,

  // The list of valid client application names.
  // These are derived from UA strings when not supplied in the URL.
  validClientApplications: [
    'android',
    'firefox',
  ],

  // This needs to be kept in sync with addons-server's SUPPORTED_NONLOCALES
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py
  // These are URLs that are ignored by our prefix middleware that will add
  // a locale (e.g. `en-US`) to any URL that doesn't have a valid locale.
  // These are all URLs that should not get a locale prepended to the URL,
  // because they are locale-independant, like `/firefox/downloads/`.
  validLocaleUrlExceptions: [
    '__frontend_version__',
    '__version__',
    // This isn't in addons-server, but instead will cause a redirect to
    // another host.
    'blocklist',
    'contribute.json',
    'downloads',
    'google1f3e37b7351799a5.html',
    'google231a41e803e464e9.html',
    'robots.txt',
    'services',
    'static',
    'user-media',
  ],

  // This needs to be kept in sync with addons-server's SUPPORTED_NONAPPS
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py
  // These are URLs that are ignored by our prefix middleware that will add
  // a clientApp (e.g. `android`) to any URL that doesn't have a valid
  // clientApp. These are all URLs that don't require a clientApp in them
  // because they are app-independant, like `/en-US/developers/`.
  validClientAppUrlExceptions: [
    '__frontend_version__',
    '__version__',
    'about',
    'admin',
    'apps',
    'blocklist',
    'contribute.json',
    'developer_agreement',
    'developers',
    'editors',
    'google1f3e37b7351799a5.html',
    'google231a41e803e464e9.html',
    'jsi18n',
    'review_guide',
    'reviewers',
    'robots.txt',
    'services',
    'static',
    'statistics',
    'user-media',
  ],
  // These routes are allowed through to the app rather than 404.
  // Anything in here should also be present in validClientAppUrlExceptions.
  clientAppRoutes: [
    'about',
    'review_guide',
  ],

  // These URLs are exceptions to our trailing slash URL redirects; if we
  // find a URL that matches this pattern we won't redirect to the same url
  // with an appended `/`. This is usually because if we redirect, it will
  // cause a redirect loop with addons-server; see:
  // https://github.com/mozilla/addons-frontend/issues/2037
  //
  // We use $lang and $clientApp as placeholders so we can have URLs in this
  // list that don't include those URL pieces, if needed.
  validTrailingSlashUrlExceptions: [
    // User URLs, found in:
    // https://github.com/mozilla/addons-server/blob/master/src/olympia/users/urls.py#L20
    '/$lang/$clientApp/user/abuse',
    '/$lang/$clientApp/user/rmlocale',
    '/$lang/$clientApp/users/ajax',
    '/$lang/$clientApp/users/delete',
    '/$lang/$clientApp/users/edit',
    '/$lang/$clientApp/users/login',
    '/$lang/$clientApp/users/logout',
    '/$lang/$clientApp/users/register',
    '/$lang/about',
    '/$lang/review_guide',
  ],

  // The default app used in the URL.
  defaultClientApp: 'firefox',

  // Dynamic JS chunk patterns to exclude. If these strings match any part of
  // the JS file leaf name they will be excluded from being output in the HTML.
  jsChunkExclusions: [
    'i18n',
  ],

  fxaConfig: 'amo',

  proxyEnabled: false,

  // If true, enable a route that explicitly triggers a server error
  // to test our internal error handler.
  allowErrorSimulation: false,

  sentryDsn: process.env.SENTRY_DSN || null,
  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-prod/
  publicSentryDsn: 'https://dbce4e759d8b4dc6a1731d3301fdaab7@sentry.prod.mozaws.net/183',

  // The amount of time (in seconds) that an auth token lives for.
  // This needs to match the SESSION_COOKIE_AGE in addons-server:
  // https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py#L990
  authTokenValidFor: 2592000, // 30 days

  // This is the public Mozilla user ID (similar to TASK_USER_ID in
  // addons-server).
  mozillaUserId: 4757633,

  // Feature flags.
  // Please use the `enableFeature` prefix, see:
  // https://github.com/mozilla/addons-frontend/issues/6362.

  enableFeatureBlockPage: true,

  enableFeatureExperienceSurvey: false,
  dismissedExperienceSurveyCookieName: 'dismissedExperienceSurvey',

  enableFeatureSponsoredShelf: true,
  enableFeatureUseAdzerkForSponsoredShelf: true,
  enableFeatureAllowAndroidInstall: false,

  extensionWorkshopUrl: 'https://extensionworkshop.com',

  // The withExperiment HOC relies on this config to enable/disable A/B
  // experiments on AMO.
  experiments: {
    // The id of the experiment should be added below, in the form of
    // YYYYMMDD_experimentName, with a value of `true` for an enabled experiment
    // or `false` for a disabled experiment.
    // See: https://github.com/mozilla/addons-frontend/pull/9125#issuecomment-580683288
    //
    // e.g., 20200204_installWarning: true,
  },
};
