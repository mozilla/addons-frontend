import { addonsServerDevCDN, analyticsHost, apiDevHost } from './lib/shared';

module.exports = {
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,

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
        addonsServerDevCDN,
      ],
      mediaSrc: ["'self'"],
    },
  },

  enableNodeStatics: true,
  trackingEnabled: false,
};
