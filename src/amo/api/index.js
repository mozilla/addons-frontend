/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';
import type { ErrorHandlerType } from 'core/errorHandler';
import log from 'core/logger';

export type ApiReviewType = {|
  addon: {|
    id: number,
    slug: string,
  |},
  body: string,
  created: Date,
  id: number,
  is_latest: boolean,
  rating: number,
  title: string,
  user: {|
    id: number,
    name: string,
    url: string,
  |},
  version: ?{|
    id: number,
  |},
|};

// TODO: make a separate function for posting/patching so that we
// can type check each one independently.
export type SubmitReviewParams = {|
  addonId?: number,
  apiState?: ApiStateType,
  body?: string,
  errorHandler?: ErrorHandlerType,
  rating?: number,
  reviewId?: number,
  title?: string,
  versionId?: number,
|};

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
}: SubmitReviewParams): Promise<ApiReviewType> {
  return new Promise(
    (resolve) => {
      const review = {
        addon: undefined,
        rating,
        version: versionId,
        body,
        title,
      };
      let method = 'POST';
      let endpoint = 'reviews/review';

      if (reviewId) {
        endpoint = `${endpoint}/${reviewId}`;
        method = 'PATCH';
        // You cannot update the version of an existing review.
        review.version = undefined;
      } else {
        if (!addonId) {
          throw new Error('addonId is required when posting a new review');
        }
        review.addon = addonId;
      }

      resolve(callApi({
        endpoint,
        body: review,
        method,
        auth: true,
        state: apiState,
        ...apiCallParams,
      }));
    });
}

type GetReviewsParams = {|
  addon?: number,
  filter?: string,
  page?: number,
  page_size?: number,
  show_grouped_ratings?: boolean,
  user?: number,
  version?: number,
|};

export function getReviews(
  { user, addon, ...params }: GetReviewsParams = {}
): Promise<Array<ApiReviewType>> {
  return new Promise((resolve) => {
    if (!user && !addon) {
      throw new Error('Either user or addon must be specified');
    }
    resolve(callApi({
      endpoint: 'reviews/review',
      params: { user, addon, ...params },
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

type GetLatestReviewParams = {|
  addon: number,
  user: number,
  version: number,
|};

export function getLatestUserReview(
  { user, addon, version }: GetLatestReviewParams = {}
): Promise<null | ApiReviewType> {
  return new Promise((resolve) => {
    if (!user || !addon || !version) {
      throw new Error('user, addon, and version must be specified');
    }
    // The API will only return the latest user review for this add-on
    // and version.
    resolve(getReviews({ user, addon, version }));
  })
    .then((reviews) => {
      if (reviews.length === 1) {
        return reviews[0];
      } else if (reviews.length === 0) {
        return null;
      }
      throw new Error(dedent`Unexpectedly received multiple review objects:
        ${JSON.stringify(reviews)}`);
    });
}
