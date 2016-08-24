const amoCDN = 'https://addons-stage-cdn.allizom.org';
const staticHost = 'https://addons-admin-cdn.allizom.org';

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
