/* @flow */
import {
  ADDONS_CONTENTREVIEW,
  ADDONS_EDIT,
  ADDONS_POSTREVIEW,
  ADDONS_REVIEW,
  ADDONS_REVIEWUNLISTED,
  ALL_SUPER_POWERS,
  RATINGS_MODERATE,
  THEMES_REVIEW,
} from 'core/constants';


export const LOG_OUT_USER: 'LOG_OUT_USER' = 'LOG_OUT_USER';
export const LOAD_CURRENT_USER_ACCOUNT: 'LOAD_CURRENT_USER_ACCOUNT' = 'LOAD_CURRENT_USER_ACCOUNT';
export const FETCH_USER_ACCOUNT: 'FETCH_USER_ACCOUNT' = 'FETCH_USER_ACCOUNT';
export const LOAD_USER_ACCOUNT: 'LOAD_USER_ACCOUNT' = 'LOAD_USER_ACCOUNT';

export type UserId = number;

// Basic user account object fields, returned by the API.
export type ExternalUserType = {|
  average_addon_rating: number,
  biography: ?string,
  created: string,
  has_anonymous_display_name: boolean,
  has_anonymous_username: boolean,
  homepage: string | null,
  id: number,
  is_addon_developer: boolean,
  is_artist: boolean,
  location: string | null,
  name: string,
  num_addons_listed: number,
  occupation: string | null,
  picture_type: string | null,
  picture_url: string | null,
  username: string,
  // Properties returned if we are accessing our own profile or the current user
  // has the `Users:Edit` permission.
  deleted?: boolean,
  display_name?: string | null,
  email?: string,
  last_login?: string,
  last_login_ip?: string,
  is_verified?: boolean,
  permissions?: Array<string>,
  read_dev_agreement?: boolean,
|};

export type UserType = {|
  ...ExternalUserType,
  // Properties we add to each object.
  displayName: ?string,
|};

export type UsersStateType = {
  currentUserID: UserId | null,
  byID: { [userId: UserId]: UserType },
  byUsername: { [username: string]: UserId },
  userPageBeingViewed: {
    loading: boolean,
    userId: UserId | null,
  },
};

export const initialState: UsersStateType = {
  currentUserID: null,
  byID: {},
  byUsername: {},
  userPageBeingViewed: {
    loading: false,
    userId: null,
  },
};

type FetchUserAccountParams = {|
  errorHandlerId: string,
  username: string,
|};

type FetchUserAccountAction = {|
  type: typeof FETCH_USER_ACCOUNT,
  payload: FetchUserAccountParams,
|};

export const fetchUserAccount = ({
  errorHandlerId,
  username,
}: FetchUserAccountParams): FetchUserAccountAction => {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!username) {
    throw new Error('username is required');
  }

  return {
    type: FETCH_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      username,
    },
  };
};

type LoadCurrentUserAccountParams = {|
  user: ExternalUserType,
|};

type LoadCurrentUserAccountAction = {|
  type: typeof LOAD_CURRENT_USER_ACCOUNT,
  payload: LoadCurrentUserAccountParams,
|};

export const loadCurrentUserAccount = ({
  user,
}: LoadCurrentUserAccountParams): LoadCurrentUserAccountAction => {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: LOAD_CURRENT_USER_ACCOUNT,
    payload: { user },
  };
};

type LoadUserAccountParams = {|
  user: ExternalUserType,
|};

type LoadUserAccountAction = {|
  type: typeof LOAD_USER_ACCOUNT,
  payload: LoadUserAccountParams,
|};

export const loadUserAccount = ({
  user,
}: LoadUserAccountParams): LoadUserAccountAction => {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: LOAD_USER_ACCOUNT,
    payload: { user },
  };
};

export type LogOutUserAction = {|
  type: string,
  payload: Object,
|};

export function logOutUser(): LogOutUserAction {
  return {
    type: LOG_OUT_USER,
    payload: {},
  };
}

export const getCurrentUser = (users: UsersStateType) => {
  if (!users.currentUserID) {
    return null;
  }

  if (!users.byID[users.currentUserID]) {
    throw new Error(
      'currentUserID is defined but no matching user found in users state.');
  }

  return users.byID[users.currentUserID];
};

export const getDisplayName = (user: ExternalUserType) => {
  // We fallback to the username if no display name has been defined by the
  // user.
  return user.display_name && user.display_name.length ?
    user.display_name : user.username;
};

export const hasPermission = (
  state: { users: UsersStateType }, permission: string,
): boolean => {
  const currentUser = getCurrentUser(state.users);

  // If the user isn't authenticated, they have no permissions.
  if (!currentUser) {
    return false;
  }

  const { permissions } = currentUser;
  if (!permissions) {
    return false;
  }

  // Admins have absolutely all permissions.
  if (permissions.includes(ALL_SUPER_POWERS)) {
    return true;
  }

  return permissions.includes(permission);
};

export const hasAnyReviewerRelatedPermission = (
  state: { users: UsersStateType }): boolean => {
  const currentUser = getCurrentUser(state.users);

  // If the user isn't authenticated, they have no permissions.
  if (!currentUser) {
    return false;
  }

  const { permissions } = currentUser;
  if (!permissions) {
    return false;
  }

  // Admins have absolutely all permissions.
  if (permissions.includes(ALL_SUPER_POWERS)) {
    return true;
  }

  return (
    permissions.includes(ADDONS_POSTREVIEW) ||
    permissions.includes(ADDONS_CONTENTREVIEW) ||
    permissions.includes(ADDONS_REVIEW) ||
    permissions.includes(RATINGS_MODERATE) ||
    permissions.includes(THEMES_REVIEW) ||
    permissions.includes(ADDONS_REVIEWUNLISTED) ||
    permissions.includes(ADDONS_EDIT));
};

export const addUserToState = ({ user, state } : {
  user: ExternalUserType,
  state: UsersStateType,
}): Object => {
  const newUser = { ...user };
  newUser.displayName = getDisplayName(user);

  const byID = { ...state.byID, [newUser.id]: newUser };
  const byUsername = { ...state.byUsername, [newUser.username]: newUser.id };

  return { byID, byUsername };
};

type Action =
  | FetchUserAccountAction
  | LoadCurrentUserAccountAction
  | LoadUserAccountAction
  | LogOutUserAction;

const reducer = (
  state: UsersStateType = initialState,
  action: Action
): UsersStateType => {
  switch (action.type) {
    case LOAD_CURRENT_USER_ACCOUNT: {
      const { user } = action.payload;

      return {
        ...state,
        ...addUserToState({ state, user }),
        currentUserID: user.id,
      };
    }

    case LOAD_USER_ACCOUNT: {
      const { user } = action.payload;

      return {
        ...state,
        ...addUserToState({ state, user }),
      };
    }

    case LOG_OUT_USER:
      return {
        ...state,
        currentUserID: null,
      };

    default:
      return state;
  }
};

export default reducer;
