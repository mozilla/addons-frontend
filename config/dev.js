// Config for the -dev server.
import { addonsServerDevCDN, analyticsHost, apiDevHost, baseUrlDev, devDomain, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,
  // addons-frontend statics are served by the CDN from the main domain
  staticHost: undefined,
  staticPath,

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
        `${baseUrlDev}${staticPath}`,
      ],
      imgSrc: [
        "'self'",
        'data:',
        `${addonsServerDevCDN}/user-media/`,
        `${addonsServerDevCDN}/static/`,
        `${baseUrlDev}${staticPath}`,
        // This file isn't bundled with addons-frontend.
        `${addonsServerDevCDN}/favicon.ico`,
      ],
      scriptSrc: [
        `${baseUrlDev}${staticPath}`,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        `${baseUrlDev}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableFeatureVPNPromo: true,

  experiments: {
    '20210714_amo_vpn_promo': true,
  },
};
