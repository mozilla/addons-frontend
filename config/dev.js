// Config for the -dev server.
import {
  apiDevHost,
  baseUrlDev,
  devDomain,
  devLangs,
  gtmAdditionalAnalyticsHost,
  gtmAnalyticsHost,
  gtmHost,
  mediaPath,
  serverStaticPath,
  staticPath,
} from './lib/shared';

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
        apiDevHost,
        gtmAnalyticsHost,
        gtmAdditionalAnalyticsHost,
        gtmHost,
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
        gtmAnalyticsHost,
        gtmHost,
      ],
      scriptSrc: [
        `${baseUrlDev}${staticPath}`,
        gtmAnalyticsHost,
        gtmHost,
      ],
      styleSrc: [
        `${baseUrlDev}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',

  langs: devLangs,
};
