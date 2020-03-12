/* @flow */
import invariant from 'invariant';

import {
  ADDONS_CONTENT_REVIEW,
  ADDONS_EDIT,
  ADDONS_POST_REVIEW,
  ADDONS_RECOMMENDED_REVIEW,
  ADDONS_REVIEW,
  ADDONS_REVIEW_UNLISTED,
  ALL_SUPER_POWERS,
  RATINGS_MODERATE,
  REVIEWER_TOOLS_VIEW,
  STATIC_THEMES_REVIEW,
  THEMES_REVIEW,
} from 'core/constants';
import type { AppState } from 'amo/store';
import type { ExternalSiteStatus } from 'core/reducers/site';

export const FINISH_UPDATE_USER_ACCOUNT: 'FINISH_UPDATE_USER_ACCOUNT' =
  'FINISH_UPDATE_USER_ACCOUNT';
export const UPDATE_USER_ACCOUNT: 'UPDATE_USER_ACCOUNT' = 'UPDATE_USER_ACCOUNT';
export const LOG_OUT_USER: 'LOG_OUT_USER' = 'LOG_OUT_USER';
export const LOAD_CURRENT_USER_ACCOUNT: 'LOAD_CURRENT_USER_ACCOUNT' =
  'LOAD_CURRENT_USER_ACCOUNT';
export const FETCH_USER_ACCOUNT: 'FETCH_USER_ACCOUNT' = 'FETCH_USER_ACCOUNT';
export const LOAD_USER_ACCOUNT: 'LOAD_USER_ACCOUNT' = 'LOAD_USER_ACCOUNT';
export const DELETE_USER_PICTURE: 'DELETE_USER_PICTURE' = 'DELETE_USER_PICTURE';
export const FETCH_USER_NOTIFICATIONS: 'FETCH_USER_NOTIFICATIONS' =
  'FETCH_USER_NOTIFICATIONS';
export const LOAD_USER_NOTIFICATIONS: 'LOAD_USER_NOTIFICATIONS' =
  'LOAD_USER_NOTIFICATIONS';
export const DELETE_USER_ACCOUNT: 'DELETE_USER_ACCOUNT' = 'DELETE_USER_ACCOUNT';
export const UNLOAD_USER_ACCOUNT: 'UNLOAD_USER_ACCOUNT' = 'UNLOAD_USER_ACCOUNT';
export const UNSUBSCRIBE_NOTIFICATION: 'UNSUBSCRIBE_NOTIFICATION' =
  'UNSUBSCRIBE_NOTIFICATION';
export const ABORT_UNSUBSCRIBE_NOTIFICATION: 'ABORT_UNSUBSCRIBE_NOTIFICATION' =
  'ABORT_UNSUBSCRIBE_NOTIFICATION';
export const FINISH_UNSUBSCRIBE_NOTIFICATION: 'FINISH_UNSUBSCRIBE_NOTIFICATION' =
  'FINISH_UNSUBSCRIBE_NOTIFICATION';

export type UserId = number;

export type NotificationType = {|
  enabled: boolean,
  mandatory: boolean,
  name: string,
|};

export type NotificationsType = Array<NotificationType>;

export type NotificationsUpdateType = { [name: string]: boolean };

export type BaseExternalUserType = {|
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
  // Properties returned if we are accessing our own profile or the current
  // user has the `Users:Edit` permission.
  deleted?: boolean,
  display_name: string | null,
  email?: string,
  fxa_edit_email_url?: string,
  is_verified?: boolean,
  last_login?: string,
  last_login_ip?: string,
  permissions?: Array<string>,
  read_dev_agreement?: boolean,
  // This field is only returned for reviewers.
  reviewer_name?: string | null,
|};

// Basic user account object fields, returned by the API. You can update
// `BaseExternalUserType` to add attributes that you want to store in the Redux
// state. The attributes added below are part of the Users API response but we
// do not want to store them in the`UsersState`.
export type ExternalUserType = {|
  ...BaseExternalUserType,
  site_status: ExternalSiteStatus,
|};

export type UserType = {|
  ...BaseExternalUserType,
  notifications: NotificationsType | null,
|};

export type UsersState = {
  currentUserID: UserId | null,
  byID: { [userId: UserId]: UserType },
  byUsername: { [username: string]: UserId },
  isUpdating: boolean,
  userPageBeingViewed: {
    loading: boolean,
    userId: UserId | null,
  },
  isUnsubscribedFor: {
    // `undefined`: no API call has been made yet
    // `null`: an error has occurred
    // `false`: unsubscribing in progress
    // `true`: user is unsubscribed
    [key: string]: boolean | null,
  },
};

export type UserEditableFieldsType = {|
  biography?: string | null,
  display_name?: string | null,
  homepage?: string | null,
  location?: string | null,
  occupation?: string | null,
  reviewer_name?: string | null, // only for reviewers.
  username?: string | null,
|};

export const initialState: UsersState = {
  currentUserID: null,
  byID: {},
  byUsername: {},
  isUpdating: false,
  userPageBeingViewed: {
    loading: false,
    userId: null,
  },
  isUnsubscribedFor: {},
};

type FetchUserAccountParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

export type FetchUserAccountAction = {|
  type: typeof FETCH_USER_ACCOUNT,
  payload: FetchUserAccountParams,
|};

export const fetchUserAccount = ({
  errorHandlerId,
  userId,
}: FetchUserAccountParams): FetchUserAccountAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      userId,
    },
  };
};

type finishUpdateUserAccountParams = {};

type FinishUpdateUserAccountAction = {|
  type: typeof FINISH_UPDATE_USER_ACCOUNT,
  payload: finishUpdateUserAccountParams,
|};

export const finishUpdateUserAccount = (): FinishUpdateUserAccountAction => {
  return {
    type: FINISH_UPDATE_USER_ACCOUNT,
    payload: {},
  };
};

type UpdateUserAccountParams = {|
  errorHandlerId: string,
  notifications: NotificationsUpdateType,
  picture: File | null,
  pictureData: string | null,
  userFields: UserEditableFieldsType,
  userId: UserId,
|};

export type UpdateUserAccountAction = {|
  type: typeof UPDATE_USER_ACCOUNT,
  payload: UpdateUserAccountParams,
|};

export const updateUserAccount = ({
  errorHandlerId,
  notifications,
  picture,
  pictureData,
  userFields,
  userId,
}: UpdateUserAccountParams): UpdateUserAccountAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(notifications, 'notifications are required');
  invariant(userFields, 'userFields are required');
  invariant(userId, 'userId is required');

  invariant(picture !== undefined, 'picture is required');

  if (picture) {
    invariant(pictureData, 'pictureData is required when picture is present');
  }

  return {
    type: UPDATE_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      notifications,
      picture,
      pictureData,
      userFields,
      userId,
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

export type DeleteUserAccountParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

export type DeleteUserAccountAction = {|
  type: typeof DELETE_USER_ACCOUNT,
  payload: DeleteUserAccountParams,
|};

export const deleteUserAccount = ({
  errorHandlerId,
  userId,
}: DeleteUserAccountParams): DeleteUserAccountAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: DELETE_USER_ACCOUNT,
    payload: {
      errorHandlerId,
      userId,
    },
  };
};

type UnloadUserAccountParams = {|
  userId: UserId,
|};

type UnloadUserAccountAction = {|
  type: typeof UNLOAD_USER_ACCOUNT,
  payload: UnloadUserAccountParams,
|};

export const unloadUserAccount = ({
  userId,
}: UnloadUserAccountParams): UnloadUserAccountAction => {
  invariant(userId, 'userId is required');

  return {
    type: UNLOAD_USER_ACCOUNT,
    payload: { userId },
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

export type DeleteUserPictureAction = {|
  type: typeof DELETE_USER_PICTURE,
  payload: DeleteUserPictureParams,
|};

export const deleteUserPicture = ({
  errorHandlerId,
  userId,
}: DeleteUserPictureParams): DeleteUserPictureAction => {
  return {
    type: DELETE_USER_PICTURE,
    payload: {
      errorHandlerId,
      userId,
    },
  };
};

type FetchUserNotificationsParams = {|
  errorHandlerId: string,
  userId: UserId,
|};

export type FetchUserNotificationsAction = {|
  type: typeof FETCH_USER_NOTIFICATIONS,
  payload: FetchUserNotificationsParams,
|};

export const fetchUserNotifications = ({
  errorHandlerId,
  userId,
}: FetchUserNotificationsParams): FetchUserNotificationsAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(userId, 'userId is required');

  return {
    type: FETCH_USER_NOTIFICATIONS,
    payload: { errorHandlerId, userId },
  };
};

type LoadUserNotificationsParams = {|
  notifications: NotificationsType,
  userId: UserId,
|};

type LoadUserNotificationsAction = {|
  type: typeof LOAD_USER_NOTIFICATIONS,
  payload: LoadUserNotificationsParams,
|};

export const loadUserNotifications = ({
  notifications,
  userId,
}: LoadUserNotificationsParams): LoadUserNotificationsAction => {
  invariant(notifications, 'notifications is required');
  invariant(userId, 'userId is required');

  return {
    type: LOAD_USER_NOTIFICATIONS,
    payload: { notifications, userId },
  };
};

type UnsubscribeNotificationParams = {|
  errorHandlerId: string,
  hash: string,
  notification: string,
  token: string,
|};

export type UnsubscribeNotificationAction = {|
  type: typeof UNSUBSCRIBE_NOTIFICATION,
  payload: UnsubscribeNotificationParams,
|};

export const unsubscribeNotification = ({
  errorHandlerId,
  hash,
  notification,
  token,
}: UnsubscribeNotificationParams): UnsubscribeNotificationAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(hash, 'hash is required');
  invariant(notification, 'notification is required');
  invariant(token, 'token is required');

  return {
    type: UNSUBSCRIBE_NOTIFICATION,
    payload: { errorHandlerId, hash, notification, token },
  };
};

export const getUserById = (users: UsersState, userId: UserId) => {
  invariant(typeof userId === 'number', 'userId is required');
  return users.byID[userId];
};

export const getUserByUsername = (users: UsersState, username: string) => {
  invariant(username, 'username is required');
  return users.byID[users.byUsername[username.toLowerCase()]];
};

export const getCurrentUser = (users: UsersState) => {
  if (!users.currentUserID) {
    return null;
  }

  const currentUser = getUserById(users, users.currentUserID);

  invariant(
    currentUser,
    'currentUserID is defined but no matching user found in users state.',
  );

  return currentUser;
};

export const isDeveloper = (user: UserType | null): boolean => {
  if (!user) {
    return false;
  }

  return user.is_addon_developer || user.is_artist;
};

export const hasPermission = (state: AppState, permission: string): boolean => {
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

  // Match exact permissions.
  if (permissions.includes(permission)) {
    return true;
  }

  // See: https://github.com/mozilla/addons-frontend/issues/8575
  const appsWithAllPermissions = permissions
    // Only consider permissions with wildcards.
    .filter((perm) => perm.endsWith(':*'))
    // Return the permission "app".
    // See: https://github.com/mozilla/addons-server/blob/3a15aafb703349923ee2eb9a9f7b527ba9b16c03/src/olympia/constants/permissions.py#L4
    .map((perm) => perm.replace(':*', ''));

  const app = permission.split(':')[0];

  return appsWithAllPermissions.includes(app);
};

export const hasAnyReviewerRelatedPermission = (state: AppState): boolean => {
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
    permissions.includes(ADDONS_CONTENT_REVIEW) ||
    permissions.includes(ADDONS_EDIT) ||
    permissions.includes(ADDONS_POST_REVIEW) ||
    permissions.includes(ADDONS_RECOMMENDED_REVIEW) ||
    permissions.includes(ADDONS_REVIEW) ||
    permissions.includes(ADDONS_REVIEW_UNLISTED) ||
    permissions.includes(RATINGS_MODERATE) ||
    permissions.includes(REVIEWER_TOOLS_VIEW) ||
    permissions.includes(STATIC_THEMES_REVIEW) ||
    permissions.includes(THEMES_REVIEW)
  );
};

export const addUserToState = ({
  state,
  user,
}: {
  user: ExternalUserType,
  state: UsersState,
}): {|
  byID: { [userId: UserId]: UserType },
  byUsername: { [username: string]: UserId },
|} => {
  invariant(user, 'user is required');

  const existingUser = getUserById(state, user.id) || {
    notifications: null,
  };

  const byID = {
    ...state.byID,
    [user.id]: {
      ...existingUser,
      ...user,
    },
  };
  const byUsername = {
    ...state.byUsername,
    [user.username.toLowerCase()]: user.id,
  };

  return { byID, byUsername };
};

type FinishUnsubscribeNotificationParams = {|
  hash: string,
  notification: string,
  token: string,
|};

export type FinishUnsubscribeNotificationAction = {|
  type: typeof FINISH_UNSUBSCRIBE_NOTIFICATION,
  payload: FinishUnsubscribeNotificationParams,
|};

export const finishUnsubscribeNotification = ({
  hash,
  notification,
  token,
}: FinishUnsubscribeNotificationParams): FinishUnsubscribeNotificationAction => {
  invariant(hash, 'hash is required');
  invariant(notification, 'notification is required');
  invariant(token, 'token is required');

  return {
    type: FINISH_UNSUBSCRIBE_NOTIFICATION,
    payload: { hash, notification, token },
  };
};

type AbortUnsubscribeNotificationParams = {|
  hash: string,
  notification: string,
  token: string,
|};

export type AbortUnsubscribeNotificationAction = {|
  type: typeof ABORT_UNSUBSCRIBE_NOTIFICATION,
  payload: AbortUnsubscribeNotificationParams,
|};

export const abortUnsubscribeNotification = ({
  hash,
  notification,
  token,
}: AbortUnsubscribeNotificationParams): AbortUnsubscribeNotificationAction => {
  invariant(hash, 'hash is required');
  invariant(notification, 'notification is required');
  invariant(token, 'token is required');

  return {
    type: ABORT_UNSUBSCRIBE_NOTIFICATION,
    payload: { hash, notification, token },
  };
};

type GetUnsubscribeKeyParams = {|
  hash: string,
  notification: string,
  token: string,
|};

export const getUnsubscribeKey = ({
  hash,
  notification,
  token,
}: GetUnsubscribeKeyParams) => {
  invariant(hash, 'hash is required');
  invariant(notification, 'notification is required');
  invariant(token, 'token is required');

  return `${hash}-${notification}-${token}`;
};

export const isUnsubscribedFor = (
  usersState: UsersState,
  hash: string,
  notification: string,
  token: string,
) => {
  return usersState.isUnsubscribedFor[
    getUnsubscribeKey({ hash, notification, token })
  ];
};

type Action =
  | AbortUnsubscribeNotificationAction
  | FetchUserAccountAction
  | FetchUserNotificationsAction
  | FinishUnsubscribeNotificationAction
  | FinishUpdateUserAccountAction
  | LoadCurrentUserAccountAction
  | LoadUserAccountAction
  | LoadUserNotificationsAction
  | LogOutUserAction
  | UnsubscribeNotificationAction
  | UpdateUserAccountAction;

const reducer = (
  state: UsersState = initialState,
  action: Action,
): UsersState => {
  switch (action.type) {
    case UPDATE_USER_ACCOUNT:
      return {
        ...state,
        isUpdating: true,
      };
    case FINISH_UPDATE_USER_ACCOUNT:
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
    case LOAD_USER_NOTIFICATIONS: {
      const { notifications, userId } = action.payload;

      const user = getUserById(state, userId);

      invariant(user, 'user is required');
      invariant(notifications, 'notifications are required');

      return {
        ...state,
        byID: {
          ...state.byID,
          [user.id]: {
            ...user,
            notifications,
          },
        },
      };
    }
    case LOG_OUT_USER:
      return {
        ...state,
        currentUserID: null,
      };
    case UNLOAD_USER_ACCOUNT: {
      const { userId } = action.payload;

      if (state.byID[userId]) {
        const { username } = state.byID[userId];

        return {
          ...state,
          currentUserID:
            state.currentUserID === userId ? null : state.currentUserID,
          byID: {
            ...state.byID,
            [userId]: undefined,
          },
          byUsername: {
            ...state.byUsername,
            [username]: undefined,
          },
        };
      }

      return state;
    }
    case UNSUBSCRIBE_NOTIFICATION: {
      const { hash, notification, token } = action.payload;

      return {
        ...state,
        isUnsubscribedFor: {
          ...state.isUnsubscribedFor,
          [getUnsubscribeKey({ hash, notification, token })]: false,
        },
      };
    }
    case ABORT_UNSUBSCRIBE_NOTIFICATION: {
      const { hash, notification, token } = action.payload;

      return {
        ...state,
        isUnsubscribedFor: {
          ...state.isUnsubscribedFor,
          [getUnsubscribeKey({ hash, notification, token })]: null,
        },
      };
    }
    case FINISH_UNSUBSCRIBE_NOTIFICATION: {
      const { hash, notification, token } = action.payload;

      return {
        ...state,
        isUnsubscribedFor: {
          ...state.isUnsubscribedFor,
          [getUnsubscribeKey({ hash, notification, token })]: true,
        },
      };
    }
    default:
      return state;
  }
};

export default reducer;
