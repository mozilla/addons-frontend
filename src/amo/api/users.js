/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type {
  NotificationsUpdateType,
  UserEditableFieldsType,
  UserId,
  ExternalUserType,
  NotificationsType,
} from 'amo/reducers/users';
import type { ApiState } from 'core/reducers/api';

export function currentUserAccount({
  api,
}: {|
  api: ApiState,
|}): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');

  return callApi({
    auth: true,
    endpoint: 'accounts/profile',
    state: api,
  });
}

export function updateUserAccount({
  api,
  picture,
  userId,
  ...editableFields
}: {|
  api: ApiState,
  editableFields: UserEditableFieldsType,
  picture?: File | null,
  userId: UserId,
|}): Promise<ExternalUserType> {
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
    state: api,
  });
}

type UserApiParams = {|
  api: ApiState,
  username: string,
|};

export function userAccount({
  api,
  username,
}: UserApiParams): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');
  invariant(username, 'username is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}`,
    state: api,
  });
}

export function userNotifications({
  api,
  username,
}: UserApiParams): Promise<NotificationsType> {
  invariant(api, 'api state is required.');
  invariant(username, 'username is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}/notifications`,
    state: api,
  });
}

export function updateUserNotifications({
  api,
  notifications,
  userId,
}: {|
  api: ApiState,
  notifications: NotificationsUpdateType,
  userId: UserId,
|}): Promise<NotificationsType> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');
  invariant(notifications, 'notifications are required.');

  return callApi({
    auth: true,
    body: notifications,
    endpoint: `accounts/account/${userId}/notifications`,
    method: 'POST',
    state: api,
  });
}

export function deleteUserPicture({
  api,
  userId,
}: {|
  api: ApiState,
  userId: UserId,
|}): Promise<ExternalUserType> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${userId}/picture`,
    method: 'DELETE',
    state: api,
  });
}

export function deleteUserAccount({
  api,
  userId,
}: {|
  api: ApiState,
  userId: UserId,
|}): Promise<UserId> {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  return callApi({
    auth: true,
    credentials: true,
    endpoint: `accounts/account/${userId}`,
    method: 'DELETE',
    state: api,
  });
}
