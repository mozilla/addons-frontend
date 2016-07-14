const amoCDN = 'https://addons.cdn.mozilla.net';
const staticHost = 'https://addons-admin.cdn.mozilla.net';

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

  redirectLangPrefix: false,
};
