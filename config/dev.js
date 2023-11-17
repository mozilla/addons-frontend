// Config for the -dev server.
import { analyticsHost, apiDevHost, baseUrlDev, devDomain, ga4ConnectHost, ga4Host, mediaPath, serverStaticPath, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
  cookieDomain: `.${devDomain}`,

  enableDevTools: true,

  // Content security policy.
  CSP: {
    useDefaults: false,
    directives: {
      connectSrc: [
        analyticsHost,
        ga4ConnectHost,
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
        `${ga4Host}/gtag/js`,
      ],
      styleSrc: [
        `${baseUrlDev}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',

  enableFeatureFeedbackFormLinks: true,
};
