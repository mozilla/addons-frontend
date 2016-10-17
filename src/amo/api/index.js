import { callApi } from 'core/api';

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  rating, apiState, addonSlug, versionId, body, reviewId,
}) {
  const data = { rating, version: versionId, body };

  return new Promise(
    (resolve) => {
      if (!addonSlug) {
        throw new Error('addonSlug is required to build the endpoint');
      }
      let method = 'POST';
      let endpoint = `addons/addon/${addonSlug}/reviews`;
      if (reviewId) {
        endpoint = `${endpoint}/${reviewId}`;
        method = 'PATCH';
      }
      resolve(callApi({
        endpoint,
        body: data,
        method,
        auth: true,
        state: apiState,
      }));
    });
}
