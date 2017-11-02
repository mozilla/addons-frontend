/* @flow */
import { ADMIN_SUPER_POWERS, LOG_OUT_USER } from 'core/constants';


const LOAD_USER_PROFILE = 'LOAD_USER_PROFILE';

type Action = Object;
export type UserStateType = {
  id: ?number,
  username: ?string,
  displayName: ?string,
  permissions: ?Array<string>,
};

export const initialState: UserStateType = {
  id: null,
  username: null,
  displayName: null,
  permissions: null,
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

export const selectDisplayName = (state: { user: UserStateType }) => {
  const displayName = state.user.displayName;
  if (displayName && displayName.length) {
    return displayName;
  }

  // We fallback to the username if no display name has been defined by the
  // user.
  return state.user.username;
};

export const hasPermission = (
  state: { user: UserStateType }, permission: string,
): boolean => {
  const permissions = state.user.permissions;
  if (!permissions) {
    return false;
  }

  // Admins have absolutely all permissions.
  if (permissions.includes(ADMIN_SUPER_POWERS)) {
    return true;
  }

  return permissions.includes(permission);
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
        displayName: payload.profile.display_name,
        permissions: payload.profile.permissions,
      };
    case LOG_OUT_USER:
      return initialState;
    default:
      return state;
  }
}
