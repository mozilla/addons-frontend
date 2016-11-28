import { SET_REVIEW } from 'amo/constants';

export const initialState = {};

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
      return {
        ...state,
        // This is a map of reviews by user ID, addon ID, and review ID.
        [payload.userId]: {
          ...state[payload.userId],
          [payload.addonId]: mergeInNewReview(latestReview, existingReviews),
        },
      };
    }
    default:
      return state;
  }
}
