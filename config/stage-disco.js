const amoCDN = 'https://addons-cdn.allizom.org';
const staticHost = 'https://addons-discovery-cdn.allizom.org';

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
