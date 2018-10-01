/* @flow */
import invariant from 'invariant';

import type { FlagReviewReasonType } from 'amo/constants';
import type {
  ExternalReviewReplyType,
  ExternalReviewType,
  GroupedRatingsType,
} from 'amo/api/reviews';

export const CREATE_ADDON_REVIEW: 'CREATE_ADDON_REVIEW' = 'CREATE_ADDON_REVIEW';
export const SHOW_EDIT_REVIEW_FORM: 'SHOW_EDIT_REVIEW_FORM' =
  'SHOW_EDIT_REVIEW_FORM';
export const SHOW_REPLY_TO_REVIEW_FORM: 'SHOW_REPLY_TO_REVIEW_FORM' =
  'SHOW_REPLY_TO_REVIEW_FORM';
export const FETCH_GROUPED_RATINGS: 'FETCH_GROUPED_RATINGS' =
  'FETCH_GROUPED_RATINGS';
export const FETCH_REVIEW: 'FETCH_REVIEW' = 'FETCH_REVIEW';
export const FETCH_REVIEWS: 'FETCH_REVIEWS' = 'FETCH_REVIEWS';
export const FETCH_USER_REVIEWS: 'FETCH_USER_REVIEWS' = 'FETCH_USER_REVIEWS';
export const FLASH_REVIEW_MESSAGE: 'FLASH_REVIEW_MESSAGE' =
  'FLASH_REVIEW_MESSAGE';
export const HIDE_FLASHED_REVIEW_MESSAGE: 'HIDE_FLASHED_REVIEW_MESSAGE' =
  'HIDE_FLASHED_REVIEW_MESSAGE';
export const HIDE_EDIT_REVIEW_FORM: 'HIDE_EDIT_REVIEW_FORM' =
  'HIDE_EDIT_REVIEW_FORM';
export const HIDE_REPLY_TO_REVIEW_FORM: 'HIDE_REPLY_TO_REVIEW_FORM' =
  'HIDE_REPLY_TO_REVIEW_FORM';
export const SET_ADDON_REVIEWS: 'SET_ADDON_REVIEWS' = 'SET_ADDON_REVIEWS';
export const SET_GROUPED_RATINGS: 'SET_GROUPED_RATINGS' = 'SET_GROUPED_RATINGS';
export const SET_INTERNAL_REVIEW: 'SET_INTERNAL_REVIEW' = 'SET_INTERNAL_REVIEW';
export const SET_USER_REVIEWS: 'SET_USER_REVIEWS' = 'SET_USER_REVIEWS';
export const SET_REVIEW: 'SET_REVIEW' = 'SET_REVIEW';
export const SET_LATEST_REVIEW: 'SET_LATEST_REVIEW' = 'SET_LATEST_REVIEW';
export const SET_REVIEW_REPLY: 'SET_REVIEW_REPLY' = 'SET_REVIEW_REPLY';
export const SET_REVIEW_WAS_FLAGGED: 'SET_REVIEW_WAS_FLAGGED' =
  'SET_REVIEW_WAS_FLAGGED';
export const SEND_REPLY_TO_REVIEW: 'SEND_REPLY_TO_REVIEW' =
  'SEND_REPLY_TO_REVIEW';
export const SEND_REVIEW_FLAG: 'SEND_REVIEW_FLAG' = 'SEND_REVIEW_FLAG';
export const UPDATE_ADDON_REVIEW: 'UPDATE_ADDON_REVIEW' = 'UPDATE_ADDON_REVIEW';
export const DELETE_ADDON_REVIEW: 'DELETE_ADDON_REVIEW' = 'DELETE_ADDON_REVIEW';
export const UNLOAD_ADDON_REVIEWS: 'UNLOAD_ADDON_REVIEWS' =
  'UNLOAD_ADDON_REVIEWS';

export type ReviewAddonType = {|
  iconUrl: string,
  id: number,
  name: string,
  slug: string,
|};

export type UserReviewType = {|
  reviewAddon: ReviewAddonType,
  body?: string,
  created: Date,
  id: number,
  isDeveloperReply: boolean,
  isLatest: boolean,
  score: number | null,
  reply: UserReviewType | null,
  userId: number,
  userName: string,
  userUrl: string,
  versionId: number | null,
|};

export function createInternalReview(
  review: ExternalReviewType | ExternalReviewReplyType,
): UserReviewType {
  return {
    reviewAddon: {
      iconUrl: review.addon.icon_url,
      id: review.addon.id,
      name: review.addon.name,
      slug: review.addon.slug,
    },
    body: review.body,
    created: review.created,
    id: review.id,
    isDeveloperReply: review.is_developer_reply,
    isLatest: review.is_latest,
    score: review.score || null,
    reply: review.reply ? createInternalReview(review.reply) : null,
    userId: review.user.id,
    userName: review.user.name,
    userUrl: review.user.url,
    versionId: review.version ? review.version.id : null,
  };
}

export type SetReviewAction = {|
  type: typeof SET_REVIEW,
  payload: ExternalReviewType,
|};

export const setReview = (review: ExternalReviewType): SetReviewAction => {
  invariant(review, 'review is required');

  return { type: SET_REVIEW, payload: review };
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

type FetchReviewParams = {|
  errorHandlerId: string,
  reviewId: number,
|};

export type FetchReviewAction = {|
  type: typeof FETCH_REVIEW,
  payload: {|
    errorHandlerId: string,
    reviewId: number,
  |},
|};

export function fetchReview({
  errorHandlerId,
  reviewId,
}: FetchReviewParams): FetchReviewAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(reviewId, 'reviewId is required');

  return {
    type: FETCH_REVIEW,
    payload: { errorHandlerId, reviewId },
  };
}

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

type FetchGroupedRatingsParams = {|
  addonId: number,
  errorHandlerId: string,
|};

export type FetchGroupedRatingsAction = {|
  type: typeof FETCH_GROUPED_RATINGS,
  payload: FetchGroupedRatingsParams,
|};

export function fetchGroupedRatings({
  addonId,
  errorHandlerId,
}: FetchGroupedRatingsParams): FetchGroupedRatingsAction {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  return {
    type: FETCH_GROUPED_RATINGS,
    payload: { addonId, errorHandlerId },
  };
}

type SetGroupedRatingsParams = {|
  addonId: number,
  grouping: GroupedRatingsType,
|};

export type SetGroupedRatingsAction = {|
  type: typeof SET_GROUPED_RATINGS,
  payload: SetGroupedRatingsParams,
|};

export function setGroupedRatings({
  addonId,
  grouping,
}: SetGroupedRatingsParams): SetGroupedRatingsAction {
  invariant(addonId, 'addonId is required');
  invariant(grouping, 'grouping is required');
  return {
    type: SET_GROUPED_RATINGS,
    payload: { addonId, grouping },
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
  pageSize: number,
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
  userId: number,
|};

export type SetUserReviewsAction = {|
  type: typeof SET_USER_REVIEWS,
  payload: SetUserReviewsParams,
|};

export const setUserReviews = ({
  pageSize,
  reviewCount,
  reviews,
  userId,
}: SetUserReviewsParams): SetUserReviewsAction => {
  invariant(pageSize, 'pageSize is required');
  invariant(typeof reviewCount === 'number', 'reviewCount is required');
  invariant(
    Array.isArray(reviews),
    'reviews are required and must be an array',
  );
  invariant(userId, 'userId is required');

  return {
    type: SET_USER_REVIEWS,
    payload: {
      pageSize,
      reviewCount,
      reviews,
      userId,
    },
  };
};

export type SetInternalReviewAction = {|
  type: typeof SET_INTERNAL_REVIEW,
  payload: UserReviewType,
|};

export const setInternalReview = (
  review: UserReviewType,
): SetInternalReviewAction => {
  if (!review) {
    throw new Error('review cannot be empty');
  }
  return { type: SET_INTERNAL_REVIEW, payload: review };
};

type SetAddonReviewsParams = {|
  addonSlug: string,
  pageSize: number,
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
|};

export type SetAddonReviewsAction = {|
  type: typeof SET_ADDON_REVIEWS,
  payload: SetAddonReviewsParams,
|};

export const setAddonReviews = ({
  addonSlug,
  pageSize,
  reviewCount,
  reviews,
}: SetAddonReviewsParams): SetAddonReviewsAction => {
  invariant(addonSlug, 'addonSlug is required');
  invariant(pageSize, 'pageSize is required');
  invariant(typeof reviewCount === 'number', 'reviewCount is required');
  invariant(Array.isArray(reviews), 'reviews is required and must be an array');

  return {
    type: SET_ADDON_REVIEWS,
    payload: {
      addonSlug,
      pageSize,
      reviewCount,
      reviews,
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

type SetLatestReviewParams = {|
  addonId: number,
  addonSlug: string,
  review: ExternalReviewType | null,
  userId: number,
  versionId: number,
|};

export type SetLatestReviewAction = {|
  type: typeof SET_LATEST_REVIEW,
  payload: SetLatestReviewParams,
|};

export const setLatestReview = ({
  addonId,
  addonSlug,
  versionId,
  review,
  userId,
}: SetLatestReviewParams): SetLatestReviewAction => {
  invariant(addonId, 'addonId is required');
  invariant(addonSlug, 'addonSlug is required');
  invariant(review !== undefined, 'review is required');
  invariant(userId, 'userId is required');
  invariant(versionId, 'versionId is required');

  return {
    type: SET_LATEST_REVIEW,
    payload: { addonId, addonSlug, review, userId, versionId },
  };
};

type CreateAddonReviewParams = {|
  addonId: number,
  body?: string,
  errorHandlerId: string,
  score: number,
  versionId: number,
|};

export type CreateAddonReviewAction = {|
  type: typeof CREATE_ADDON_REVIEW,
  payload: CreateAddonReviewParams,
|};

export const createAddonReview = ({
  addonId,
  body,
  errorHandlerId,
  score,
  versionId,
}: CreateAddonReviewParams) => {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(score, 'score is required');
  invariant(versionId, 'versionId is required');

  return {
    type: CREATE_ADDON_REVIEW,
    payload: { addonId, body, errorHandlerId, score, versionId },
  };
};

type UpdateAddonReviewParams = {|
  body?: string,
  errorHandlerId: string,
  score?: number,
  reviewId: number,
|};

export type UpdateAddonReviewAction = {|
  type: typeof UPDATE_ADDON_REVIEW,
  payload: UpdateAddonReviewParams,
|};

export const updateAddonReview = ({
  body,
  errorHandlerId,
  score,
  reviewId,
}: UpdateAddonReviewParams) => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(reviewId, 'reviewId is required');

  return {
    type: UPDATE_ADDON_REVIEW,
    payload: { body, errorHandlerId, score, reviewId },
  };
};

export const ABORTED: 'aborted' = 'aborted';
export const SAVED_RATING: 'saved-rating' = 'saved-rating';
export const SAVED_REVIEW: 'saved-review' = 'saved-review';
export const STARTED_SAVE_RATING: 'started-save-rating' = 'started-save-rating';
export const STARTED_SAVE_REVIEW: 'started-save-review' = 'started-save-review';

export type FlashMessageType =
  | typeof ABORTED
  | typeof SAVED_RATING
  | typeof SAVED_REVIEW
  | typeof STARTED_SAVE_RATING
  | typeof STARTED_SAVE_REVIEW;

export type FlashReviewMessageAction = {|
  type: typeof FLASH_REVIEW_MESSAGE,
  payload: { message: FlashMessageType },
|};

export const flashReviewMessage = (
  message: FlashMessageType,
): FlashReviewMessageAction => {
  invariant(message, 'message is required');

  return {
    type: FLASH_REVIEW_MESSAGE,
    payload: { message },
  };
};

export type HideFlashedReviewMessageAction = {|
  type: typeof HIDE_FLASHED_REVIEW_MESSAGE,
|};

export const hideFlashedReviewMessage = (): HideFlashedReviewMessageAction => {
  return {
    type: HIDE_FLASHED_REVIEW_MESSAGE,
  };
};

type DeleteAddonReviewParams = {|
  addonId: number,
  errorHandlerId: string,
  isReplyToReviewId?: number,
  reviewId: number,
|};

export type DeleteAddonReviewAction = {|
  type: typeof DELETE_ADDON_REVIEW,
  payload: DeleteAddonReviewParams,
|};

export const deleteAddonReview = ({
  addonId,
  errorHandlerId,
  isReplyToReviewId,
  reviewId,
}: DeleteAddonReviewParams) => {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(reviewId, 'reviewId is required');

  return {
    type: DELETE_ADDON_REVIEW,
    payload: { addonId, errorHandlerId, isReplyToReviewId, reviewId },
  };
};

type UnloadAddonReviewsParams = {|
  addonId: number,
  reviewId: number,
|};

export type UnloadAddonReviewsAction = {|
  type: typeof UNLOAD_ADDON_REVIEWS,
  payload: UnloadAddonReviewsParams,
|};

export const unloadAddonReviews = ({
  addonId,
  reviewId,
}: UnloadAddonReviewsParams): UnloadAddonReviewsAction => {
  return {
    type: UNLOAD_ADDON_REVIEWS,
    payload: { addonId, reviewId },
  };
};
