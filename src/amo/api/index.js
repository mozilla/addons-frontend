import { callApi } from 'core/api';
import log from 'core/logger';

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

export function getUserReviews({
  userId, addonId, onlyTheLatest = false,
} = {}) {
  return new Promise((resolve) => {
    if (!userId) {
      throw new Error('userId cannot be falsey');
    }
    resolve(callApi({
      endpoint: `accounts/account/${userId}/reviews`,
    }));
  })
    .then((response) => {
      // TODO: implement paging through response.next
      if (response.next) {
        throw new Error('paging is not yet implemented');
      }
      return response.results;
    })
    .then((reviews) => {
      if (addonId) {
        log.info(`Filtering user ${userId} reviews by addonId ${addonId}`);
        return reviews.filter((review) => review.addon.id === addonId);
      }
      return reviews;
    })
    .then((reviews) => {
      if (onlyTheLatest) {
        log.info(`Only fetching the latest review by user ${userId}`);
        const latest = reviews.filter((review) => review.is_latest);
        if (latest.length === 0) {
          return null;
        }
        return latest[0];
      }
      return reviews;
    });
}
