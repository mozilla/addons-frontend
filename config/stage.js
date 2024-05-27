// Config for the stage server.
import {
  apiStageHost,
  baseUrlStage,
  ga4AdditionalAnalyticsHost,
  ga4AnalyticsHost,
  ga4TagManagerHost,
  mediaPath,
  serverStaticPath,
  stageDomain,
  staticPath,
} from './lib/shared';

module.exports = {
  baseURL: baseUrlStage,
  apiHost: apiStageHost,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
    useDefaults: false,
    directives: {
      connectSrc: [
        apiStageHost,
        ga4AnalyticsHost,
        ga4AdditionalAnalyticsHost,
        ga4TagManagerHost,
      ],
      fontSrc: [
        `${baseUrlStage}${staticPath}`,
      ],
      imgSrc: [
        "'self'",
        'data:',
        `${baseUrlStage}${mediaPath}`,
        `${baseUrlStage}${staticPath}`,
        `${baseUrlStage}${serverStaticPath}`,
        ga4AnalyticsHost,
        ga4TagManagerHost,
      ],
      scriptSrc: [
        `${baseUrlStage}${staticPath}`,
        ga4AnalyticsHost,  // https://www.google-analytics.com/analytics.js
        ga4TagManagerHost, // https://www.googletagmanager.com/gtag/js
      ],
      styleSrc: [
        `${baseUrlStage}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,
  ga4DebugMode: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
