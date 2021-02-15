// Config for the -dev server.
import { addonsServerDevCDN, analyticsHost, apiDevHost, baseUrlDev, sentryHost, devDomain } from './lib/shared';

const addonsFrontendCDN = 'https://addons-amo-dev-cdn.allizom.org';

module.exports = {
  baseURL: baseUrlDev,
  apiHost: apiDevHost,
  amoCDN: addonsServerDevCDN,
  staticHost: addonsFrontendCDN,

  cookieDomain: `.${devDomain}`,

  enableDevTools: true,

  trackingSendWebVitals: true,

  // Content security policy.
  CSP: {
    directives: {
      connectSrc: [
        analyticsHost,
        apiDevHost,
        sentryHost,
      ],
      fontSrc: [
        addonsFrontendCDN,
      ],
      imgSrc: [
        "'self'",
        'data:',
        addonsServerDevCDN,
        addonsFrontendCDN,
      ],
      scriptSrc: [
        addonsFrontendCDN,
        `${analyticsHost}/analytics.js`,
      ],
      styleSrc: [
        addonsFrontendCDN,
      ],
    },
  },

  allowErrorSimulation: true,

  // https://sentry.prod.mozaws.net/operations/addons-frontend-amo-dev/
  publicSentryDsn: 'https://2c975f188a8b4d728ecbb8179cff9c26@sentry.prod.mozaws.net/181',

  extensionWorkshopUrl: 'https://extensionworkshop-dev.allizom.org',
};
