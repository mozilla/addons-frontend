/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

import { REVIEW_FLAG_REASON_OTHER } from 'amo/constants';
import { callApi } from 'amo/api';
import type { FlagReviewReasonType } from 'amo/constants';
import type { ApiState } from 'amo/reducers/api';
import type { ErrorHandlerType } from 'amo/types/errorHandler';
import type { PaginatedApiResponse, LocalizedString } from 'amo/types/api';

type ExternalReviewTypeBase = {|
  addon: {|
    icon_url: string,
    id: number,
    name: LocalizedString,
    slug: string,
  |},
  body: string,
  created: Date,
  id: number,
  is_deleted: boolean,
  is_developer_reply: boolean,
  is_latest: boolean,
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
  score: number,
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
  apiState: ApiState,
  body?: string,
  errorHandler?: ErrorHandlerType,
  score?: number | null,
  reviewId?: number,
  versionId?: number,
|};

export type SubmitReviewResponse = ExternalReviewType;

/*
 * POST/PATCH an add-on review using the API.
 */
export function submitReview({
  addonId,
  score,
  apiState,
  versionId,
  body,
  reviewId,
  ...apiCallParams
}: SubmitReviewParams): Promise<SubmitReviewResponse> {
  return new Promise((resolve) => {
    const review = {
      addon: undefined,
      score,
      version: versionId,
      body,
    };
    let method = 'POST';
    let endpoint = 'ratings/rating';

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

    resolve(
      callApi({
        endpoint,
        body: review,
        method,
        auth: true,
        apiState,
        ...apiCallParams,
      }),
    );
  });
}

type ReplyToReviewParams = {|
  apiState: ApiState,
  body: string,
  errorHandler?: ErrorHandlerType,
  originalReviewId: number,
|};

export const replyToReview = ({
  apiState,
  body,
  errorHandler,
  originalReviewId,
}: ReplyToReviewParams): Promise<ExternalReviewReplyType> => {
  return new Promise((resolve) => {
    const endpoint = `ratings/rating/${originalReviewId}/reply/`;

    resolve(
      callApi({
        auth: true,
        body: {
          body,
        },
        endpoint,
        errorHandler,
        method: 'POST',
        apiState,
      }),
    );
  });
};

export type GetReviewsParams = {|
  // This is the addon ID, slug, or guid.
  addon?: number | string,
  apiState: ApiState,
  filter?: string,
  page?: string,
  page_size?: string,
  score?: string,
  show_permissions_for?: number,
  user?: number,
  version?: number,
|};

export type GetReviewsApiResponse = {|
  ...PaginatedApiResponse<ExternalReviewType>,
  // This is undefined unless the request contained addon and show_permissions_for.
  can_reply?: boolean,
|};

export function getReviews({
  apiState,
  user,
  addon,
  ...params
}: GetReviewsParams): Promise<GetReviewsApiResponse> {
  return new Promise((resolve) => {
    invariant(user || addon, 'Either user or addon must be specified');

    resolve(
      callApi({
        auth: true,
        endpoint: 'ratings/rating',
        params: { user, addon, ...params },
        apiState,
      }),
    );
  });
}

export type GetLatestUserReviewParams = {|
  // This is the addon ID, slug, or guid.
  addon: number | string,
  apiState: ApiState,
  user: number,
|};

export type GetLatestUserReviewResponse = null | ExternalReviewType;

export async function getLatestUserReview({
  apiState,
  user,
  addon,
}: GetLatestUserReviewParams): Promise<GetLatestUserReviewResponse> {
  invariant(user, 'The user parameter is required');
  invariant(addon, 'The addon parameter is required');

  // Since version is omitted, the API returns only the latest review.
  const response = await getReviews({ apiState, user, addon });

  const reviews = response.results;
  if (reviews.length === 1) {
    return reviews[0];
  }
  if (reviews.length === 0) {
    return null;
  }
  // Theoretcially, there are enough constraints in the database where we
  // should never receive multiple objects.
  throw new Error(oneLine`Unexpectedly received multiple review objects:
      ${reviews.map((r) => r.id)}`);
}

type FlagReviewParams = {|
  apiState: ApiState,
  errorHandler?: ErrorHandlerType,
  note?: string,
  reason: FlagReviewReasonType,
  reviewId: number,
|};

export const flagReview = ({
  apiState,
  errorHandler,
  note,
  reason,
  reviewId,
}: FlagReviewParams): Promise<void> => {
  return new Promise((resolve) => {
    if (!reviewId) {
      throw new Error('The reviewId parameter is required');
    }
    if (!reason) {
      throw new Error('The reason parameter is required');
    }
    if (reason === REVIEW_FLAG_REASON_OTHER && !note) {
      throw new Error(
        `When reason is ${reason}, the note parameter is required`,
      );
    }
    resolve(
      callApi({
        auth: true,
        body: {
          flag: reason,
          note,
        },
        endpoint: `ratings/rating/${reviewId}/flag`,
        errorHandler,
        method: 'POST',
        apiState,
      }),
    );
  });
};

type DeleteReviewParams = {|
  apiState: ApiState,
  errorHandler: ErrorHandlerType,
  reviewId: number,
|};

export const deleteReview = ({
  apiState,
  errorHandler,
  reviewId,
}: DeleteReviewParams): Promise<void> => {
  invariant(reviewId, 'reviewId is required');
  return new Promise((resolve) => {
    resolve(
      callApi({
        auth: true,
        endpoint: `ratings/rating/${reviewId}/`,
        errorHandler,
        method: 'DELETE',
        apiState,
      }),
    );
  });
};

export type GetReviewParams = {|
  apiState: ApiState,
  reviewId: number,
|};

export const getReview = ({
  apiState,
  reviewId,
}: GetReviewParams): Promise<ExternalReviewType> => {
  invariant(reviewId, 'reviewId is required');
  return new Promise((resolve) => {
    resolve(
      callApi({
        auth: true,
        endpoint: `ratings/rating/${reviewId}/`,
        method: 'GET',
        apiState,
      }),
    );
  });
};
