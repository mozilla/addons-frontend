// Config for the stage server.
import {
  apiStageHost,
  baseUrlStage,
  gtmAdditionalAnalyticsHost,
  gtmAnalyticsHost,
  gtmHost,
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
        gtmAnalyticsHost,
        gtmAdditionalAnalyticsHost,
        gtmHost,
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
        gtmAnalyticsHost,
        gtmHost,
      ],
      scriptSrc: [
        `${baseUrlStage}${staticPath}`,
        gtmAnalyticsHost,
        gtmHost,
      ],
      styleSrc: [
        `${baseUrlStage}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
