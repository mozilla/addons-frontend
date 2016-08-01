const amoCDN = 'https://addons-stage-cdn.allizom.org';
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
        amoCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
      mediaSrc: [staticHost],
    },
  },
};
