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

export function getReviews({ user, addon, ...params } = {}) {
  return new Promise((resolve) => {
    if (!user && !addon) {
      throw new Error('Either user or addon must be specified');
    }
    resolve(callApi({
      endpoint: 'reviews/review',
      params: {
        user, addon, ...params,
      },
    }));
  })
    .then((response) => {
      // TODO: implement paging through response.next
      if (response.next) {
        log.warn('paging is not yet implemented');
      }
      return response.results;
    });
}

export function getLatestUserReview({ user, addon } = {}) {
  return new Promise((resolve) => {
    if (!user || !addon) {
      throw new Error('Both user and addon must be specified');
    }
    // The API will only return the latest user review for this add-on.
    resolve(getReviews({ user, addon }));
  })
    .then((reviews) => {
      if (reviews.length === 1) {
        return reviews[0];
      } else if (reviews.length === 0) {
        return null;
      }
      throw new Error(
        'Unexpectedly received multiple review objects: ' +
        `${JSON.stringify(reviews)}`);
    });
}
