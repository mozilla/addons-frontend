// Config for the stage server.
import { addonsServerStageCDN, analyticsHost, apiStageHost, baseUrlStage, stageDomain, staticPath } from './lib/shared';

module.exports = {
  baseURL: baseUrlStage,
  apiHost: apiStageHost,
  amoCDN: addonsServerStageCDN,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
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
        `${addonsServerStageCDN}/user-media/`,
        `${addonsServerStageCDN}/static/`,
        `${baseUrlStage}${staticPath}`,
        // This file isn't bundled with addons-frontend.
        `${addonsServerStageCDN}/favicon.ico`,
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
};
