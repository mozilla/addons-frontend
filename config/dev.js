// Config for the -dev server.
import { addonsServerDevCDN, analyticsHost, apiDevHost, baseUrlDev, devDomain } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-dev-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,
  staticHost: addonsFrontendCDN,

  cookieDomain: `.${devDomain}`,

  enableDevTools: true,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiDevHost,
      ],
      fontSrc: [
        `${addonsFrontendCDN}/static/`,
      ],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerDevCDN,
        `${addonsFrontendCDN}/static/`,
        // This file isn't bundled with addons-frontend.
        `${addonsFrontendCDN}/favicon.ico`,
      ],
      scriptSrc: [
        `${addonsFrontendCDN}/static/`,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        `${addonsFrontendCDN}/static/`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableFeatureVPNPromo: true,

  experiments: {'20210714_amo_vpn_promo': true},
};
