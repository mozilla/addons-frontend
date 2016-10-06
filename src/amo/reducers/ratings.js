import { SET_USER_RATING } from 'amo/constants';

export const initialState = {};

export default function ratings(state = initialState, { data, type }) {
  switch (type) {
    case SET_USER_RATING:
      return {
        ...state,
        // This is a map of ratings by user ID and addon ID.
        [data.userId]: {
          ...state[data.userId],
          [data.addonId]: {
            rating: data.userRating.rating,
            versionId: data.userRating.version.id,
          },
        },
      };
    default:
      return state;
  }
}
