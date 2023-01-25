// Config for the stage server.
import { analyticsHost, apiStageHost, baseUrlStage, ga4ConnectHost, ga4Host, mediaPath, serverStaticPath, stageDomain, staticPath } from './lib/shared';

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
        ga4ConnectHost,
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
        `${ga4Host}/gtag/js`,
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
