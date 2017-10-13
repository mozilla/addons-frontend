/* @flow */
import { oneLine } from 'common-tags';

import {
  SEND_REPLY_TO_REVIEW,
  SHOW_EDIT_REVIEW_FORM,
  SHOW_REPLY_TO_REVIEW_FORM,
  HIDE_EDIT_REVIEW_FORM,
  HIDE_REPLY_TO_REVIEW_FORM,
  SET_ADDON_REVIEWS,
  SET_REVIEW,
  SET_REVIEW_REPLY,
} from 'amo/constants';
import { denormalizeReview } from 'amo/actions/reviews';
import type {
  HideEditReviewFormAction,
  HideReplyToReviewFormAction,
  SendReplyToReviewAction,
  SetAddonReviewsAction,
  SetReviewAction,
  SetReviewReplyAction,
  ShowEditReviewFormAction,
  ShowReplyToReviewFormAction,
  UserReviewType,
} from 'amo/actions/reviews';

type ReviewsById = {
  [id: number]: UserReviewType,
}

type ReviewsByAddon = {
  [slug: string]: {|
    reviewCount: number,
    reviews: Array<number>,
  |},
}

type ViewStateByReviewId = {|
  editingReview: boolean,
  replyingToReview: boolean,
  submittingReply: boolean,
|};

export type ReviewState = {|
  byAddon: ReviewsByAddon,
  byId: ReviewsById,
  view: {
    [reviewId: number]: ViewStateByReviewId,
  },

  // This is what the current data structure looks like:
  // [userId: string]: {
  //   [addonId: string]: {
  //     [reviewId: string]: UserReviewType,
  //   },
  // },
  //
  // TODO: make this consistent by moving it from state[userId] to
  // state.byUser[userId]
  // https://github.com/mozilla/addons-frontend/issues/1791
  //
  // Also note that this needs to move to state.byUser before its type
  // can be expressed in Flow without conflicting with state.byAddon.
  //
|};

export const initialState: ReviewState = {
  byAddon: {},
  byId: {},
  // This stores review-related UI state.
  view: {},
};

type ExpandReviewObjectsParams = {|
  state: ReviewState,
  reviews: Array<number>,
|};

export const expandReviewObjects = (
  { state, reviews }: ExpandReviewObjectsParams
): Array<UserReviewType> => {
  return reviews.map((id) => {
    const review = state.byId[id];
    if (!review) {
      throw new Error(`No stored review exists for ID ${id}`);
    }
    return review;
  });
};

function mergeInNewReview(
  latestReview: UserReviewType,
  oldReviews: { [reviewId: string]: UserReviewType } = {},
): { [id: string]: Array<UserReviewType> } {
  const mergedReviews = {};

  Object.keys(oldReviews).forEach((id) => {
    mergedReviews[id] = oldReviews[id];
    if (latestReview.isLatest) {
      // Reset the 'latest' flag for all old reviews.
      mergedReviews[id].isLatest = false;
    }
  });

  mergedReviews[latestReview.id] = latestReview;
  return mergedReviews;
}

type StoreReviewObjectsParams = {|
  state: ReviewState,
  reviews: Array<UserReviewType>,
|};

export const storeReviewObjects = (
  { state, reviews }: StoreReviewObjectsParams
): ReviewsById => {
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
  state: ReviewState,
  reviewId: number,
  stateChange: $Shape<ViewStateByReviewId>,
|};

export const changeViewState = (
  { state, reviewId, stateChange }: ChangeViewStateParams = {}
): $Shape<ReviewState> => {
  return {
    ...state,
    view: {
      ...state.view,
      [reviewId]: {
        editingReview: false,
        replyingToReview: false,
        submittingReply: false,
        ...state.view[reviewId],
        ...stateChange,
      },
    },
  };
};

type ReviewActionType =
  | HideEditReviewFormAction
  | HideReplyToReviewFormAction
  | SendReplyToReviewAction
  | SetAddonReviewsAction
  | SetReviewAction
  | SetReviewReplyAction
  | ShowEditReviewFormAction
  | ShowReplyToReviewFormAction;

export default function reviewsReducer(
  state: ReviewState = initialState,
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
    case SET_REVIEW: {
      const { payload } = action;
      const existingReviews =
        state[payload.userId] ? state[payload.userId][payload.addonId] : {};
      const latestReview = payload;
      return {
        ...state,
        byId: storeReviewObjects({ state, reviews: [payload] }),
        [payload.userId]: {
          ...state[payload.userId],
          // TODO: this should be a list of review IDs, not objects. It will
          // be complicated because we also need to preserve handling of the
          // isLatest flag.
          // https://github.com/mozilla/addons-frontend/issues/3221
          [payload.addonId]: mergeInNewReview(latestReview, existingReviews),
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
    case SET_ADDON_REVIEWS: {
      const { payload } = action;
      return {
        ...state,
        byId: storeReviewObjects({ state, reviews: payload.reviews }),
        byAddon: {
          ...state.byAddon,
          [payload.addonSlug]: {
            reviewCount: payload.reviewCount,
            reviews: payload.reviews.map((review) => review.id),
          },
        },
      };
    }
    default:
      return state;
  }
}
