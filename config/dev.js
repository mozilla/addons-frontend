// Config for the -dev server.

const amoCDN = 'https://addons-dev-cdn.allizom.org';
const apiHost = 'https://addons-dev.allizom.org';


module.exports = {
  apiHost,
  amoCDN,

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
};
