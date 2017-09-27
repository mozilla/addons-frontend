/* @flow */
import {
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
  FETCH_REVIEWS,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_REPLY_TO_REVIEW_FORM,
  SEND_REPLY_TO_REVIEW,
  SET_ADDON_REVIEWS,
  SET_REVIEW,
  SET_REVIEW_REPLY,
} from 'amo/constants';
import type {
  ExternalReviewReplyType, ExternalReviewType,
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
  review: ExternalReviewType | ExternalReviewReplyType
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
  type: string,
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
  type: string,
  payload: SetReviewReplyParams,
|};

export const setReviewReply = (
  { originalReviewId, reply }: SetReviewReplyParams = {}
): SetReviewReplyAction => {
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
  type: string,
  payload: {|
    addonSlug: string,
    errorHandlerId: string,
    page: number,
  |},
|};

export function fetchReviews(
  { addonSlug, errorHandlerId, page = 1 }: FetchReviewsParams
): FetchReviewsAction {
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

export const setDenormalizedReview = (
  review: UserReviewType
): SetReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return { type: SET_REVIEW, payload: review };
};

export type SetAddonReviewsAction = {|
  type: string,
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

export const setAddonReviews = (
  { addonSlug, reviewCount, reviews }: SetAddonReviewsParams
): SetAddonReviewsAction => {
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
  type: string,
  payload: SendReplyToReviewParams,
|};

export const sendReplyToReview = ({
  errorHandlerId, originalReviewId, body, title,
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

export const reviewIdAction = (
  { reviewId, type }: ReviewIdActionParams = {}
) => {
  if (!reviewId) {
    throw new Error('The reviewId parameter is required');
  }
  return { type, payload: { reviewId } };
};

type ShowEditReviewFormParams = {|
  reviewId: number,
|};

export type ShowEditReviewFormAction = {|
  type: string,
  payload: ShowEditReviewFormParams,
|};

export const showEditReviewForm = (
  { reviewId }: ShowEditReviewFormParams = {}
): ShowEditReviewFormAction => {
  return reviewIdAction({ type: SHOW_EDIT_REVIEW_FORM, reviewId });
};

type ShowReplyToReviewParams = {|
  reviewId: number,
|};

export type ShowReplyToReviewFormAction = {|
  type: string,
  payload: ShowReplyToReviewParams,
|};

export const showReplyToReviewForm = (
  { reviewId }: ShowReplyToReviewParams = {}
): ShowReplyToReviewFormAction => {
  return reviewIdAction({ type: SHOW_REPLY_TO_REVIEW_FORM, reviewId });
};

type HideEditReviewFormParams = {|
  reviewId: number,
|};

export type HideEditReviewFormAction = {|
  type: string,
  payload: HideEditReviewFormParams,
|};

export const hideEditReviewForm = (
  { reviewId }: HideEditReviewFormParams = {}
): HideEditReviewFormAction => {
  return reviewIdAction({ type: HIDE_EDIT_REVIEW_FORM, reviewId });
};

type HideReplyToReviewFormParams = {|
  reviewId: number,
|};

export type HideReplyToReviewFormAction = {|
  type: string,
  payload: HideReplyToReviewFormParams,
|};

export const hideReplyToReviewForm = (
  { reviewId }: HideReplyToReviewFormParams = {}
): HideReplyToReviewFormAction => {
  return reviewIdAction({ type: HIDE_REPLY_TO_REVIEW_FORM, reviewId });
};
