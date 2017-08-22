/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export function userProfile({ api }: {| api: ApiStateType |}) {
  return callApi({
    auth: true,
    endpoint: 'accounts/profile',
    state: api,
  });
}
