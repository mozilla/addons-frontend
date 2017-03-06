import { amoDevCDN } from './lib/shared';

const staticHost = 'https://addons-amo-dev-cdn.allizom.org';

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
        amoCDN: amoDevCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
    },
  },
};
