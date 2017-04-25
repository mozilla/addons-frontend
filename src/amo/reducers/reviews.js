/* @flow */
import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';
import type {
  SetAddonReviewsAction, SetReviewAction, UserReviewType,
} from 'amo/actions/reviews';

type ReviewsByAddon = {
  [slug: string]: {|
    reviewCount: number,
    reviews: Array<UserReviewType>,
  |},
}

export type ReviewState = {|
  byAddon: ReviewsByAddon,

  // This is what the current data structure looks like:
  // [userId: string]: {
  //   [addonId: string]: {
  //     [reviewId: string]: UserReviewType,
  //   },
  // },
  //
  // TODO: make this consistent by moving it from state[userId] to
  // state.byUser[userId]
  //
  // Also note that this needs to move to state.byUser before its type
  // can be expressed in Flow without conflicting with state.byAddon.
  //
|};

export const initialState = {
  byAddon: {},
};

function mergeInNewReview(
  latestReview: UserReviewType,
  oldReviews: { [reviewId: string]: UserReviewType } = {},
): { [id: string | number]: Array<UserReviewType> } {
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


export default function reviews(
  state: ReviewState = initialState,
  { payload, type }: { payload: any, type: string },
) {
  switch (type) {
    case SET_REVIEW: {
      const existingReviews =
        state[payload.userId] ? state[payload.userId][payload.addonId] : {};
      const latestReview = payload;
      return {
        ...state,
        [payload.userId]: {
          ...state[payload.userId],
          [payload.addonId]: mergeInNewReview(latestReview, existingReviews),
        },
      };
    }
    case SET_ADDON_REVIEWS: {
      return {
        ...state,
        byAddon: {
          ...state.byAddon,
          [payload.addonSlug]: {
            reviewCount: payload.reviewCount,
            reviews: payload.reviews,
          },
        },
      };
    }
    default:
      return state;
  }
}
