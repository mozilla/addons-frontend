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

  // https://sentry.prod.mozaws.net/operations/addons-frontend-admin-dev/
  publicSentryDsn: 'https://03989a9e71914408a761588016a140a6@sentry.prod.mozaws.net/187',
};
