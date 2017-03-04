// Config for the stage server.

const amoCDN = 'https://addons-stage-cdn.allizom.org';
const apiHost = 'https://addons.allizom.org';


module.exports = {
  apiHost,
  amoCDN,
  staticHost: amoCDN,

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

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-stage/
  publicSentryDsn: 'https://8f0a256ee2c345608510155edafb71f7@sentry.prod.mozaws.net/182',
};
