/* @flow */
import { oneLine } from 'common-tags';

import {
  CLEAR_ADDON_REVIEWS,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SET_ADDON_REVIEWS,
  SET_USER_REVIEWS,
  SET_LATEST_REVIEW,
  SET_REVIEW,
  SET_REVIEW_REPLY,
  SET_REVIEW_WAS_FLAGGED,
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_REPLY_TO_REVIEW_FORM,
} from 'amo/constants';
import { denormalizeReview } from 'amo/actions/reviews';
import type {
  ClearAddonReviewsAction,
  FlagReviewAction,
  HideEditReviewFormAction,
  HideReplyToReviewFormAction,
  ReviewWasFlaggedAction,
  SendReplyToReviewAction,
  SetAddonReviewsAction,
  SetLatestReviewAction,
  SetReviewAction,
  SetReviewReplyAction,
  ShowEditReviewFormAction,
  ShowReplyToReviewFormAction,
  UserReviewType,
} from 'amo/actions/reviews';
import type { FlagReviewReasonType } from 'amo/constants';

type ReviewsById = {
  [id: number]: UserReviewType,
};

type StoredReviewsData = {|
  pageSize: number,
  reviewCount: number,
  reviews: Array<number>,
|};

type ReviewsData = {|
  ...StoredReviewsData,
  reviews: Array<UserReviewType>,
|};

type ReviewsByAddon = {
  [slug: string]: StoredReviewsData,
};

type ReviewsByUserId = {
  [userId: number]: StoredReviewsData,
};

export type FlagState = {
  reason: FlagReviewReasonType,
  inProgress: boolean,
  wasFlagged: boolean,
};

type ViewStateByReviewId = {|
  editingReview: boolean,
  flag: FlagState,
  replyingToReview: boolean,
  submittingReply: boolean,
|};

export type ReviewsState = {|
  byAddon: ReviewsByAddon,
  byId: ReviewsById,
  byUserId: ReviewsByUserId,
  latestByAddonVersion: {
    // The latest user review for add-on / version
    // or null if one does not exist yet.
    [userIdAddonIdVersionId: string]: number | null,
  },
  view: {
    [reviewId: number]: ViewStateByReviewId,
  },
|};

export const initialState: ReviewsState = {
  byAddon: {},
  byId: {},
  byUserId: {},
  latestByAddonVersion: {},
  // This stores review-related UI state.
  view: {},
};

export const selectReview = (
  reviewsState: ReviewsState,
  id: number,
): UserReviewType | void => {
  return reviewsState.byId[id];
};

export const expandReviewObjects = ({
  state,
  reviews,
}: {|
  state: ReviewsState,
  reviews: Array<number>,
|}): Array<UserReviewType> => {
  return reviews.map((id) => {
    const review = selectReview(state, id);
    if (!review) {
      throw new Error(`No stored review exists for ID ${id}`);
    }
    return review;
  });
};

type StoreReviewObjectsParams = {|
  state: ReviewsState,
  reviews: Array<UserReviewType>,
|};

export const storeReviewObjects = ({
  state,
  reviews,
}: StoreReviewObjectsParams): ReviewsById => {
  const byId = { ...state.byId };

  reviews.forEach((review) => {
    if (!review.id) {
      throw new Error('Cannot store review because review.id is falsy');
    }
    byId[review.id] = review;
  });

  return byId;
};

type ChangeViewStateParams = {|
  state: ReviewsState,
  reviewId: number,
  stateChange: $Shape<ViewStateByReviewId>,
|};

export const changeViewState = ({
  state,
  reviewId,
  stateChange,
}: ChangeViewStateParams = {}): ReviewsState => {
  const change = { ...stateChange };

  const existingFlag = state.view[reviewId] ? state.view[reviewId].flag : {};

  return {
    ...state,
    view: {
      ...state.view,
      [reviewId]: {
        editingReview: false,
        replyingToReview: false,
        submittingReply: false,
        ...state.view[reviewId],
        ...change,
        flag: {
          ...existingFlag,
          ...change.flag,
        },
      },
    },
  };
};

export const getReviewsByUserId = (
  reviewsState: ReviewsState,
  userId: number,
): ReviewsData | null => {
  const storedReviewsData = reviewsState.byUserId[userId];

  return storedReviewsData
    ? {
        pageSize: storedReviewsData.pageSize,
        reviewCount: storedReviewsData.reviewCount,
        reviews: expandReviewObjects({
          reviews: storedReviewsData.reviews,
          state: reviewsState,
        }),
      }
    : null;
};

export const latestByAddonVersionKey = ({
  userId,
  addonId,
  versionId,
}: {|
  userId: number,
  addonId: number,
  versionId: number,
|}) => {
  return `user${userId}-addon${addonId}-version${versionId}`;
};

export const selectLatestUserReview = ({
  reviewsState,
  userId,
  addonId,
  versionId,
}: {|
  reviewsState: ReviewsState,
  userId: number,
  addonId: number,
  versionId: number,
|}): UserReviewType | null | void => {
  const key = latestByAddonVersionKey({ userId, addonId, versionId });
  const userReviewId = reviewsState.latestByAddonVersion[key];

  if (userReviewId === null) {
    // This means an action had previously attempted to fetch the latest
    // user review but one does not exist.
    return null;
  }

  // Return the review object or undefined if no attempt has been made
  // to fetch the latest user review.
  return selectReview(reviewsState, userReviewId);
};

type ReviewActionType =
  | ClearAddonReviewsAction
  | HideEditReviewFormAction
  | HideReplyToReviewFormAction
  | SendReplyToReviewAction
  | SetAddonReviewsAction
  | SetLatestReviewAction
  | SetReviewAction
  | SetReviewReplyAction
  | ShowEditReviewFormAction
  | ShowReplyToReviewFormAction
  | FlagReviewAction
  | ReviewWasFlaggedAction;

export default function reviewsReducer(
  state: ReviewsState = initialState,
  action: ReviewActionType,
) {
  switch (action.type) {
    case SEND_REPLY_TO_REVIEW:
      return changeViewState({
        state,
        reviewId: action.payload.originalReviewId,
        stateChange: { submittingReply: true },
      });
    case SHOW_EDIT_REVIEW_FORM:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { editingReview: true },
      });
    case SHOW_REPLY_TO_REVIEW_FORM:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { replyingToReview: true },
      });
    case HIDE_EDIT_REVIEW_FORM:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { editingReview: false },
      });
    case HIDE_REPLY_TO_REVIEW_FORM:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: {
          replyingToReview: false,
          submittingReply: false,
        },
      });
    case SET_LATEST_REVIEW: {
      const { payload } = action;
      const { addonId, userId, review, versionId } = payload;
      const key = latestByAddonVersionKey({
        addonId,
        userId,
        versionId,
      });

      let { byId } = state;
      if (review) {
        byId = storeReviewObjects({
          state,
          reviews: [denormalizeReview(review)],
        });
      }

      return {
        ...state,
        byId,
        // Reset all add-on reviews to trigger a refresh from the server.
        // Since we don't know the exact add-on slug we can't erase only
        // the relevant reviews.
        byAddon: initialState.byAddon,
        byUserId: {
          ...state.byUserId,
          // Reset all user reviews to trigger a refresh from the server.
          [userId]: undefined,
        },
        latestByAddonVersion: {
          ...state.latestByAddonVersion,
          [key]: review ? review.id : null,
        },
      };
    }
    case SET_REVIEW: {
      const { payload } = action;
      return {
        ...state,
        byId: storeReviewObjects({ state, reviews: [payload] }),
        byUserId: {
          ...state.byUserId,
          // This will trigger a refresh from the server.
          [payload.userId]: undefined,
        },
      };
    }
    case SET_REVIEW_REPLY: {
      const reviewId = action.payload.originalReviewId;
      const review = state.byId[reviewId];
      if (!review) {
        throw new Error(oneLine`Cannot store reply to review ID
          ${reviewId} because it does not exist`);
      }
      return {
        ...state,
        byId: {
          ...state.byId,
          [review.id]: {
            ...review,
            reply: denormalizeReview(action.payload.reply),
          },
        },
      };
    }
    case SEND_REVIEW_FLAG: {
      const { payload } = action;
      return changeViewState({
        state,
        reviewId: payload.reviewId,
        stateChange: {
          flag: {
            reason: payload.reason,
            inProgress: true,
            wasFlagged: false,
          },
        },
      });
    }
    case SET_REVIEW_WAS_FLAGGED: {
      const { payload } = action;
      return changeViewState({
        state,
        reviewId: payload.reviewId,
        stateChange: {
          flag: {
            reason: payload.reason,
            inProgress: false,
            wasFlagged: true,
          },
        },
      });
    }
    case CLEAR_ADDON_REVIEWS: {
      const { payload } = action;
      const newState = { ...state };
      delete newState.byAddon[payload.addonSlug];
      return newState;
    }
    case SET_ADDON_REVIEWS: {
      const { payload } = action;
      const reviews = payload.reviews.map((review) =>
        denormalizeReview(review),
      );

      return {
        ...state,
        byId: storeReviewObjects({ state, reviews }),
        byAddon: {
          ...state.byAddon,
          [payload.addonSlug]: {
            pageSize: payload.pageSize,
            reviewCount: payload.reviewCount,
            reviews: reviews.map((review) => review.id),
          },
        },
      };
    }
    case SET_USER_REVIEWS: {
      const { payload } = action;
      const reviews = payload.reviews.map((review) =>
        denormalizeReview(review),
      );

      return {
        ...state,
        byId: storeReviewObjects({ state, reviews }),
        byUserId: {
          ...state.byUserId,
          [payload.userId]: {
            pageSize: payload.pageSize,
            reviewCount: payload.reviewCount,
            reviews: reviews.map((review) => review.id),
          },
        },
      };
    }
    default:
      return state;
  }
}
