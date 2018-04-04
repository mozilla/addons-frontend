/* @flow */
import invariant from 'invariant';

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


export const CANCEL_EDIT_USER_ACCOUNT: 'CANCEL_EDIT_USER_ACCOUNT' = 'CANCEL_EDIT_USER_ACCOUNT';
export const EDIT_USER_ACCOUNT: 'EDIT_USER_ACCOUNT' = 'EDIT_USER_ACCOUNT';
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
  isEditingById: { [userId: UserId]: boolean },
  userPageBeingViewed: {
    loading: boolean,
    userId: UserId | null,
  },
};

export type UserEditableFieldsType = {|
  biography?: string | null,
  displayName?: string | null,
  homepage?: string | null,
  location?: string | null,
  occupation?: string | null,
  username?: string | null,
|};

export const initialState: UsersStateType = {
  currentUserID: null,
  byID: {},
  byUsername: {},
  isEditingById: {},
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
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(username, 'username is required');

  return {
    type: FETCH_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      username,
    },
  };
};

type CancelEditUserAccountParams = {|
  userId: UserId,
|};

type CancelEditUserAccountAction = {|
  type: typeof CANCEL_EDIT_USER_ACCOUNT,
  payload: CancelEditUserAccountParams,
|};

export const cancelEditUserAccount = (
  { userId }: CancelEditUserAccountParams
): CancelEditUserAccountAction => {
  invariant(userId, 'userId is required');

  return {
    type: CANCEL_EDIT_USER_ACCOUNT,
    payload: { userId },
  };
};

type EditUserAccountParams = {|
  errorHandlerId: string,
  userFields: UserEditableFieldsType,
  userId: UserId,
|};

type EditUserAccountAction = {|
  type: typeof EDIT_USER_ACCOUNT,
  payload: EditUserAccountParams,
|};

export const editUserAccount = ({
  errorHandlerId, userFields, userId,
}: EditUserAccountParams): EditUserAccountAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userFields, 'userFields are required');
  invariant(userId, 'userId is required');

  return {
    type: EDIT_USER_ACCOUNT,
    payload: { errorHandlerId, userFields, userId },
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
  invariant(user, 'user is required');

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
  invariant(user, 'user is required');

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

  invariant(users.byID[users.currentUserID],
    'currentUserID is defined but no matching user found in users state.');

  return users.byID[users.currentUserID];
};

export const getUserById = (users: UsersStateType, userId: number) => {
  invariant(userId, 'userId is required');
  return users.byID[userId];
};

export const getUserByUsername = (users: UsersStateType, username: string) => {
  invariant(username, 'username is required');
  return users.byID[users.byUsername[username]];
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

export const addUserToState = ({ state, user } : {
  user: ExternalUserType,
  state: UsersStateType,
}): Object => {
  const newUser = { ...user };
  newUser.displayName = getDisplayName(user);

  const byID = { ...state.byID, [newUser.id]: newUser };
  const byUsername = { ...state.byUsername, [newUser.username]: newUser.id };

  return { byID, byUsername };
};

export const setUserAsEditing = ({ state, userId } : {
  state: UsersStateType,
  userId: UserId,
}) : Object => {
  invariant(state, 'state is required');
  invariant(userId, 'userId is required');

  return { isEditingById: { ...state.isEditingById, [userId]: true } };
};

export const setUserAsNotEditing = ({ state, userId } : {
  state: UsersStateType,
  userId: UserId,
}) : Object => {
  invariant(state, 'state is required');
  invariant(userId, 'userId is required');

  return { isEditingById: { ...state.isEditingById, [userId]: false } };
};

type Action =
  | FetchUserAccountAction
  | EditUserAccountAction
  | LoadCurrentUserAccountAction
  | LoadUserAccountAction
  | LogOutUserAction;

const reducer = (
  state: UsersStateType = initialState,
  action: Action
): UsersStateType => {
  switch (action.type) {
    case CANCEL_EDIT_USER_ACCOUNT: {
      const { userId } = action.payload;

      return {
        ...state,
        ...setUserAsNotEditing({ state, userId }),
      };
    }

    case EDIT_USER_ACCOUNT: {
      const { userId } = action.payload;

      return {
        ...state,
        ...setUserAsEditing({ state, userId }),
      };
    }

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
        ...setUserAsNotEditing({ state, userId: user.id }),
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
