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

  // https://sentry.prod.mozaws.net/operations/addons-frontend-admin-stage/
  publicSentryDsn: 'https://ab5912bece24474f955a9670b3fea574@sentry.prod.mozaws.net/188',
};
