// Config for the stage server.
import { addonsServerStageCDN, analyticsHost, apiStageHost, baseUrlStage, stageDomain, staticPath } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlStage,
  apiHost: apiStageHost,
  amoCDN: addonsServerStageCDN,
  staticHost: addonsFrontendCDN,
  staticPath,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiStageHost,
      ],
      fontSrc: [
        `${addonsFrontendCDN}${staticPath}`,
      ],
      imgSrc: [
        "'self'",
        'data:',
        `${addonsServerStageCDN}/user-media/`,
        `${addonsServerStageCDN}/static/`,
        `${addonsFrontendCDN}${staticPath}`,
        // This file isn't bundled with addons-frontend.
        `${addonsServerStageCDN}/favicon.ico`,
      ],
      scriptSrc: [
        `${addonsFrontendCDN}${staticPath}`,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        `${addonsFrontendCDN}${staticPath}`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
