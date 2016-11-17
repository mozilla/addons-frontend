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

export default function reviews(state = initialState, { data, type }) {
  switch (type) {
    case SET_REVIEW: {
      const existingReviews =
        state[data.userId] ? state[data.userId][data.addonId] : {};
      const latestReview = {
        id: data.id,
        rating: data.rating,
        versionId: data.versionId,
        isLatest: data.isLatest,
      };
      return {
        ...state,
        // This is a map of reviews by user ID, addon ID, and review ID.
        [data.userId]: {
          ...state[data.userId],
          [data.addonId]: mergeInNewReview(latestReview, existingReviews),
        },
      };
    }
    default:
      return state;
  }
}
