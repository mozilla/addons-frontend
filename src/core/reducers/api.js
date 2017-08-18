/* @flow */
import UAParser from 'ua-parser-js';

import {
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_LANG,
  SET_CLIENT_APP,
  SET_USER_AGENT,
} from 'core/constants';
import type {
  SetAuthTokenAction,
  LogOutUserAction,
  SetClientAppAction,
  SetLangAction,
  SetUserAgentAction,
} from 'core/actions/index';
import type { Exact } from 'core/types/util';

type UserAgentInfoType = {|
  browser: string,
  os: string,
|};

export type ApiStateType = {
  clientApp: ?string,
  lang: ?string,
  token: ?string,
  userAgent: ?string,
  userAgentInfo: ?UserAgentInfoType,
};

export const initialApiState = {
  clientApp: null,
  lang: null,
  token: null,
  userAgent: null,
  userAgentInfo: null,
};

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
      return { ...state, token: action.payload.token };
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
      return { ...state, token: null };
    default:
      return state;
  }
}
