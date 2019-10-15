import { addonsServerStageCDN, analyticsHost, baseUrlStage } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlStage,

  staticHost: addonsFrontendCDN,

  CSP: {
    directives: {
      fontSrc: [
        addonsFrontendCDN,
      ],
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [addonsFrontendCDN],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerStageCDN,
        addonsFrontendCDN,
      ],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [addonsFrontendCDN],
      prefetchSrc: [addonsFrontendCDN],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',

  enableFeatureHeroRecommendation: true,
};
