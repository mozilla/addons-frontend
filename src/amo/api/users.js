/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type {
  ExternalUserType,
  NotificationsType,
  NotificationsUpdateType,
  UserEditableFieldsType,
  UserId,
} from 'amo/reducers/users';
import type { ApiState } from 'core/reducers/api';

export type UserApiParams = {|
  api: ApiState,
  userId: UserId,
|};

export type UserApiParamsWithUsername = {|
  api: ApiState,
  username: string,
|};

export type CurrentUserAccountParams = {|
  api: ApiState,
|};

export function currentUserAccount({
  api,
}: CurrentUserAccountParams): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');

  return callApi({
    auth: true,
    endpoint: 'accounts/profile',
    apiState: api,
  });
}

export type UpdateUserAccountParams = {|
  ...UserApiParams,
  ...UserEditableFieldsType,
  picture?: File | null,
|};

export function updateUserAccount({
  api,
  picture,
  userId,
  ...editableFields
}: UpdateUserAccountParams): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  let body = editableFields;

  if (picture) {
    const form = new FormData();
    // Add all the editable fields, one by one.
    Object.keys(editableFields).forEach((key: string) => {
      // We cannot send `null` values, so we send empty string values instead.
      const value = editableFields[key];
      form.set(key, value === null ? '' : value);
    });
    // Add the picture file.
    form.set('picture_upload', picture);
    // Set the API body to be the form.
    body = form;
  }

  return callApi({
    auth: true,
    body,
    endpoint: `accounts/account/${userId}`,
    method: 'PATCH',
    apiState: api,
  });
}

export function userAccount({
  api,
  username,
}: UserApiParamsWithUsername): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');
  invariant(username, 'username is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}`,
    apiState: api,
  });
}

export function userNotifications({
  api,
  username,
}: UserApiParamsWithUsername): Promise<NotificationsType> {
  invariant(api, 'api state is required.');
  invariant(username, 'username is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}/notifications`,
    apiState: api,
  });
}

export type UpdateUserNotificationsParams = {|
  ...UserApiParams,
  notifications: NotificationsUpdateType,
|};

export function updateUserNotifications({
  api,
  notifications,
  userId,
}: UpdateUserNotificationsParams): Promise<NotificationsType> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');
  invariant(notifications, 'notifications are required.');

  return callApi({
    auth: true,
    body: notifications,
    endpoint: `accounts/account/${userId}/notifications`,
    method: 'POST',
    apiState: api,
  });
}

export function deleteUserPicture({
  api,
  userId,
}: UserApiParams): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${userId}/picture`,
    method: 'DELETE',
    apiState: api,
  });
}

export function deleteUserAccount({
  api,
  userId,
}: UserApiParams): Promise<UserId> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  return callApi({
    auth: true,
    credentials: true,
    endpoint: `accounts/account/${userId}`,
    method: 'DELETE',
    apiState: api,
  });
}
