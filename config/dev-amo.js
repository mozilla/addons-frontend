import { amoDevCDN, analyticsHost, baseUrlDev } from './lib/shared';

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
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoDevCDN,
        staticHost,
      ],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [amoDevCDN],
      prefetchSrc: [amoDevCDN],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',
  enableFeatureHeroRecommendation: true,
};
