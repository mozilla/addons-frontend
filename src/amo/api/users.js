/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { UserEditableFieldsType } from 'amo/reducers/users';
import type { ApiStateType } from 'core/reducers/api';


export function currentUserAccount({ api }: {| api: ApiStateType |}) {
  invariant(api, 'api state is required.');

  return callApi({
    auth: true,
    endpoint: 'accounts/profile',
    state: api,
  });
}

export function editUserAccount({ api, userId, ...editableFields }: {|
  api: ApiStateType,
  editableFields: UserEditableFieldsType,
  userId: number,
|}) {
  invariant(api, 'api state is required.');
  invariant(userId, 'userId is required.');

  return callApi({
    auth: true,
    body: editableFields,
    endpoint: `accounts/account/${userId}`,
    method: 'PATCH',
    state: api,
  });
}

export function userAccount({ api, username }: {|
  api: ApiStateType,
  username: string,
|}) {
  invariant(api, 'api state is required.');
  invariant(username, 'username is required.');

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}`,
    state: api,
  });
}
