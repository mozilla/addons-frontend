// Config for the stage server.
import { amoStageCDN, apiStageHost, sentryHost } from './lib/shared';


module.exports = {
  apiHost: apiStageHost,
  amoCDN: amoStageCDN,
  staticHost: amoStageCDN,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        apiStageHost,
        sentryHost,
      ],
      imgSrc: [
        "'self'",
        amoStageCDN,
        'data:',
      ],
      scriptSrc: [
        amoStageCDN,
      ],
      styleSrc: [
        amoStageCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-stage/
  publicSentryDsn: 'https://8f0a256ee2c345608510155edafb71f7@sentry.prod.mozaws.net/182',
};
