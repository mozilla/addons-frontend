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
