import { SET_REVIEW } from 'amo/constants';

export const initialState = {};

export default function reviews(state = initialState, { data, type }) {
  switch (type) {
    case SET_REVIEW:
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
