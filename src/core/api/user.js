/* @flow */
import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';

export function userProfile({ api }: {| api: ApiStateType |}) {
  if (!api) {
    throw new Error('The api state is required.');
  }

  return callApi({
    auth: true,
    endpoint: 'accounts/profile',
    state: api,
  });
}
