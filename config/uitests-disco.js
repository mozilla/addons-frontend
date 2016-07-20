const amoCDN = 'https://addons.cdn.mozilla.net';

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
        amoCDN,
        'https://www.google-analytics.com',
      ],
      mediaSrc: ["'self'"],
    },
  },

  enableNodeStatics: true,
  enableTracking: false,
};
