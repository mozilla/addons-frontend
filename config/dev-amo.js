import { addonsServerDevCDN, analyticsHost, baseUrlDev } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-dev-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlDev,

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
        addonsServerDevCDN,
        addonsFrontendCDN,
      ],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [addonsFrontendCDN],
      prefetchSrc: [addonsFrontendCDN],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableBlockPage: true,
};
