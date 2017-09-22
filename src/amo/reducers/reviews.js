/* @flow */
import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';
import type { UserReviewType } from 'amo/actions/reviews';

type ReviewsById = {
  [id: number]: UserReviewType,
}

type ReviewsByAddon = {
  [slug: string]: {|
    reviewCount: number,
    reviews: Array<number>,
  |},
}

export type ReviewState = {|
  byAddon: ReviewsByAddon,
  byId: ReviewsById,

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

export default function reviewsReducer(
  state: ReviewState = initialState,
  { payload, type }: {| payload: any, type: string |},
) {
  switch (type) {
    case SET_REVIEW: {
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
    case SET_ADDON_REVIEWS: {
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
