/* @flow */
import { oneLine } from 'common-tags';

import {
  DELETE_ADDON_REVIEW,
  FLASH_REVIEW_MESSAGE,
  HIDE_FLASHED_REVIEW_MESSAGE,
  UNLOAD_ADDON_REVIEWS,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SET_ADDON_REVIEWS,
  SET_GROUPED_RATINGS,
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
  createInternalReview,
} from 'amo/actions/reviews';
import type {
  DeleteAddonReviewAction,
  UnloadAddonReviewsAction,
  FlagReviewAction,
  FlashMessageType,
  HideEditReviewFormAction,
  HideFlashedReviewMessageAction,
  HideReplyToReviewFormAction,
  ReviewWasFlaggedAction,
  SendReplyToReviewAction,
  SetAddonReviewsAction,
  SetInternalReviewAction,
  SetLatestReviewAction,
  SetGroupedRatingsAction,
  FlashReviewMessageAction,
  SetReviewAction,
  SetReviewReplyAction,
  SetUserReviewsAction,
  ShowEditReviewFormAction,
  ShowReplyToReviewFormAction,
  UserReviewType,
} from 'amo/actions/reviews';
import type { GroupedRatingsType } from 'amo/api/reviews';
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
  [slug: string]: ?StoredReviewsData,
};

type ReviewsByUserId = {
  [userId: number]: ?StoredReviewsData,
};

export type FlagState = {
  reason: FlagReviewReasonType,
  inProgress: boolean,
  wasFlagged: boolean,
};

type ViewStateByReviewId = {|
  deletingReview: boolean,
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
  groupedRatings: {
    [addonId: number]: ?GroupedRatingsType,
  },
  view: {
    [reviewId: number]: ViewStateByReviewId,
  },
  // Short-lived messages about reviews.
  flashMessage?: FlashMessageType,
|};

export const initialState: ReviewsState = {
  byAddon: {},
  byId: {},
  byUserId: {},
  latestUserReview: {},
  groupedRatings: {},
  // This stores review-related UI state.
  view: {},
  flashMessage: undefined,
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
        deletingReview: false,
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
    groupedRatings: {
      ...state.groupedRatings,
      // When adding a new rating, reset the cache of groupedRatings.
      // This will trigger a refresh from the server.
      [review.addonId]: undefined,
    },
  };
};

type ReviewActionType =
  | DeleteAddonReviewAction
  | FlagReviewAction
  | FlashReviewMessageAction
  | UnloadAddonReviewsAction
  | HideEditReviewFormAction
  | HideFlashedReviewMessageAction
  | HideReplyToReviewFormAction
  | ReviewWasFlaggedAction
  | SendReplyToReviewAction
  | SetAddonReviewsAction
  | SetGroupedRatingsAction
  | SetInternalReviewAction
  | SetLatestReviewAction
  | SetReviewAction
  | SetReviewReplyAction
  | SetUserReviewsAction
  | ShowEditReviewFormAction
  | ShowReplyToReviewFormAction;

export default function reviewsReducer(
  state: ReviewsState = initialState,
  action: ReviewActionType,
  {
    _addReviewToState = addReviewToState,
  }: {| _addReviewToState: typeof addReviewToState |} = {},
) {
  switch (action.type) {
    case DELETE_ADDON_REVIEW:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { deletingReview: true },
      });
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
    case SET_GROUPED_RATINGS: {
      const { payload } = action;
      return {
        ...state,
        groupedRatings: {
          ...state.groupedRatings,
          [payload.addonId]: payload.grouping,
        },
      };
    }
    case FLASH_REVIEW_MESSAGE: {
      const { payload } = action;
      return {
        ...state,
        flashMessage: payload.message,
      };
    }
    case HIDE_FLASHED_REVIEW_MESSAGE: {
      return {
        ...state,
        flashMessage: undefined,
      };
    }
    case UNLOAD_ADDON_REVIEWS: {
      const {
        payload: { reviewId },
      } = action;

      const newState = { ...state };
      const reviewData = state.byId[reviewId];

      if (reviewData) {
        const { addonId, addonSlug, userId } = reviewData;
        delete newState.byId[reviewId];
        delete newState.view[reviewId];
        return {
          ...newState,
          byAddon: {
            ...newState.byAddon,
            [addonSlug]: undefined,
          },
          byId: {
            ...newState.byId,
            [reviewId]: undefined,
          },
          byUserId: {
            ...newState.byUserId,
            [userId]: undefined,
          },
          groupedRatings: {
            ...newState.groupedRatings,
            [addonId]: undefined,
          },
          view: {
            ...newState.view,
            [reviewId]: undefined,
          },
        };
      }
      return newState;
    }
    default:
      return state;
  }
}
