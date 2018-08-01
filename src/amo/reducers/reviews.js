/* @flow */
import { oneLine } from 'common-tags';

import {
  CLEAR_ADDON_REVIEWS,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SET_ADDON_REVIEWS,
  SET_INTERNAL_REVIEW,
  SET_LATEST_REVIEW,
  SET_REVIEW,
  SET_REVIEW_REPLY,
  SET_REVIEW_WAS_FLAGGED,
  SET_USER_REVIEWS,
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_REPLY_TO_REVIEW_FORM,
} from 'amo/constants';
import { createInternalReview } from 'amo/actions/reviews';
import type {
  ClearAddonReviewsAction,
  FlagReviewAction,
  HideEditReviewFormAction,
  HideReplyToReviewFormAction,
  ReviewWasFlaggedAction,
  SendReplyToReviewAction,
  SetAddonReviewsAction,
  SetInternalReviewAction,
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
  latestUserReview: {
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
  latestUserReview: {},
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

export const makeLatestUserReviewKey = ({
  userId,
  addonId,
  versionId,
}: {|
  userId: number,
  addonId: number,
  versionId: number,
|}) => {
  return `user-${userId}/addon-${addonId}/version-${versionId}`;
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
  const key = makeLatestUserReviewKey({ userId, addonId, versionId });
  const userReviewId = reviewsState.latestUserReview[key];

  if (userReviewId === null) {
    // This means we had previously attempted to fetch the latest
    // user review but it does not exist.
    return null;
  }

  // This either means we have not yet fetched a user review
  // (return undefined) or we fetched and retrieved a user review
  // (return the object).
  return selectReview(reviewsState, userReviewId);
};

export const addReviewToState = ({
  state,
  review,
}: {|
  state: ReviewsState,
  review: UserReviewType,
|}) => {
  return {
    ...state,
    byId: storeReviewObjects({ state, reviews: [review] }),
    byUserId: {
      ...state.byUserId,
      // This will trigger a refresh from the server.
      [review.userId]: undefined,
    },
  };
};

type ReviewActionType =
  | ClearAddonReviewsAction
  | HideEditReviewFormAction
  | HideReplyToReviewFormAction
  | SendReplyToReviewAction
  | SetAddonReviewsAction
  | SetInternalReviewAction
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
  {
    _addReviewToState = addReviewToState,
  }: {| _addReviewToState: typeof addReviewToState |} = {},
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
      const { addonId, addonSlug, userId, review, versionId } = payload;
      const key = makeLatestUserReviewKey({ addonId, userId, versionId });

      let { byId } = state;
      if (review) {
        byId = storeReviewObjects({
          state,
          reviews: [createInternalReview(review)],
        });
      }

      return {
        ...state,
        byId,
        byAddon: {
          ...state.byAddon,
          // Reset all add-on reviews to trigger a refresh from the server.
          [addonSlug]: undefined,
        },
        byUserId: {
          ...state.byUserId,
          // Reset all user reviews to trigger a refresh from the server.
          [userId]: undefined,
        },
        latestUserReview: {
          ...state.latestUserReview,
          [key]: review ? review.id : null,
        },
      };
    }
    case SET_REVIEW: {
      const { payload } = action;
      const review = createInternalReview(payload);

      return _addReviewToState({ state, review });
    }
    case SET_INTERNAL_REVIEW: {
      const { payload } = action;

      return _addReviewToState({ state, review: payload });
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
            reply: createInternalReview(action.payload.reply),
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
        createInternalReview(review),
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
        createInternalReview(review),
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
