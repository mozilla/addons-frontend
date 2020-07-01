// Config for the -dev server.
import { addonsServerDevCDN, analyticsHost, apiDevHost, sentryHost, devDomain } from './lib/shared';

module.exports = {
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,
  staticHost: addonsServerDevCDN,

  cookieDomain: `.${devDomain}`,

  enableDevTools: true,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiDevHost,
        sentryHost,
      ],
      imgSrc: [
        "'self'",
        addonsServerDevCDN,
        'data:',
      ],
      scriptSrc: [
        addonsServerDevCDN,
      ],
      styleSrc: [
        addonsServerDevCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-dev/
  publicSentryDsn: 'https://2c975f188a8b4d728ecbb8179cff9c26@sentry.prod.mozaws.net/181',
};
