const amoCDN = 'https://addons-dev-cdn.allizom.org';
const staticHost = 'https://addons-admin-dev-cdn.allizom.org';

module.exports = {
  staticHost,

  CSP: {
    directives: {
      scriptSrc: [
        staticHost,
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        amoCDN,
        staticHost,
        'data:',
      ],
    },
  },
};
