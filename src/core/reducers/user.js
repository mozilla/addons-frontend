import { LOG_OUT_USER } from 'core/constants';


const USER_PROFILE_LOADED = 'USER_PROFILE_LOADED';

export const initialState = {
  id: null,
  username: null,
};

export const userProfileLoaded = ({ profile }) => {
  if (!profile) {
    throw new Error('The profile parameter is required.');
  }

  return {
    type: USER_PROFILE_LOADED,
    payload: { profile },
  };
};

export default function reducer(state = initialState, action = {}) {
  const { payload } = action;

  switch (action.type) {
    case USER_PROFILE_LOADED:
      return {
        ...state,
        id: payload.profile.id,
        username: payload.profile.username,
      };
    case LOG_OUT_USER:
      return initialState;
    default:
      return state;
  }
}
