const amoCDN = 'https://addons.cdn.mozilla.net';
const staticHost = 'https://addons-admin.cdn.mozilla.net';

module.exports = {
  apiPath: '/api/v3/internal',
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

  enablePrefixMiddleware: false,
};
