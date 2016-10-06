import { SET_USER_RATING } from 'amo/constants';

export const initialState = {};

export default function reviews(state = initialState, { data, type }) {
  switch (type) {
    case SET_USER_RATING:
      return {
        ...state,
        // This is a map of reviews by user ID and addon ID.
        [data.userId]: {
          ...state[data.userId],
          [data.addonId]: {
            rating: data.rating,
            versionId: data.versionId,
          },
        },
      };
    default:
      return state;
  }
}
