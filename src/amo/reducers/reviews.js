/* @flow */
import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';
import type {
  SetAddonReviewsAction, SetReviewAction, UserReviewType,
} from 'amo/actions/reviews';

type ReviewsByAddon = {
  [slug: string]: Array<UserReviewType>,
}

export type ReviewState = {|
  byAddon: ReviewsByAddon,
  // TODO: make this consistent by moving it to state.byUser
  [userId: number]: {
    [addonId: number]: Array<UserReviewType>,
  },
|};

export const initialState = {
  byAddon: {},
};

function mergeInNewReview(
  latestReview: UserReviewType,
  oldReviews: ReviewsByAddon = {},
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
          [payload.addonSlug]: payload.reviews,
        },
      };
    }
    default:
      return state;
  }
}
