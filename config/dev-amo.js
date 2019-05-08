import { amoDevCDN, baseUrlDev } from './lib/shared';

const staticHost = 'https://addons-amo-dev-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlDev,

  staticHost,

  CSP: {
    directives: {
      fontSrc: [
        staticHost,
      ],
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoDevCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [amoDevCDN],
      prefetchSrc: [amoDevCDN],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableFeatureRecommendedBadges: true,
};
