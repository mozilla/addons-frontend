import { SET_ADDON_REVIEWS, SET_REVIEW } from 'amo/constants';

export const initialState = {
  byAddon: {},
};

function mergeInNewReview(latestReview, oldReviews = {}) {
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

export default function reviews(state = initialState, { payload, type }) {
  switch (type) {
    case SET_REVIEW: {
      const existingReviews =
        state[payload.userId] ? state[payload.userId][payload.addonId] : {};
      const latestReview = payload;
      // TODO: make this consistent by moving it to state.byUser
      return {
        ...state,
        // This is a map of reviews by user ID, addon ID, and review ID.
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
