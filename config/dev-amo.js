import { amoDevCDN, baseUrlDev } from './lib/shared';

const staticHost = 'https://addons-amo-dev-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlDev,

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
        amoDevCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
    },
  },
};
