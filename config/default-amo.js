import { amoProdCDN } from './lib/shared';

const staticHost = 'https://addons-amo.cdn.mozilla.net';

module.exports = {
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
  // This needs to be kept in sync with addons-server's SUPPORTED_NONAPPS
  // settings value: https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py#L262
  validUrlExceptions: [
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
