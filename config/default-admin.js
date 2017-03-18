import { amoProdCDN } from './lib/shared';

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
        amoProdCDN,
        staticHost,
        'data:',
      ],
    },
  },

  enablePrefixMiddleware: false,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-admin-prod/
  publicSentryDsn: 'https://7123032e600047dca7c35566e26776cd@sentry.prod.mozaws.net/189',
};
