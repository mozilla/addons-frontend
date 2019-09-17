import { amoStageCDN, baseUrlStage } from './lib/shared';

const staticHost = 'https://addons-amo-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlStage,

  staticHost,

  CSP: {
    directives: {
      fontSrc: [
        staticHost,
      ],
      scriptSrc: [
        staticHost,
        'https://www.google-analytics.com/analytics.js',
      ],
      styleSrc: [staticHost],
      imgSrc: [
        "'self'",
        'data:',
        amoStageCDN,
        staticHost,
      ],
      // This is needed because `prefetchSrc` isn't supported by FF yet.
      // See: https://bugzilla.mozilla.org/show_bug.cgi?id=1457204
      defaultSrc: [amoStageCDN],
      prefetchSrc: [amoStageCDN],
    },
  },

  extensionWorkshopUrl: 'https://extensionworkshop.allizom.org',
};
