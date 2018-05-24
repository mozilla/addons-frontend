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


export const FINISH_EDIT_USER_ACCOUNT: 'FINISH_EDIT_USER_ACCOUNT' = 'FINISH_EDIT_USER_ACCOUNT';
export const EDIT_USER_ACCOUNT: 'EDIT_USER_ACCOUNT' = 'EDIT_USER_ACCOUNT';
export const LOG_OUT_USER: 'LOG_OUT_USER' = 'LOG_OUT_USER';
export const LOAD_CURRENT_USER_ACCOUNT: 'LOAD_CURRENT_USER_ACCOUNT' = 'LOAD_CURRENT_USER_ACCOUNT';
export const FETCH_USER_ACCOUNT: 'FETCH_USER_ACCOUNT' = 'FETCH_USER_ACCOUNT';
export const LOAD_USER_ACCOUNT: 'LOAD_USER_ACCOUNT' = 'LOAD_USER_ACCOUNT';
export const DELETE_USER_PICTURE: 'DELETE_USER_PICTURE' = 'DELETE_USER_PICTURE';

export type UserId = number;

// Basic user account object fields, returned by the API.
export type ExternalUserType = {|
  average_addon_rating: number,
  biography: string | null,
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
  display_name: string | null,
  email?: string,
  last_login?: string,
  last_login_ip?: string,
  is_verified?: boolean,
  permissions?: Array<string>,
  read_dev_agreement?: boolean,
|};

export type UserType = {|
  ...ExternalUserType,
|};

export type UsersStateType = {
  currentUserID: UserId | null,
  byID: { [userId: UserId]: UserType },
  byUsername: { [username: string]: UserId },
  isUpdating: boolean,
  userPageBeingViewed: {
    loading: boolean,
    userId: UserId | null,
  },
};

export type UserEditableFieldsType = {|
  biography?: string | null,
  display_name?: string | null,
  homepage?: string | null,
  location?: string | null,
  occupation?: string | null,
  username?: string | null,
|};

export const initialState: UsersStateType = {
  currentUserID: null,
  byID: {},
  byUsername: {},
  isUpdating: false,
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

type FinishEditUserAccountParams = {};

type FinishEditUserAccountAction = {|
  type: typeof FINISH_EDIT_USER_ACCOUNT,
  payload: FinishEditUserAccountParams,
|};

export const finishEditUserAccount = (): FinishEditUserAccountAction => {
  return {
    type: FINISH_EDIT_USER_ACCOUNT,
    payload: {},
  };
};

type EditUserAccountParams = {|
  errorHandlerId: string,
  picture?: File | null,
  userFields: UserEditableFieldsType,
  userId: UserId,
|};

type EditUserAccountAction = {|
  type: typeof EDIT_USER_ACCOUNT,
  payload: EditUserAccountParams,
|};

export const editUserAccount = ({
  errorHandlerId, picture, userFields, userId,
}: EditUserAccountParams): EditUserAccountAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userFields, 'userFields are required');
  invariant(userId, 'userId is required');

  return {
    type: EDIT_USER_ACCOUNT,
    payload: { errorHandlerId, picture, userFields, userId },
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

export type DeleteUserPictureParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

type DeleteUserPictureAction = {|
  type: typeof DELETE_USER_PICTURE,
  payload: DeleteUserPictureParams,
|};

export const deleteUserPicture = (
  { errorHandlerId, userId }: DeleteUserPictureParams
): DeleteUserPictureAction => {
  return {
    type: DELETE_USER_PICTURE,
    payload: {
      errorHandlerId,
      userId,
    },
  };
};

export const getUserById = (users: UsersStateType, userId: number) => {
  invariant(userId, 'userId is required');
  return users.byID[userId];
};

export const getUserByUsername = (users: UsersStateType, username: string) => {
  invariant(username, 'username is required');
  return users.byID[users.byUsername[username]];
};

export const getCurrentUser = (users: UsersStateType) => {
  if (!users.currentUserID) {
    return null;
  }

  const currentUser = getUserById(users, users.currentUserID);

  invariant(currentUser,
    'currentUserID is defined but no matching user found in users state.');

  return currentUser;
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
  const byID = { ...state.byID, [user.id]: user };
  const byUsername = { ...state.byUsername, [user.username]: user.id };

  return { byID, byUsername };
};

type Action =
  | FetchUserAccountAction
  | FinishEditUserAccountAction
  | EditUserAccountAction
  | LoadCurrentUserAccountAction
  | LoadUserAccountAction
  | LogOutUserAction;

const reducer = (
  state: UsersStateType = initialState,
  action: Action
): UsersStateType => {
  switch (action.type) {
    case EDIT_USER_ACCOUNT:
      return {
        ...state,
        isUpdating: true,
      };
    case FINISH_EDIT_USER_ACCOUNT:
      return {
        ...state,
        isUpdating: false,
      };
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
