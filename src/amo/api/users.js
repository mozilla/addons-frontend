/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export function userAccount({ api, username }: {|
  api: ApiStateType,
  username: string,
|}) {
  if (!api) {
    throw new Error('api state is required.');
  }
  if (!username) {
    throw new Error('username is required.');
  }

  return callApi({
    auth: true,
    endpoint: `accounts/account/${username}`,
    state: api,
  });
}
