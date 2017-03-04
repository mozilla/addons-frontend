// Config for the -dev server.

const amoCDN = 'https://addons-dev-cdn.allizom.org';
const apiHost = 'https://addons-dev.allizom.org';


module.exports = {
  apiHost,
  amoCDN,
  staticHost: amoCDN,

  enableClientConsole: true,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        apiHost,
      ],
      imgSrc: [
        "'self'",
        amoCDN,
        'data:',
      ],
      scriptSrc: [
        amoCDN,
      ],
      styleSrc: [
        amoCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-dev/
  publicSentryDsn: 'https://2c975f188a8b4d728ecbb8179cff9c26@sentry.prod.mozaws.net/181',
};
