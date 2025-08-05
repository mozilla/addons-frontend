export const devDomain = 'addons-dev.allizom.org';
export const prodDomain = 'addons.mozilla.org';
export const stageDomain = 'addons.allizom.org';

export const apiDevHost = `https://${devDomain}`;
export const apiProdHost = `https://${prodDomain}`;
export const apiStageHost = `https://${stageDomain}`;

export const baseUrlDev = apiDevHost;
export const baseUrlProd = apiProdHost;
export const baseUrlStage = apiStageHost;

// https://github.com/mozilla/addons/issues/14799#issuecomment-2127359422
// These match Google's recommendations for CSP with GA4.
export const ga4TagManagerHost = 'https://*.googletagmanager.com';
export const ga4AnalyticsHost = 'https://*.google-analytics.com';
export const ga4AdditionalAnalyticsHost = 'https://*.analytics.google.com';

export const staticPath = '/static-frontend/';
export const serverStaticPath = '/static-server/';  // addons-server statics.
export const mediaPath = '/user-media/';  // addons-server user-uploaded media.

// These are all the locales in pontoon
export const devLangs = [
    'af',
    'ar',
    'ast',
    'az',
    'bg',
    'bn',
    'bs',
    'ca',
    'cak',
    'cs',
    'da',
    'de',
    'dsb',
    'el',
    'en-CA',
    'en-GB',
    'en-US',
    'es-AR',
    'es-CL',
    'es-ES',
    'es-MX',
    'et',
    'eu',
    'fa',
    'fi',
    'fr',
    'fur',
    'fy-NL',
    'ga-IE',
    'he',
    'hr',
    'hsb',
    'hu',
    'ia',
    'id',
    'is',
    'it',
    'ja',
    'ka',
    'kab',
    'ko',
    'lt',
    'lv',
    'mk',
    'mn',
    'ms',
    'nb-NO',
    'nl',
    'nn-NO',
    'pa-IN',
    'pl',
    'pt-BR',
    'pt-PT',
    'ro',
    'ru',
    'si',
    'sk',
    'sl',
    'sq',
    'sv-SE',
    'te',
    'th',
    'tr',
    'uk',
    'ur',
    'vi',
    'zh-CN',
    'zh-TW',
  ];
