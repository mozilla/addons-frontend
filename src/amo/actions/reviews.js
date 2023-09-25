/* @flow */
import invariant from 'invariant';

import type { FlagReviewReasonType } from 'amo/constants';
import type {
  ExternalReviewReplyType,
  ExternalReviewType,
} from 'amo/api/reviews';
import type { UserId } from 'amo/reducers/users';

export const CREATE_ADDON_REVIEW: 'CREATE_ADDON_REVIEW' = 'CREATE_ADDON_REVIEW';
export const SHOW_EDIT_REVIEW_FORM: 'SHOW_EDIT_REVIEW_FORM' =
  'SHOW_EDIT_REVIEW_FORM';
export const SHOW_REPLY_TO_REVIEW_FORM: 'SHOW_REPLY_TO_REVIEW_FORM' =
  'SHOW_REPLY_TO_REVIEW_FORM';
export const FETCH_REVIEW: 'FETCH_REVIEW' = 'FETCH_REVIEW';
export const FETCH_REVIEW_PERMISSIONS: 'FETCH_REVIEW_PERMISSIONS' =
  'FETCH_REVIEW_PERMISSIONS';
export const FETCH_REVIEWS: 'FETCH_REVIEWS' = 'FETCH_REVIEWS';
export const FETCH_LATEST_USER_REVIEW: 'FETCH_LATEST_USER_REVIEW' =
  'FETCH_LATEST_USER_REVIEW';
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
export const SET_INTERNAL_REVIEW: 'SET_INTERNAL_REVIEW' = 'SET_INTERNAL_REVIEW';
export const SET_USER_REVIEWS: 'SET_USER_REVIEWS' = 'SET_USER_REVIEWS';
export const SET_REVIEW: 'SET_REVIEW' = 'SET_REVIEW';
export const SET_LATEST_REVIEW: 'SET_LATEST_REVIEW' = 'SET_LATEST_REVIEW';
export const SET_REVIEW_PERMISSIONS: 'SET_REVIEW_PERMISSIONS' =
  'SET_REVIEW_PERMISSIONS';
export const SET_REVIEW_REPLY: 'SET_REVIEW_REPLY' = 'SET_REVIEW_REPLY';
export const SET_REVIEW_WAS_FLAGGED: 'SET_REVIEW_WAS_FLAGGED' =
  'SET_REVIEW_WAS_FLAGGED';
export const SEND_REPLY_TO_REVIEW: 'SEND_REPLY_TO_REVIEW' =
  'SEND_REPLY_TO_REVIEW';
export const SEND_REVIEW_FLAG: 'SEND_REVIEW_FLAG' = 'SEND_REVIEW_FLAG';
export const UPDATE_ADDON_REVIEW: 'UPDATE_ADDON_REVIEW' = 'UPDATE_ADDON_REVIEW';
export const DELETE_ADDON_REVIEW: 'DELETE_ADDON_REVIEW' = 'DELETE_ADDON_REVIEW';
export const BEGIN_DELETE_ADDON_REVIEW: 'BEGIN_DELETE_ADDON_REVIEW' =
  'BEGIN_DELETE_ADDON_REVIEW';
export const CANCEL_DELETE_ADDON_REVIEW: 'CANCEL_DELETE_ADDON_REVIEW' =
  'CANCEL_DELETE_ADDON_REVIEW';
export const UNLOAD_ADDON_REVIEWS: 'UNLOAD_ADDON_REVIEWS' =
  'UNLOAD_ADDON_REVIEWS';
export const UPDATE_RATING_COUNTS: 'UPDATE_RATING_COUNTS' =
  'UPDATE_RATING_COUNTS';

export type ReviewAddonType = {|
  iconUrl: string,
  id: number,
  name: Object,
  slug: string,
|};

export type UserReviewType = {|
  reviewAddon: ReviewAddonType,
  body?: string,
  created: Date,
  id: number,
  isDeleted: boolean,
  isDeveloperReply: boolean,
  isLatest: boolean,
  score: number | null,
  reply: UserReviewType | null,
  userId: UserId,
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
    isDeleted: review.is_deleted,
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
}: SetReviewReplyParams): SetReviewReplyAction => {
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
  page?: string,
  score: string | null,
|};

export type FetchReviewsAction = {|
  type: typeof FETCH_REVIEWS,
  payload: {|
    addonSlug: string,
    errorHandlerId: string,
    page: string,
    score: string | null,
  |},
|};

export function fetchReviews({
  addonSlug,
  errorHandlerId,
  page = '1',
  score,
}: FetchReviewsParams): FetchReviewsAction {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId cannot be empty');
  }
  if (!addonSlug) {
    throw new Error('addonSlug cannot be empty');
  }
  return {
    type: FETCH_REVIEWS,
    payload: { addonSlug, errorHandlerId, page, score },
  };
}

type FetchReviewPermissionsParams = {|
  errorHandlerId: string,
  addonId: number,
  userId: UserId,
|};

export type FetchReviewPermissionsAction = {|
  type: typeof FETCH_REVIEW_PERMISSIONS,
  payload: FetchReviewPermissionsParams,
|};

export function fetchReviewPermissions({
  errorHandlerId,
  addonId,
  userId,
}: FetchReviewPermissionsParams): FetchReviewPermissionsAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(addonId, 'addonId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_REVIEW_PERMISSIONS,
    payload: { errorHandlerId, addonId, userId },
  };
}

type SetReviewPermissionsParams = {|
  addonId: number,
  userId: UserId,
  canReplyToReviews: boolean,
|};

export type SetReviewPermissionsAction = {|
  type: typeof SET_REVIEW_PERMISSIONS,
  payload: SetReviewPermissionsParams,
|};

export function setReviewPermissions({
  addonId,
  userId,
  canReplyToReviews,
}: SetReviewPermissionsParams): SetReviewPermissionsAction {
  invariant(addonId, 'addonId is required');
  invariant(userId, 'userId is required');
  invariant(
    typeof canReplyToReviews !== 'undefined',
    'canReplyToReviews is required',
  );

  return {
    type: SET_REVIEW_PERMISSIONS,
    payload: { addonId, userId, canReplyToReviews },
  };
}

type UpdateRatingCountsParams = {|
  addonId: number,
  oldReview?: UserReviewType,
  newReview: UserReviewType,
|};

export type UpdateRatingCountsAction = {|
  type: typeof UPDATE_RATING_COUNTS,
  payload: UpdateRatingCountsParams,
|};

export function updateRatingCounts({
  addonId,
  oldReview,
  newReview,
}: UpdateRatingCountsParams): UpdateRatingCountsAction {
  invariant(addonId, 'addonId is required');
  invariant(newReview, 'newReview is required');
  return {
    type: UPDATE_RATING_COUNTS,
    payload: { addonId, oldReview, newReview },
  };
}

type FetchLatestUserReviewParams = {|
  addonId: number,
  errorHandlerId: string,
  userId: UserId,
|};

export type FetchLatestUserReviewAction = {|
  type: typeof FETCH_LATEST_USER_REVIEW,
  payload: FetchLatestUserReviewParams,
|};

export function fetchLatestUserReview({
  addonId,
  errorHandlerId,
  userId,
}: FetchLatestUserReviewParams): FetchLatestUserReviewAction {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_LATEST_USER_REVIEW,
    payload: {
      addonId,
      errorHandlerId,
      userId,
    },
  };
}

export type FetchUserReviewsAction = {|
  type: typeof FETCH_USER_REVIEWS,
  payload: {|
    errorHandlerId: string,
    page: string,
    userId: UserId,
  |},
|};

export function fetchUserReviews({
  errorHandlerId,
  userId,
  page = '1',
}: {|
  errorHandlerId: string,
  page?: string,
  userId: UserId,
|}): FetchUserReviewsAction {
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
  pageSize: string,
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
  userId: UserId,
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
  page: string,
  pageSize: string,
  reviewCount: number,
  reviews: Array<ExternalReviewType>,
  score: string | null,
|};

export type SetAddonReviewsAction = {|
  type: typeof SET_ADDON_REVIEWS,
  payload: SetAddonReviewsParams,
|};

export const setAddonReviews = ({
  addonSlug,
  page,
  pageSize,
  reviewCount,
  reviews,
  score,
}: SetAddonReviewsParams): SetAddonReviewsAction => {
  invariant(addonSlug, 'addonSlug is required');
  invariant(page, 'page is required');
  invariant(pageSize, 'pageSize is required');
  invariant(typeof reviewCount === 'number', 'reviewCount is required');
  invariant(Array.isArray(reviews), 'reviews is required and must be an array');
  invariant(typeof score !== 'undefined', 'score is required');

  return {
    type: SET_ADDON_REVIEWS,
    payload: {
      addonSlug,
      page,
      pageSize,
      reviewCount,
      reviews,
      score,
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
}: SendReplyToReviewParams): SendReplyToReviewAction => {
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
}: ReviewIdActionParams): any => {
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
}: ShowEditReviewFormParams): ShowEditReviewFormAction => {
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
}: ShowReplyToReviewParams): ShowReplyToReviewFormAction => {
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
}: HideEditReviewFormParams): HideEditReviewFormAction => {
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
}: HideReplyToReviewFormParams): HideReplyToReviewFormAction => {
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
}: FlagReviewParams): FlagReviewAction => {
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
}: ReviewWasFlaggedParams): ReviewWasFlaggedAction => {
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
  review: ExternalReviewType | null,
  userId: UserId,
|};

export type SetLatestReviewAction = {|
  type: typeof SET_LATEST_REVIEW,
  payload: SetLatestReviewParams,
|};

export const setLatestReview = ({
  addonId,
  review,
  userId,
}: SetLatestReviewParams): SetLatestReviewAction => {
  invariant(addonId, 'addonId is required');
  invariant(review !== undefined, 'review is required');
  invariant(userId, 'userId is required');

  return {
    type: SET_LATEST_REVIEW,
    payload: { addonId, review, userId },
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
}: CreateAddonReviewParams): CreateAddonReviewAction => {
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
}: UpdateAddonReviewParams): UpdateAddonReviewAction => {
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
}: DeleteAddonReviewParams): DeleteAddonReviewAction => {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(reviewId, 'reviewId is required');

  return {
    type: DELETE_ADDON_REVIEW,
    payload: { addonId, errorHandlerId, isReplyToReviewId, reviewId },
  };
};

type BeginDeleteAddonReviewParams = {|
  reviewId: number,
|};

export type BeginDeleteAddonReviewAction = {|
  type: typeof BEGIN_DELETE_ADDON_REVIEW,
  payload: BeginDeleteAddonReviewParams,
|};

export const beginDeleteAddonReview = ({
  reviewId,
}: BeginDeleteAddonReviewParams): BeginDeleteAddonReviewAction => {
  return {
    type: BEGIN_DELETE_ADDON_REVIEW,
    payload: { reviewId },
  };
};

type CancelDeleteAddonReviewParams = {|
  reviewId: number,
|};

export type CancelDeleteAddonReviewAction = {|
  type: typeof CANCEL_DELETE_ADDON_REVIEW,
  payload: CancelDeleteAddonReviewParams,
|};

export const cancelDeleteAddonReview = ({
  reviewId,
}: CancelDeleteAddonReviewParams): CancelDeleteAddonReviewAction => {
  return {
    type: CANCEL_DELETE_ADDON_REVIEW,
    payload: { reviewId },
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
