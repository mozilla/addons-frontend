import { callApi } from 'core/api';

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  rating, apiState, addonSlug, versionId, body, reviewId,
}) {
  const data = { rating, version: versionId, body };
  if (reviewId) {
    // You cannot update the version of an existing review.
    data.version = undefined;
  }

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

export function getUserReviews({ userId } = {}) {
  return new Promise((resolve) => {
    if (!userId) {
      throw new Error('userId cannot be falsey');
    }
    // Warning: if you rely on this API as is, you'll have to implement
    // your own paging.
    resolve(callApi({
      endpoint: `accounts/account/${userId}/reviews`,
    }));
  });
}
