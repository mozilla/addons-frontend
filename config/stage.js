// Config for the stage server.

const amoCDN = 'https://addons-stage-cdn.allizom.org';
const apiHost = 'https://addons.allizom.org';
const apiBase = `${apiHost}/api/v3`;
const startLoginUrl = `${apiBase}/internal/accounts/login/start/`;


module.exports = {
  apiHost,
  apiBase,
  amoCDN,
  startLoginUrl,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        "'self'",
        apiHost,
      ],
      imgSrc: [
        "'self'",
        amoCDN,
      ],
    },
  },
};
