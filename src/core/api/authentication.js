import url from 'url';

import config from 'config';

import { API_BASE, callApi, makeQueryString } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';
import type { ReactRouterLocation } from 'core/types/router';


type LoginParams = {|
  api: ApiStateType,
  code: string,
  state: string,
|};

export function login({ api, code, state }: LoginParams) {
  const params = { config: undefined };
  const configName = config.get('fxaConfig');
  if (configName) {
    params.config = configName;
  }
  return callApi({
    endpoint: 'accounts/login',
    method: 'POST',
    body: { code, state },
    params,
    state: api,
    credentials: true,
  });
}

export function logOutFromServer({ api }: {| api: ApiStateType |}) {
  return callApi({
    auth: true,
    credentials: true,
    endpoint: 'accounts/session',
    method: 'DELETE',
    state: api,
  });
}

export function startLoginUrl(
  { location }: {| location: ReactRouterLocation |},
) {
  const configName = config.get('fxaConfig');
  const params = {
    config: undefined,
    to: url.format({ ...location }),
  };
  if (configName) {
    params.config = configName;
  }
  const query = makeQueryString(params);
  return `${API_BASE}/accounts/login/start/${query}`;
}
