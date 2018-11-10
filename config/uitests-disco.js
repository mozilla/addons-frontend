import { amoDevCDN, apiDevHost } from './lib/shared';

module.exports = {
  apiHost: apiDevHost,
  amoCDN: amoDevCDN,

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
        amoDevCDN,
        'https://www.google-analytics.com',
      ],
      mediaSrc: ["'self'"],
    },
  },

  enableNodeStatics: true,
  trackingEnabled: false,
};
