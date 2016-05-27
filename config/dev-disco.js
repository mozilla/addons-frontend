const amoCDN = 'https://addons-dev-cdn.allizom.org';
const staticHost = 'https://addons-discovery-dev-cdn.allizom.org';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      scriptSrc: [staticHost],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoCDN,
        staticHost,
      ],
      mediaSrc: [staticHost],
    },
  },
};
