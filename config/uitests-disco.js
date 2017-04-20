import { amoProdCDN } from './lib/shared';

module.exports = {
  staticHost: '',

  CSP: {
    directives: {
      scriptSrc: [
        "'self'",
        'https://www.google-analytics.com',
      ],
      styleSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        amoProdCDN,
        'https://www.google-analytics.com',
      ],
      mediaSrc: ["'self'"],
    },
  },

  enableNodeStatics: true,
  trackingEnabled: false,
};
