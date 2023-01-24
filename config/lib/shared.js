export const devDomain = 'addons-dev.allizom.org';
export const prodDomain = 'addons.mozilla.org';
export const stageDomain = 'addons.allizom.org';

export const apiDevHost = `https://${devDomain}`;
export const apiProdHost = `https://${prodDomain}`;
export const apiStageHost = `https://${stageDomain}`;

export const baseUrlDev = apiDevHost;
export const baseUrlProd = apiProdHost;
export const baseUrlStage = apiStageHost;

export const analyticsHost = 'https://www.google-analytics.com';
export const ga4Host = 'https://www.googletagmanager.com';
// See https://github.com/mozilla/bedrock/issues/11768
export const ga4ConnectHost = 'https://*.google-analytics.com';

export const staticPath = '/static-frontend/';
export const serverStaticPath = '/static-server/';  // addons-server statics.
export const mediaPath = '/user-media/';  // addons-server user-uploaded media.
