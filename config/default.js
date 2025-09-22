// CONFIG defaults (aka PRODUCTION)
// WARNING: No test/stage/dev/development config should
// live here.

import path from 'path';

import {
  apiProdHost,
  baseUrlProd,
  ga4AdditionalAnalyticsHost,
  ga4AnalyticsHost,
  ga4TagManagerHost,
  mediaPath,
  prodDomain,
  serverStaticPath,
  staticPath,
} from './lib/shared';

const basePath = path.resolve(__dirname, '../');

module.exports = {
  basePath,

  // The base URL of the site (for SEO purpose).
  baseURL: baseUrlProd,

  // These are reversed in src/amo/client/config.js.
  client: false,
  server: true,

  // Disables the server side render, handy for debugging.
  disableSSR: false,

  // 2592000 is 30 days in seconds.
  cookieMaxAge: 2592000,
  cookieName: 'sessionid',
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

  // The node server host and port.
  serverHost: '127.0.0.1',
  serverPort: 4000,

  // These are set with environment variables.
  statsdHost: null,
  statsdPort: null,

  // addons-frontend statics are served by the CDN from the main domain.
  staticPath,
  apiHost: apiProdHost,
  apiPath: '/api/',
  apiVersion: 'v5',

  // The version for the favicon.
  // This should be changed when a new favicon is pushed to the CDN to prevent
  // client caching.
  faviconVersion: 3,

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
    'apiHost',
    'apiPath',
    'apiVersion',
    'baseURL',
    'cookieMaxAge',
    'cookieName',
    'cookieSecure',
    'defaultLang',
    'enableDevTools',
    'enableFeatureVPNPromo',
    'enableRequestID',
    'enableStrictMode',
    'experiments',
    'extensionWorkshopUrl',
    'fxaConfig',
    'ga4DebugMode',
    'ga4PropertyId',
    'hrefLangsMap',
    'isDeployed',
    'isDevelopment',
    'langMap',
    'langs',
    'loggingLevel',
    'mozillaUserId',
    'rtlLangs',
    'staticPath',
    'trackingEnabled',
    'trackingId',
    'trackingSendInitPageView',
    'trackingSendWebVitals',
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
    useDefaults: false,
    directives: {
      defaultSrc: ["'none'"],
      baseUri: ["'self'"],
      childSrc: ["'none'"],
      connectSrc: [
        apiProdHost,
        ga4AnalyticsHost,
        ga4AdditionalAnalyticsHost,
        ga4TagManagerHost,
      ],
      fontSrc: [
        `${baseUrlProd}${staticPath}`,
      ],
      formAction: ["'self'"],
      frameSrc: ["'none'"],
      imgSrc: [
        "'self'",
        'data:',
        `${baseUrlProd}${mediaPath}`,
        `${baseUrlProd}${staticPath}`,
        `${baseUrlProd}${serverStaticPath}`,
        ga4AnalyticsHost,
        ga4TagManagerHost,
      ],
      manifestSrc: ["'none'"],
      mediaSrc: ["'none'"],
      objectSrc: ["'none'"],
      // Script is limited to the static path
      scriptSrc: [
        `${baseUrlProd}${staticPath}`,
        ga4AnalyticsHost,
        ga4TagManagerHost,
      ],
      styleSrc: [
        `${baseUrlProd}${staticPath}`,
      ],
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
    'cs',
    'de',
    'dsb',
    'el',
    'en-CA',
    'en-GB',
    'en-US',
    'es-AR',
    'es-CL',
    'es-ES',
    'es-MX',
    'fi',
    'fr',
    'fur',
    'fy-NL',
    'he',
    'hr',
    'hsb',
    'hu',
    'ia',
    'it',
    'ja',
    'ka',
    'kab',
    'ko',
    'nb-NO',
    'nl',
    'nn-NO',
    'pl',
    'pt-BR',
    'pt-PT',
    'ro',
    'ru',
    'sk',
    'sl',
    'sq',
    'sv-SE',
    'tr',
    'uk',
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
    es: 'es-ES',
    pt: 'pt-PT',
  },
  // Map of langs, usually short to longer ones but can also be used to
  // redirect long langs to shorter ones.
  langMap: {
    'bn-BD': 'bn',
    en: 'en-US',
    es: 'es-ES',
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
  // send web vitals stats to GA
  trackingSendWebVitals: true,

  // For GA4
  ga4DebugMode: false,
  ga4PropertyId: 'G-B9CY1C9VBC',

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
    'activity',
    '__frontend_version__',
    '__version__',
    // This isn't in addons-server, but instead will cause a redirect to
    // another host.
    'blocklist',
    'blog',
    'contribute.json',
    'downloads',
    'google1f3e37b7351799a5.html',
    'google231a41e803e464e9.html',
    'robots.txt',
    'services',
    'sitemap.xml',
    'static-frontend',
    'static-server',
    'update',
    'user-media',
  ],

  // This needs to be kept in sync with addons-server's SUPPORTED_NONAPPS
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py
  // These are URLs that are ignored by our prefix middleware that will add
  // a clientApp (e.g. `android`) to any URL that doesn't have a valid
  // clientApp. These are all URLs that don't require a clientApp in them
  // because they are app-independant, like `/en-US/developers/`.
  validClientAppUrlExceptions: [
    '__frontend_heartbeat__',
    '__frontend_lbheartbeat__',
    '__frontend_version__',
    '__version__',
    'about',
    'abuse',
    'admin',
    'apps',
    'activity',
    'blocklist',
    'blog',
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
    'sitemap.xml',
    'static-frontend',
    'static-server',
    'statistics',
    'update',
    'user-media',
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

  // This is the public Mozilla user ID (similar to TASK_USER_ID in
  // addons-server).
  mozillaUserId: 4757633,

  // Feature flags.
  // Please use the `enableFeature` prefix, see:
  // https://github.com/mozilla/addons-frontend/issues/6362.

  enableFeatureVPNPromo: true,

  extensionWorkshopUrl: 'https://extensionworkshop.com',

  // The withExperiment HOC relies on this config to enable/disable A/B
  // experiments on AMO.
  experiments: {
    // The id of the experiment should be added below, in the form of
    // YYYYMMDD_amo_experimentName, with a value of `true` for an enabled experiment
    // or `false` for a disabled experiment.
    // See: https://github.com/mozilla/addons-frontend/pull/9125#issuecomment-580683288
    //
    // e.g., 20210531_amo_download_funnel_experiment: true,
    '20210714_amo_vpn_promo': false,
    '20221130_amo_detail_category': false,
  },
};
