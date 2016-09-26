import { SET_USER_RATING } from 'amo/constants';

export const initialState = {
  userRatings: {},
};

export default function ratings(state = initialState, action) {
  switch (action.type) {
    case SET_USER_RATING:
      return {
        ...state,
        // This maps user ratings by addon ID.
        // TODO: this will change once we can track users by ID more easily.
        userRatings: {
          ...state.userRatings,
          [action.data.addonID]: {
            rating: action.data.userRating.rating,
            versionID: action.data.userRating.version.id,
          },
        },
      };
    default:
      return state;
  }
}
