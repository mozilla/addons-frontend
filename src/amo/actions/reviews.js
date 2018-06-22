/* @flow */
import invariant from 'invariant';

import {
  CLEAR_ADDON_REVIEWS,
  FETCH_REVIEWS,
  FETCH_USER_REVIEWS,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_REPLY_TO_REVIEW_FORM,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SET_ADDON_REVIEWS,
  SET_USER_REVIEWS,
  SET_REVIEW,
  SET_REVIEW_REPLY,
  SET_REVIEW_WAS_FLAGGED,
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
} from 'amo/constants';
import type { FlagReviewReasonType } from 'amo/constants';
import type {
  ExternalReviewReplyType,
  ExternalReviewType,
} from 'amo/api/reviews';

export type UserReviewType = {|
  addonId: number,
  addonSlug: string,
  body?: string,
  created: Date,
  id: number,
  isLatest: boolean,
  rating: number | null,
  reply: UserReviewType | null,
  title: string,
  userId: number,
  userName: string,
  userUrl: string,
  versionId: number | null,
|};

export function denormalizeReview(
  review: ExternalReviewType | ExternalReviewReplyType,
): UserReviewType {
  return {
    addonId: review.addon.id,
    addonSlug: review.addon.slug,
    body: review.body,
    created: review.created,
    id: review.id,
    isLatest: review.is_latest,
    rating: review.rating || null,
    reply: review.reply ? denormalizeReview(review.reply) : null,
    title: review.title,
    userId: review.user.id,
    userName: review.user.name,
    userUrl: review.user.url,
    versionId: review.version ? review.version.id : null,
  };
}

export type SetReviewAction = {|
  type: typeof SET_REVIEW,
  payload: UserReviewType,
|};

export const setReview = (review: ExternalReviewType): SetReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  // TODO: move denormalizeReview() to the reducer.
  // https://github.com/mozilla/addons-frontend/issues/3342
  return { type: SET_REVIEW, payload: denormalizeReview(review) };
};

type SetReviewReplyParams = {|
  originalReviewId: number,
  reply: ExternalReviewReplyType,
|};

export type SetReviewReplyAction = {|
  type: typeof SET_REVIEW_REPLY,
  payload: SetReviewReplyParams,
|};

export const setReviewReply = ({
  originalReviewId,
  reply,
}: SetReviewReplyParams = {}): SetReviewReplyAction => {
  if (!originalReviewId) {
    throw new Error('The originalReviewId parameter is required');
  }
  if (!reply) {
    throw new Error('The reply parameter is required');
  }
  return {
    type: SET_REVIEW_REPLY,
    payload: { originalReviewId, reply },
  };
};

type FetchReviewsParams = {|
  addonSlug: string,
  errorHandlerId: string,
  page?: number,
|};

export type FetchReviewsAction = {|
  type: typeof FETCH_REVIEWS,
  payload: {|
    addonSlug: string,
    errorHandlerId: string,
    page: number,
  |},
|};

export function fetchReviews({
  addonSlug,
  errorHandlerId,
  page = 1,
}: FetchReviewsParams): FetchReviewsAction {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId cannot be empty');
  }
  if (!addonSlug) {
    throw new Error('addonSlug cannot be empty');
  }
  return {
    type: FETCH_REVIEWS,
    payload: { addonSlug, errorHandlerId, page },
  };
}

type FetchUserReviewsParams = {|
  errorHandlerId: string,
  page?: number,
  userId: number,
|};

export type FetchUserReviewsAction = {|
  type: typeof FETCH_USER_REVIEWS,
  payload: {|
    errorHandlerId: string,
    page: number,
    userId: number,
  |},
|};

export function fetchUserReviews({
  errorHandlerId,
  userId,
  page = 1,
}: FetchUserReviewsParams): FetchUserReviewsAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_USER_REVIEWS,
    payload: {
      errorHandlerId,
      page,
      userId,
    },
  };
}

type SetUserReviewsParams = {|
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
  userId: number,
|};

export type SetUserReviewsAction = {|
  type: typeof SET_USER_REVIEWS,
  payload: {|
    reviewCount: number,
    reviews: Array<UserReviewType>,
    userId: number,
  |},
|};

export const setUserReviews = ({
  reviewCount,
  reviews,
  userId,
}: SetUserReviewsParams): SetUserReviewsAction => {
  invariant(typeof reviewCount === 'number', 'reviewCount is required');
  invariant(
    Array.isArray(reviews),
    'reviews are required and must be an array',
  );
  invariant(userId, 'userId is required');

  return {
    type: SET_USER_REVIEWS,
    payload: {
      reviewCount,
      reviews: reviews.map((review) => denormalizeReview(review)),
      userId,
    },
  };
};

export const setDenormalizedReview = (
  review: UserReviewType,
): SetReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return { type: SET_REVIEW, payload: review };
};

export type SetAddonReviewsAction = {|
  type: typeof SET_ADDON_REVIEWS,
  payload: {|
    addonSlug: string,
    reviewCount: number,
    reviews: Array<UserReviewType>,
  |},
|};

type SetAddonReviewsParams = {|
  addonSlug: string,
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
|};

export const setAddonReviews = ({
  addonSlug,
  reviewCount,
  reviews,
}: SetAddonReviewsParams): SetAddonReviewsAction => {
  if (!addonSlug) {
    throw new Error('addonSlug cannot be empty');
  }
  if (!Array.isArray(reviews)) {
    throw new Error('reviews must be an Array');
  }
  if (typeof reviewCount === 'undefined') {
    throw new Error('reviewCount must be set');
  }
  return {
    type: SET_ADDON_REVIEWS,
    payload: {
      addonSlug,
      reviewCount,
      reviews: reviews.map((review) => denormalizeReview(review)),
    },
  };
};

type SendReplyToReviewParams = {|
  errorHandlerId: string,
  originalReviewId: number,
  body: string,
  title?: string,
|};

export type SendReplyToReviewAction = {|
  type: typeof SEND_REPLY_TO_REVIEW,
  payload: SendReplyToReviewParams,
|};

export const sendReplyToReview = ({
  errorHandlerId,
  originalReviewId,
  body,
  title,
}: SendReplyToReviewParams = {}): SendReplyToReviewAction => {
  if (!errorHandlerId) {
    throw new Error('The errorHandlerId parameter is required');
  }
  if (!originalReviewId) {
    throw new Error('The originalReviewId parameter is required');
  }
  if (!body) {
    throw new Error('The body parameter is required');
  }
  return {
    type: SEND_REPLY_TO_REVIEW,
    payload: { errorHandlerId, originalReviewId, body, title },
  };
};

type ReviewIdActionParams = {|
  reviewId: number,
  type: string,
|};

export const reviewIdAction = ({
  reviewId,
  type,
}: ReviewIdActionParams = {}): any => {
  if (!reviewId) {
    throw new Error('The reviewId parameter is required');
  }
  return { type, payload: { reviewId } };
};

type ShowEditReviewFormParams = {|
  reviewId: number,
|};

export type ShowEditReviewFormAction = {|
  type: typeof SHOW_EDIT_REVIEW_FORM,
  payload: ShowEditReviewFormParams,
|};

export const showEditReviewForm = ({
  reviewId,
}: ShowEditReviewFormParams = {}): ShowEditReviewFormAction => {
  return reviewIdAction({ type: SHOW_EDIT_REVIEW_FORM, reviewId });
};

type ShowReplyToReviewParams = {|
  reviewId: number,
|};

export type ShowReplyToReviewFormAction = {|
  type: typeof SHOW_REPLY_TO_REVIEW_FORM,
  payload: ShowReplyToReviewParams,
|};

export const showReplyToReviewForm = ({
  reviewId,
}: ShowReplyToReviewParams = {}): ShowReplyToReviewFormAction => {
  return reviewIdAction({ type: SHOW_REPLY_TO_REVIEW_FORM, reviewId });
};

type HideEditReviewFormParams = {|
  reviewId: number,
|};

export type HideEditReviewFormAction = {|
  type: typeof HIDE_EDIT_REVIEW_FORM,
  payload: HideEditReviewFormParams,
|};

export const hideEditReviewForm = ({
  reviewId,
}: HideEditReviewFormParams = {}): HideEditReviewFormAction => {
  return reviewIdAction({ type: HIDE_EDIT_REVIEW_FORM, reviewId });
};

type HideReplyToReviewFormParams = {|
  reviewId: number,
|};

export type HideReplyToReviewFormAction = {|
  type: typeof HIDE_REPLY_TO_REVIEW_FORM,
  payload: HideReplyToReviewFormParams,
|};

export const hideReplyToReviewForm = ({
  reviewId,
}: HideReplyToReviewFormParams = {}): HideReplyToReviewFormAction => {
  return reviewIdAction({ type: HIDE_REPLY_TO_REVIEW_FORM, reviewId });
};

type FlagReviewParams = {|
  errorHandlerId: string,
  note?: string,
  reason: FlagReviewReasonType,
  reviewId: number,
|};

export type FlagReviewAction = {|
  type: typeof SEND_REVIEW_FLAG,
  payload: FlagReviewParams,
|};

export const flagReview = ({
  errorHandlerId,
  note,
  reason,
  reviewId,
}: FlagReviewParams = {}): FlagReviewAction => {
  if (!errorHandlerId) {
    throw new Error('The errorHandlerId parameter is required');
  }
  if (!reason) {
    throw new Error('The reason parameter is required');
  }
  if (!reviewId) {
    throw new Error('The reviewId parameter is required');
  }
  return {
    type: SEND_REVIEW_FLAG,
    payload: { errorHandlerId, note, reason, reviewId },
  };
};

type ReviewWasFlaggedParams = {|
  reason: FlagReviewReasonType,
  reviewId: number,
|};

export type ReviewWasFlaggedAction = {|
  type: typeof SET_REVIEW_WAS_FLAGGED,
  payload: ReviewWasFlaggedParams,
|};

export const setReviewWasFlagged = ({
  reason,
  reviewId,
}: ReviewWasFlaggedParams = {}): ReviewWasFlaggedAction => {
  if (!reason) {
    throw new Error('The reason parameter is required');
  }
  if (!reviewId) {
    throw new Error('The reviewId parameter is required');
  }
  return {
    type: SET_REVIEW_WAS_FLAGGED,
    payload: { reason, reviewId },
  };
};

type ClearAddonReviewsParams = {|
  addonSlug: string,
|};

export type ClearAddonReviewsAction = {|
  type: typeof CLEAR_ADDON_REVIEWS,
  payload: ClearAddonReviewsParams,
|};

export const clearAddonReviews = ({
  addonSlug,
}: ClearAddonReviewsParams): ClearAddonReviewsAction => {
  if (!addonSlug) {
    throw new Error('the addonSlug parameter is required');
  }
  return {
    type: CLEAR_ADDON_REVIEWS,
    payload: { addonSlug },
  };
};
