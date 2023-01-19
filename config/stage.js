// Config for the stage server.
import { analyticsHost, apiStageHost, baseUrlStage, mediaPath, serverStaticPath, stageDomain, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlStage,
  apiHost: apiStageHost,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
    useDefaults: false,
    directives: {
      connectSrc: [
        analyticsHost,
        apiStageHost,
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
      ],
      scriptSrc: [
        `${baseUrlStage}${staticPath}`,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        `${baseUrlStage}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',

  experiments: {
    '20221130_amo_detail_category': true,
  },
};
