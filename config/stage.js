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
};
