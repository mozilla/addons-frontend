/* @flow */
import { oneLine } from 'common-tags';
import deepcopy from 'deepcopy';
import invariant from 'invariant';
import { LOCATION_CHANGE } from 'connected-react-router';

import {
  BEGIN_DELETE_ADDON_REVIEW,
  CANCEL_DELETE_ADDON_REVIEW,
  DELETE_ADDON_REVIEW,
  FETCH_REVIEW,
  FETCH_REVIEW_PERMISSIONS,
  FETCH_REVIEWS,
  FLASH_REVIEW_MESSAGE,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_FLASHED_REVIEW_MESSAGE,
  HIDE_REPLY_TO_REVIEW_FORM,
  SEND_REPLY_TO_REVIEW,
  SEND_REVIEW_FLAG,
  SET_ADDON_REVIEWS,
  SET_GROUPED_RATINGS,
  SET_INTERNAL_REVIEW,
  SET_LATEST_REVIEW,
  SET_REVIEW,
  SET_REVIEW_PERMISSIONS,
  SET_REVIEW_REPLY,
  SET_REVIEW_WAS_FLAGGED,
  SET_USER_REVIEWS,
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
  UNLOAD_ADDON_REVIEWS,
  UPDATE_RATING_COUNTS,
  createInternalReview,
} from 'amo/actions/reviews';
import { addQueryParams } from 'core/utils/url';
import type {
  BeginDeleteAddonReviewAction,
  CancelDeleteAddonReviewAction,
  DeleteAddonReviewAction,
  FetchReviewAction,
  FetchReviewPermissionsAction,
  FetchReviewsAction,
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
  SetReviewPermissionsAction,
  SetReviewReplyAction,
  SetUserReviewsAction,
  ShowEditReviewFormAction,
  ShowReplyToReviewFormAction,
  UnloadAddonReviewsAction,
  UpdateRatingCountsAction,
  UserReviewType,
} from 'amo/actions/reviews';
import type { GroupedRatingsType } from 'amo/api/reviews';
import type { FlagReviewReasonType } from 'amo/constants';
import type { AppState } from 'amo/store';

export function reviewListURL({
  addonSlug,
  id,
  score,
  src,
}: {|
  addonSlug: string,
  id?: number,
  score?: number | string,
  src?: string,
|}) {
  invariant(addonSlug, 'addonSlug is required');
  const path = `/addon/${addonSlug}/reviews/${id ? `${id}/` : ''}`;

  return addQueryParams(path, { src, score });
}

type ReviewsById = {
  [id: number]: UserReviewType,
};

type StoredReviewsData = {|
  pageSize: string,
  reviewCount: number,
  reviews: Array<number>,
|};

type ReviewsData = {|
  ...StoredReviewsData,
  reviews: Array<UserReviewType>,
|};

type ReviewsByAddon = {
  [slug: string]: {|
    data: StoredReviewsData,
    page: string,
    score: string | null,
  |} | void,
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
  beginningToDeleteReview: boolean,
  deletingReview: boolean,
  editingReview: boolean,
  flag: FlagState,
  loadingReview: boolean,
  replyingToReview: boolean,
  submittingReply: boolean,
|};

export type ReviewsState = {|
  permissions: {
    [addonIdAndUserId: string]: {|
      loading: boolean,
      canReplyToReviews: boolean | null,
    |} | void,
  },
  byAddon: ReviewsByAddon,
  byId: ReviewsById,
  byUserId: ReviewsByUserId,
  latestUserReview: {
    // The latest user review for an add-on
    // or null if one does not exist yet.
    [userIdAddonId: string]: number | null,
  },
  groupedRatings: {
    [addonId: number]: ?GroupedRatingsType,
  },
  view: {
    [reviewId: number]: ViewStateByReviewId,
  },
  // Short-lived messages about reviews.
  flashMessage?: FlashMessageType,
  loadingForSlug: {
    [slug: string]: boolean,
  },
|};

export const initialState: ReviewsState = {
  permissions: {},
  byAddon: {},
  byId: {},
  byUserId: {},
  latestUserReview: {},
  groupedRatings: {},
  // This stores review-related UI state.
  view: {},
  flashMessage: undefined,
  loadingForSlug: {},
};

export function selectReviews({
  reviewsState,
  addonSlug,
  page,
  score,
}: {|
  addonSlug: string,
  page: string,
  reviewsState: ReviewsState,
  score: string | null,
|}): StoredReviewsData | null {
  invariant(addonSlug, 'addonSlug is required');
  invariant(page, 'page is required');
  invariant(reviewsState, 'reviewsState is required');
  invariant(score !== undefined, 'score is required');

  const reviewData = reviewsState.byAddon[addonSlug];
  if (!reviewData || reviewData.score !== score || reviewData.page !== page) {
    return null;
  }
  return reviewData.data;
}

export function createGroupedRatings(
  grouping: $Shape<GroupedRatingsType> = {},
): GroupedRatingsType {
  return {
    /* eslint-disable quote-props */
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    /* eslint-enable quote-props */
    ...grouping,
  };
}

export const selectReview = (
  reviewsState: ReviewsState,
  id: number,
): UserReviewType | void => {
  return reviewsState.byId[id];
};

function makePermissionsKey({
  addonId,
  userId,
}: {|
  addonId: number,
  userId: number,
|}) {
  return `${addonId}-${userId}`;
}

export function selectReviewPermissions({
  reviewsState,
  addonId,
  userId,
}: {|
  reviewsState: ReviewsState,
  addonId: number,
  userId: number,
|}) {
  return reviewsState.permissions[makePermissionsKey({ addonId, userId })];
}

export const expandReviewObjects = ({
  state,
  reviews,
}: {|
  state: ReviewsState,
  reviews: $PropertyType<StoredReviewsData, 'reviews'>,
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
        beginningToDeleteReview: false,
        deletingReview: false,
        editingReview: false,
        loadingReview: false,
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
}: {|
  userId: number,
  addonId: number,
|}) => {
  return `user-${userId}/addon-${addonId}`;
};

export const selectLatestUserReview = ({
  reviewsState,
  userId,
  addonId,
}: {|
  reviewsState: ReviewsState,
  userId: number,
  addonId: number,
|}): UserReviewType | null | void => {
  const key = makeLatestUserReviewKey({ userId, addonId });
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
  const existingReview = selectReview(state, review.id);
  const ratingOrReviewExists = Boolean(existingReview);

  let isReviewUpdate = ratingOrReviewExists;
  if (existingReview && !existingReview.body && review.body) {
    // If this update is actually upgrading a rating into a review then
    // it's not an update.
    isReviewUpdate = false;
  }

  const byUserId = ratingOrReviewExists
    ? state.byUserId
    : {
        ...state.byUserId,
        // For any new rating object, reset the list
        // to trigger a re-fetch from the server.
        [review.userId]: undefined,
      };

  const byAddon = isReviewUpdate
    ? state.byAddon
    : {
        ...state.byAddon,
        // For any newly entered rating object *or* when upgrading a
        // rating to a review, reset the review list to trigger a
        // re-fetch from the server.
        [review.reviewAddon.slug]: undefined,
      };

  return {
    ...state,
    byId: storeReviewObjects({ state, reviews: [review] }),
    byUserId,
    byAddon,
  };
};

export const reviewsAreLoading = (
  state: AppState,
  addonSlug: string,
): boolean => {
  return Boolean(state.reviews.loadingForSlug[addonSlug]);
};

type ReviewActionType =
  | BeginDeleteAddonReviewAction
  | CancelDeleteAddonReviewAction
  | DeleteAddonReviewAction
  | FetchReviewAction
  | FetchReviewPermissionsAction
  | FetchReviewsAction
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
  | SetReviewPermissionsAction
  | SetReviewReplyAction
  | SetUserReviewsAction
  | ShowEditReviewFormAction
  | ShowReplyToReviewFormAction
  | UpdateRatingCountsAction;

export default function reviewsReducer(
  state: ReviewsState = initialState,
  action: ReviewActionType,
  {
    _addReviewToState = addReviewToState,
  }: {| _addReviewToState: typeof addReviewToState |} = {},
) {
  switch (action.type) {
    case BEGIN_DELETE_ADDON_REVIEW:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { beginningToDeleteReview: true },
      });
    case CANCEL_DELETE_ADDON_REVIEW:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { beginningToDeleteReview: false },
      });
    case DELETE_ADDON_REVIEW:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { beginningToDeleteReview: false, deletingReview: true },
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
        stateChange: { beginningToDeleteReview: false, editingReview: true },
      });
    case SHOW_REPLY_TO_REVIEW_FORM:
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { beginningToDeleteReview: false, replyingToReview: true },
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
      const { addonId, userId, review } = payload;
      const key = makeLatestUserReviewKey({ addonId, userId });

      if (review && !selectReview(state, review.id)) {
        throw new Error(
          `Cannot handle SET_LATEST_REVIEW because review ${review.id} has not been set`,
        );
      }

      return {
        ...state,
        latestUserReview: {
          ...state.latestUserReview,
          [key]: review ? review.id : null,
        },
      };
    }
    case FETCH_REVIEW: {
      return changeViewState({
        state,
        reviewId: action.payload.reviewId,
        stateChange: { loadingReview: true },
      });
    }
    case SET_REVIEW: {
      const { payload } = action;
      const review = createInternalReview(payload);

      const newState = _addReviewToState({ state, review });
      return changeViewState({
        state: newState,
        reviewId: review.id,
        stateChange: { loadingReview: false },
      });
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
    case FETCH_REVIEWS: {
      const {
        payload: { addonSlug },
      } = action;
      return {
        ...state,
        loadingForSlug: {
          ...state.loadingForSlug,
          [addonSlug]: true,
        },
      };
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
            data: {
              pageSize: payload.pageSize,
              reviewCount: payload.reviewCount,
              reviews: reviews.map((review) => review.id),
            },
            page: payload.page,
            score: payload.score,
          },
        },
        loadingForSlug: {
          ...state.loadingForSlug,
          [payload.addonSlug]: false,
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
          [payload.addonId]: createGroupedRatings(payload.grouping),
        },
      };
    }
    case UPDATE_RATING_COUNTS: {
      const { addonId, oldReview, newReview } = action.payload;

      const addonRatings =
        state.groupedRatings[addonId] || createGroupedRatings();

      const newAddonRatings = deepcopy(addonRatings);
      if (oldReview && newAddonRatings[oldReview.score] > 0) {
        newAddonRatings[oldReview.score] -= 1;
      }
      if (newReview && newReview.score) {
        newAddonRatings[newReview.score] += 1;
      }

      return {
        ...state,
        groupedRatings: {
          ...state.groupedRatings,
          [addonId]: newAddonRatings,
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

      const newState = {
        ...state,
        view: {
          ...state.view,
          [reviewId]: undefined,
        },
      };

      const reviewData = state.byId[reviewId];
      if (reviewData) {
        const { reviewAddon, userId } = reviewData;
        return {
          ...newState,
          byAddon: {
            ...newState.byAddon,
            [reviewAddon.slug]: undefined,
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
            [reviewAddon.id]: undefined,
          },
          permissions: {
            ...newState.permissions,
            [makePermissionsKey({
              addonId: reviewAddon.id,
              userId,
            })]: undefined,
          },
        };
      }
      return newState;
    }
    case LOCATION_CHANGE: {
      return {
        ...state,
        view: {},
      };
    }
    case FETCH_REVIEW_PERMISSIONS: {
      const { addonId, userId } = action.payload;
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [makePermissionsKey({ addonId, userId })]: {
            loading: true,
            canReplyToReviews: null,
          },
        },
      };
    }
    case SET_REVIEW_PERMISSIONS: {
      const { addonId, userId, canReplyToReviews } = action.payload;
      return {
        ...state,
        permissions: {
          ...state.permissions,
          [makePermissionsKey({ addonId, userId })]: {
            loading: false,
            canReplyToReviews,
          },
        },
      };
    }
    default:
      return state;
  }
}
