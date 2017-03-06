// Config for the -dev server.
import { amoDevCDN, apiDevHost, sentryHost } from './lib/shared';


module.exports = {
  apiHost: apiDevHost,
  amoCDN: amoDevCDN,
  staticHost: amoDevCDN,

  enableClientConsole: true,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        apiDevHost,
        sentryHost,
      ],
      imgSrc: [
        "'self'",
        amoDevCDN,
        'data:',
      ],
      scriptSrc: [
        amoDevCDN,
      ],
      styleSrc: [
        amoDevCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-dev/
  publicSentryDsn: 'https://2c975f188a8b4d728ecbb8179cff9c26@sentry.prod.mozaws.net/181',
};
