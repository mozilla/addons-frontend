import { amoProdCDN } from './lib/shared';

const staticHost = 'https://addons-amo.cdn.mozilla.net';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      fontSrc: [staticHost],
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
    '__frontend_version__',
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
    'apps',
    'blocklist',
    'contribute.json',
    'developer_agreement',
    'developers',
    'editors',
    'jsi18n',
    'review_guide',
    'google1f3e37b7351799a5.html',
    'robots.txt',
    'statistics',
    'services',
    'static',
    'user-media',
    '__frontend_version__',
    '__version__',
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

  trackingEnabled: true,
  trackingId: 'UA-36116321-7',

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-prod/
  publicSentryDsn: 'https://dbce4e759d8b4dc6a1731d3301fdaab7@sentry.prod.mozaws.net/183',

  // The amount of time (in seconds) that an auth token lives for.
  // This needs to match the SESSION_COOKIE_AGE in addons-server:
  // https://github.com/mozilla/addons-server/blob/master/src/olympia/lib/settings_base.py#L990
  authTokenValidFor: 2592000, // 30 days

  enableFeatureAMInstallButton: true,
};
