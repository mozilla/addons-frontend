// Config for the -dev server.
import { analyticsHost, apiDevHost, baseUrlDev, devDomain, mediaPath, serverStaticPath, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
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
        `${baseUrlDev}${mediaPath}`,
        `${baseUrlDev}${staticPath}`,
        `${baseUrlDev}${serverStaticPath}`,
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
