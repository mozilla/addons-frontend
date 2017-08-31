/* @flow */
import { LOG_OUT_USER } from 'core/constants';


const LOAD_USER_PROFILE = 'LOAD_USER_PROFILE';

type Action = Object;
export type UserStateType = {
  id: ?number,
  username: ?string,
};

export const initialState: UserStateType = {
  id: null,
  username: null,
};

export const loadUserProfile = ({ profile }: Object) => {
  if (!profile) {
    throw new Error('The profile parameter is required.');
  }

  return {
    type: LOAD_USER_PROFILE,
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
    case LOAD_USER_PROFILE:
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
