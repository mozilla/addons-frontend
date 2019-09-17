import { amoDevCDN, analyticsHost, apiDevHost } from './lib/shared';

module.exports = {
  apiHost: apiDevHost,
  amoCDN: amoDevCDN,

  staticHost: '',

  CSP: {
    directives: {
      scriptSrc: [
        "'self'",
        analyticsHost,
      ],
      styleSrc: ["'self'"],
      imgSrc: [
        "'self'",
        'data:',
        amoDevCDN,
      ],
      mediaSrc: ["'self'"],
    },
  },

  enableNodeStatics: true,
  trackingEnabled: false,
};
