import { SET_REVIEW } from 'amo/constants';

export const initialState = {};

export default function reviews(state = initialState, { data, type }) {
  let existingAddonReviews;
  switch (type) {
    case SET_REVIEW:
      existingAddonReviews = state[data.userId] ? state[data.userId][data.addonId] : {};
      return {
        ...state,
        // This is a map of reviews by user ID, addon ID, and review ID.
        [data.userId]: {
          ...state[data.userId],
          [data.addonId]: {
            ...existingAddonReviews,
            [data.id]: {
              id: data.id,
              rating: data.rating,
              versionId: data.versionId,
              isLatest: data.isLatest,
            },
          },
        },
      };
    default:
      return state;
  }
}
