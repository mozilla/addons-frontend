import { SET_USER_RATING } from 'amo/constants';

export const initialState = {
  userRatings: {},
};

export default function ratings(state = initialState, action) {
  switch (action.type) {
    case SET_USER_RATING:
      const data = action.data;
      return {
        ...state,
        // This maps user ratings by user ID and addon ID.
        userRatings: {
          ...state.userRatings,
          [`userId:${data.userId}-addonId:${data.addonId}`]: {
            rating: data.userRating.rating,
            versionId: data.userRating.version.id,
          },
        },
      };
    default:
      return state;
  }
}
