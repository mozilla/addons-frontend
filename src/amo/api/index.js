import { callApi } from 'core/api';

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  rating, apiState, addonId, versionId, body, reviewId,
}) {
  const data = { rating, version: versionId, body };
  let method = 'POST';
  let endpoint = `addons/addon/${addonId}/reviews`;

  return new Promise(
    (resolve) => {
      if (!addonId) {
        throw new Error('addonId is required to build the endpoint');
      }
      if (reviewId) {
        endpoint = `${endpoint}/${reviewId}`;
        method = 'PATCH';
      }
      resolve();
    })
    .then(() => callApi({
      endpoint,
      body: data,
      method,
      auth: true,
      state: apiState,
    }));
}
