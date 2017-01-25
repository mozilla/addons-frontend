import { callApi } from 'core/api';
import log from 'core/logger';

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  rating,
  apiState,
  addonSlug,
  versionId,
  body,
  reviewId,
  ...apiCallParams
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
        ...apiCallParams,
      }));
    });
}

export function getAddonReviews({ addonSlug } = {}) {
  if (!addonSlug) {
    return Promise.reject(new Error('addonSlug cannot be falsey'));
  }
  return callApi({
    endpoint: `addons/addon/${addonSlug}/reviews`,
    method: 'GET',
  })
    .then((response) => {
      // TODO: implement paging through response.next
      if (response.next) {
        log.warn('paging is not yet implemented');
      }
      return response.results;
    });
}

export function getUserReviews({ userId, addonId } = {}) {
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
        log.warn('paging is not yet implemented');
      }
      return response.results;
    })
    .then((reviews) => {
      if (addonId) {
        log.info(`Filtering user ${userId} reviews by addonId ${addonId}`);
        return reviews.filter((review) => review.addon.id === addonId);
      }
      return reviews;
    });
}

export function getLatestUserReview(params) {
  return getUserReviews(params)
    .then((reviews) => {
      const latest = reviews.filter((review) => review.is_latest);
      if (latest.length === 0) {
        return null;
      }
      return latest[0];
    });
}
