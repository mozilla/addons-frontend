import { amoStageCDN } from './lib/shared';

const staticHost = 'https://addons-discovery-cdn.allizom.org';

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
        amoStageCDN,
        staticHost,
      ],
      mediaSrc: [staticHost],
    },
  },

  // https://sentry.prod.mozaws.net/operations/addons-frontend-disco-stage/
  publicSentryDsn: 'https://45ef7d925267490fa65100a62fef3179@sentry.prod.mozaws.net/185',
};
