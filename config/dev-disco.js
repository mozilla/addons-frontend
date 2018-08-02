import { amoDevCDN } from './lib/shared';

const staticHost = 'https://addons-discovery-dev-cdn.allizom.org';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoDevCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
      mediaSrc: [staticHost],
    },
  },

  // https://sentry.prod.mozaws.net/operations/addons-frontend-disco-dev/
  publicSentryDsn: 'https://560fc81d9fd14266b99bda032de23c52@sentry.prod.mozaws.net/184',

  enableNewInstallButton: true,
};
