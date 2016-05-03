// Config for the stage server.

const amoCDN = 'https://addons-stage-cdn.allizom.org';
const apiHost = 'https://addons.allizom.org';


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
