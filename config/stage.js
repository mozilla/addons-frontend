// Config for the stage server.
import { addonsServerStageCDN, analyticsHost, apiStageHost, baseUrlStage, sentryHost, stageDomain } from './lib/shared';

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
        sentryHost,
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

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-stage/
  publicSentryDsn: 'https://8f0a256ee2c345608510155edafb71f7@sentry.prod.mozaws.net/182',

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
