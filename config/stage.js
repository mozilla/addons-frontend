// Config for the stage server.
import { addonsServerStageCDN, analyticsHost, apiStageHost, sentryHost, stageDomain } from './lib/shared';

module.exports = {
  apiHost: apiStageHost,
  amoCDN: addonsServerStageCDN,
  staticHost: addonsServerStageCDN,

  cookieDomain: `.${stageDomain}`,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiStageHost,
        sentryHost,
      ],
      imgSrc: [
        "'self'",
        addonsServerStageCDN,
        'data:',
      ],
      scriptSrc: [
        addonsServerStageCDN,
      ],
      styleSrc: [
        addonsServerStageCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-stage/
  publicSentryDsn: 'https://8f0a256ee2c345608510155edafb71f7@sentry.prod.mozaws.net/182',
};
