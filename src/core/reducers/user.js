/* @flow */
import { LOG_OUT_USER } from 'core/constants';


const USER_PROFILE_LOADED = 'USER_PROFILE_LOADED';

type Action = Object;
export type UserStateType = {
  id: ?number,
  username: ?string,
};

export const initialState: UserStateType = {
  id: null,
  username: null,
};

export const userProfileLoaded = ({ profile }: Object) => {
  if (!profile) {
    throw new Error('The profile parameter is required.');
  }

  return {
    type: USER_PROFILE_LOADED,
    payload: { profile },
  };
};

export const isAuthenticated = (state: { user: UserStateType }) => {
  return !!state.user.id;
};

export default function reducer(
  state: UserStateType = initialState,
  action: Action = {}
): UserStateType {
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
