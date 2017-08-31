/* @flow */
import base64url from 'base64url';
import UAParser from 'ua-parser-js';

import {
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_LANG,
  SET_CLIENT_APP,
  SET_USER_AGENT,
} from 'core/constants';
import log from 'core/logger';
import type {
  SetAuthTokenAction,
  LogOutUserAction,
  SetClientAppAction,
  SetLangAction,
  SetUserAgentAction,
} from 'core/actions/index';
import type { Exact } from 'core/types/util';

type UserAgentInfoType = {|
  browser: {
    major?: string,
    name?: string,
    version?: string,
  },
  os: {
    name?: string,
  },
|};

export type ApiStateType = {
  clientApp: ?string,
  lang: ?string,
  token: ?string,
  userAgent: ?string,
  userAgentInfo: UserAgentInfoType,
  userId: ?number,
};

export const initialApiState: ApiStateType = {
  clientApp: null,
  lang: null,
  token: null,
  userAgent: null,
  userAgentInfo: { browser: {}, os: {} },
  userId: null,
};

function getUserIdFromAuthToken(token) {
  let data;
  try {
    const parts = token.split(':');
    if (parts.length < 3) {
      throw new Error('not enough auth token segments');
    }
    data = JSON.parse(base64url.decode(parts[0]));
    log.info('decoded auth token data:', data);
    if (!data.user_id) {
      throw new Error('user_id is missing from decoded data');
    }
    return data.user_id;
  } catch (error) {
    throw new Error(`Error parsing auth token "${token}": ${error}`);
  }
}

export default function api(
  state: Exact<ApiStateType> = initialApiState,
  action: SetAuthTokenAction
    & SetLangAction
    & SetClientAppAction
    & SetUserAgentAction
    & LogOutUserAction
): Exact<ApiStateType> {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
        // Extract user data from the auth token (which is loaded from a cookie
        // on each request). This doesn't check the token's signature
        // because the server is responsible for that.
        userId: getUserIdFromAuthToken(action.payload.token),
      };
    case SET_LANG:
      return { ...state, lang: action.payload.lang };
    case SET_CLIENT_APP:
      return { ...state, clientApp: action.payload.clientApp };
    case SET_USER_AGENT:
    {
      const { browser, os } = UAParser(action.payload.userAgent);

      return {
        ...state,
        userAgent: action.payload.userAgent,
        userAgentInfo: { browser, os },
      };
    }
    case LOG_OUT_USER:
      return { ...state, token: null, userId: null };
    default:
      return state;
  }
}
