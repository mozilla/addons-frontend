// Config for the -dev server.
import {
  apiDevHost,
  baseUrlDev,
  devDomain,
  devLang,
  ga4AdditionalAnalyticsHost,
  ga4AnalyticsHost,
  ga4TagManagerHost,
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
        ga4AnalyticsHost,
        ga4AdditionalAnalyticsHost,
        ga4TagManagerHost,
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
        ga4AnalyticsHost,
        ga4TagManagerHost,
      ],
      scriptSrc: [
        `${baseUrlDev}${staticPath}`,
        ga4AnalyticsHost,
        ga4TagManagerHost,
      ],
      styleSrc: [
        `${baseUrlDev}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',

  lang: devLang,
};

