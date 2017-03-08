import { amoProdCDN } from './lib/shared';

const staticHost = 'https://addons-amo.cdn.mozilla.net';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      formAction: [
        "'self'",
      ],
      // Script is limited to the amo specific CDN.
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoProdCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
    },
  },
  enableTrailingSlashesMiddleware: true,
  fxaConfig: 'amo',

  // This needs to be kept in sync with addons-server's SUPPORTED_NONLOCALES
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py#L274
  // These are URLs that are ignored by our prefix middleware that will add
  // a locale (e.g. `en-US`) to any URL that doesn't have a valid locale.
  // These are all URLs that should not get a locale prepended to the URL,
  // because they are locale-independant, like `/firefox/downloads/`.
  validLocaleUrlExceptions: [
    'contribute.json',
    'google1f3e37b7351799a5.html',
    'robots.txt',
    'services',
    'downloads',
    // This isn't in addons-server, but instead will cause a redirect to another
    // host.
    'blocklist',
    'static',
    'user-media',
    '__version__',
  ],

  // This needs to be kept in sync with addons-server's SUPPORTED_NONAPPS
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py#L262
  // These are URLs that are ignored by our prefix middleware that will add
  // a clientApp (e.g. `android`) to any URL that doesn't have a valid
  // clientApp. These are all URLs that don't require a clientApp in them
  // because they are app-independant, like `/en-US/developers/`.
  validClientAppUrlExceptions: [
    'about',
    'admin',
    'apps',
    'blocklist',
    'contribute.json',
    'credits',
    'developer_agreement',
    'developer_faq',
    'developers',
    'editors',
    'faq',
    'jsi18n',
    'review_guide',
    'google1f3e37b7351799a5.html',
    'robots.txt',
    'statistics',
    'services',
    'sunbird',
    'static',
    'user-media',
    '__version__',
  ],
};
