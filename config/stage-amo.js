import { amoStageCDN } from './lib/shared';

const staticHost = 'https://addons-amo-cdn.allizom.org';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      fontSrc: [
        staticHost,
      ],
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
        'https://www.google-analytics.com',
      ],
    },
  },
};
