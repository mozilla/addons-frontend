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
        addonsFrontendCDN,
      ],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerStageCDN,
        addonsFrontendCDN,
      ],
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        addonsFrontendCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
