import { callApi } from 'core/api';
import log from 'core/logger';

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  addonId,
  rating,
  apiState,
  title,
  versionId,
  body,
  reviewId,
  ...apiCallParams
}) {
  return new Promise(
    (resolve) => {
      const data = { rating, version: versionId, body, title };
      let method = 'POST';
      let endpoint = 'reviews/review';

      if (reviewId) {
        endpoint = `${endpoint}/${reviewId}`;
        method = 'PATCH';
        // You cannot update the version of an existing review.
        data.version = undefined;
      } else {
        if (!addonId) {
          throw new Error('addonId is required when posting a new review');
        }
        data.addon = addonId;
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

// TODO: merge getAddonReviews() and getUserReviews()

export function getAddonReviews({ addonSlug } = {}) {
  if (!addonSlug) {
    return Promise.reject(new Error('addonSlug cannot be falsey'));
  }
  return callApi({
    endpoint: 'reviews/review',
    // TODO: addonId not slug
    params: { addon: addonSlug },
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
      endpoint: 'reviews/review',
      params: { user: userId, addon: addonId },
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
