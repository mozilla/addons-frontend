// Config for the -dev server.
import { addonsServerDevCDN, analyticsHost, apiDevHost, baseUrlDev, devDomain, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,
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

  enableFeatureAddonQRCode: true,
};
