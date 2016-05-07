// Config for the -dev server.

const amoCDN = 'https://addons-dev-cdn.allizom.org';
const apiHost = 'https://addons-dev.allizom.org';


module.exports = {
  apiHost,
  amoCDN,

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
