// Config for the -dev server.

const amoCDN = 'https://addons-dev-cdn.allizom.org';
const apiHost = 'https://addons-dev.allizom.org';
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
