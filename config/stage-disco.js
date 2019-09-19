import { addonsServerStageCDN, analyticsHost } from './lib/shared';

const addonsFrontendCDN = 'https://addons-discovery-cdn.allizom.org';

module.exports = {
  staticHost: addonsFrontendCDN,

  CSP: {
    directives: {
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [addonsFrontendCDN],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerStageCDN,
        addonsFrontendCDN,
      ],
      mediaSrc: [addonsFrontendCDN],
    },
  },

  // https://sentry.prod.mozaws.net/operations/addons-frontend-disco-stage/
  publicSentryDsn: 'https://45ef7d925267490fa65100a62fef3179@sentry.prod.mozaws.net/185',
};
