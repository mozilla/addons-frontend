const amoCDN = 'https://addons.cdn.mozilla.net';
const staticHost = 'https://addons-amo.cdn.mozilla.net';

module.exports = {
  fxaConfig: 'amo',
  CSP: {
    directives: {
      formAction: [
        "'self'",
      ],
      // Script is limited to the amo specific CDN.
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
    },
  },
};
