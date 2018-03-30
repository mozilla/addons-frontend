/* @flow */
import { oneLine } from 'common-tags';

import { REVIEW_FLAG_REASON_OTHER } from 'amo/constants';
import { callApi } from 'core/api';
import type { FlagReviewReasonType } from 'amo/constants';
import type { ApiStateType } from 'core/reducers/api';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { PaginatedApiResponse } from 'core/types/api';

type ExternalReviewTypeBase = {|
  addon: {|
    id: number,
    slug: string,
  |},
  body: string,
  created: Date,
  id: number,
  is_latest: boolean,
  title: string,
  user: {|
    id: number,
    name: string,
    url: string,
  |},
|};

export type ExternalReviewReplyType = {|
  ...ExternalReviewTypeBase,
|};

export type ExternalReviewType = {|
  ...ExternalReviewTypeBase,
  rating: number,
  // This is a possible developer reply to the review.
  reply: ExternalReviewReplyType | null,
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
  rating?: number | null,
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
}: SubmitReviewParams): Promise<ExternalReviewType> {
  return new Promise((resolve) => {
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

type ReplyToReviewParams = {|
  apiState?: ApiStateType,
  body: string,
  errorHandler?: ErrorHandlerType,
  originalReviewId: number,
  title?: string,
|};

export const replyToReview = ({
  apiState,
  body,
  errorHandler,
  originalReviewId,
  title,
}: ReplyToReviewParams = {}): Promise<ExternalReviewReplyType> => {
  return new Promise((resolve) => {
    const endpoint = `reviews/review/${originalReviewId}/reply/`;

    resolve(callApi({
      auth: true,
      body: {
        body,
        title,
      },
      endpoint,
      errorHandler,
      method: 'POST',
      state: apiState,
    }));
  });
};

type GetReviewsParams = {|
  // This is the addon ID, slug, or guid.
  addon?: number | string,
  apiState?: ApiStateType,
  filter?: string,
  page?: number,
  page_size?: number,
  show_grouped_ratings?: boolean,
  user?: number,
  version?: number,
|};

type GetReviewsApiResponse = PaginatedApiResponse<ExternalReviewType>;

export function getReviews(
  { apiState, user, addon, ...params }: GetReviewsParams = {}
): Promise<GetReviewsApiResponse> {
  return new Promise((resolve) => {
    if (!user && !addon) {
      throw new Error('Either user or addon must be specified');
    }
    resolve(callApi({
      auth: true,
      endpoint: 'reviews/review',
      params: { user, addon, ...params },
      state: apiState,
    }));
  });
}

export type GetLatestReviewParams = {|
  addon: number,
  apiState?: ApiStateType,
  user: number,
  version: number,
|};

export function getLatestUserReview(
  { apiState, user, addon, version }: GetLatestReviewParams = {}
): Promise<null | ExternalReviewType> {
  return new Promise((resolve) => {
    if (!user || !addon || !version) {
      throw new Error('user, addon, and version must be specified');
    }
    // The API will only return the latest user review for this add-on
    // and version.
    resolve(getReviews({ apiState, user, addon, version }));
  })
    .then((response) => {
      const reviews = response.results;
      if (reviews.length === 1) {
        return reviews[0];
      } else if (reviews.length === 0) {
        return null;
      }
      throw new Error(oneLine`Unexpectedly received multiple review objects:
        ${JSON.stringify(reviews)}`);
    });
}

type FlagReviewParams = {|
  apiState?: ApiStateType,
  errorHandler?: ErrorHandlerType,
  note?: string,
  reason: FlagReviewReasonType,
  reviewId: number,
|};

export const flagReview = (
  { apiState, errorHandler, note, reason, reviewId }: FlagReviewParams = {}
): Promise<void> => {
  return new Promise((resolve) => {
    if (!reviewId) {
      throw new Error('The reviewId parameter is required');
    }
    if (!reason) {
      throw new Error('The reason parameter is required');
    }
    if (reason === REVIEW_FLAG_REASON_OTHER && !note) {
      throw new Error(
        `When reason is ${reason}, the note parameter is required`
      );
    }
    resolve(callApi({
      auth: true,
      body: {
        flag: reason,
        note,
      },
      endpoint: `reviews/review/${reviewId}/flag`,
      errorHandler,
      method: 'POST',
      state: apiState,
    }));
  });
};
