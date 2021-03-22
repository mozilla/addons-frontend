// Config for the stage server.
import { addonsServerStageCDN, analyticsHost, apiStageHost, baseUrlStage, stageDomain } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlStage,
  apiHost: apiStageHost,
  amoCDN: addonsServerStageCDN,
  staticHost: addonsFrontendCDN,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiStageHost,
      ],
      fontSrc: [
        `${addonsFrontendCDN}/static/`,
      ],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerStageCDN,
        `${addonsFrontendCDN}/static/`,
        // This file isn't bundled with addons-frontend.
        `${addonsFrontendCDN}/favicon.ico`,
      ],
      scriptSrc: [
        `${addonsFrontendCDN}/static/`,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        `${addonsFrontendCDN}/static/`,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
