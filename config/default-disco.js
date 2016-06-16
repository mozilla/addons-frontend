/*
 * This is the default (production) config for the discovery pane app.
 */

const amoCDN = 'https://addons.cdn.mozilla.net';
const staticHost = 'https://addons-discovery.cdn.mozilla.net';

module.exports = {

  staticHost,

  CSP: {
    directives: {
      // Script is limited to the discovery specific CDN.
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoCDN,
        staticHost,
        'https://www.google-analytics.com',
      ],
      mediaSrc: [staticHost],
    },
  },
  trackingEnabled: true,
  trackingId: 'UA-36116321-7',
};
