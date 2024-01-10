/* @flow */
import invariant from 'invariant';
import UAParser from 'ua-parser-js';

import { LOG_OUT_USER } from 'amo/reducers/users';
import type { LogOutUserAction } from 'amo/reducers/users';
import type { Exact } from 'amo/types/util';

export const SET_AUTH_TOKEN: 'SET_AUTH_TOKEN' = 'SET_AUTH_TOKEN';
export const SET_CLIENT_APP: 'SET_CLIENT_APP' = 'SET_CLIENT_APP';
export const SET_LANG: 'SET_LANG' = 'SET_LANG';
export const SET_REGION_CODE: 'SET_REGION_CODE' = 'SET_REGION_CODE';
export const SET_REQUEST_ID: 'SET_REQUEST_ID' = 'SET_REQUEST_ID';
export const SET_USER_AGENT: 'SET_USER_AGENT' = 'SET_USER_AGENT';

export const USER_AGENT_BROWSER_FIREFOX = 'Firefox';
export const USER_AGENT_OS_ANDROID: 'Android' = 'Android';
export const USER_AGENT_OS_IOS: 'iOS' = 'iOS';

// For details, see https://github.com/faisalman/ua-parser-js
export type UserAgentInfoType = {|
  browser: {
    major?: string,
    name?: string,
    version?: string,
  },

  device: { model?: string, type?: string, vendor?: string },
  os: {
    // This is not a complete enumeration. They're just the ones
    // we have special cases for.
    name?: typeof USER_AGENT_OS_ANDROID | typeof USER_AGENT_OS_IOS,
    version?: string,
  },
|};

export type RegionCodeType = string | null;

export type ApiState = {
  clientApp: string,
  // See config.get('langs') for all possible values.
  lang: string,
  regionCode: RegionCodeType,
  requestId: string | null,
  token: string | null,
  userAgent: string | null,
  userAgentInfo: UserAgentInfoType,
};

export const initialApiState: ApiState = {
  clientApp: '',
  lang: '',
  regionCode: null,
  requestId: null,
  token: null,
  userAgent: null,
  userAgentInfo: { browser: {}, device: {}, os: {} },
};

export type SetAuthTokenAction = {|
  payload: {| token: string |},
  type: typeof SET_AUTH_TOKEN,
|};

export function setAuthToken(token: string): SetAuthTokenAction {
  if (!token) {
    throw new Error('token cannot be falsey');
  }
  return {
    type: SET_AUTH_TOKEN,
    payload: { token },
  };
}

export type SetClientAppAction = {|
  payload: {| clientApp: string |},
  type: typeof SET_CLIENT_APP,
|};

export function setClientApp(clientApp: string): SetClientAppAction {
  invariant(clientApp, 'clientApp cannot be falsey');
  return {
    type: SET_CLIENT_APP,
    payload: { clientApp },
  };
}

export type SetLangAction = {|
  payload: {| lang: string |},
  type: typeof SET_LANG,
|};

export function setLang(lang: string): SetLangAction {
  invariant(lang, 'lang cannot be falsey');
  return {
    type: SET_LANG,
    payload: { lang },
  };
}

export type SetRegionCodeAction = {|
  payload: {| regionCode: string |},
  type: typeof SET_REGION_CODE,
|};

export function setRegionCode(regionCode: string): SetRegionCodeAction {
  return {
    type: SET_REGION_CODE,
    payload: { regionCode },
  };
}

export type SetUserAgentAction = {|
  payload: {| userAgent: string |},
  type: typeof SET_USER_AGENT,
|};

export function setUserAgent(userAgent: string): SetUserAgentAction {
  return {
    type: SET_USER_AGENT,
    payload: { userAgent },
  };
}

export type SetRequestIdAction = {|
  payload: {| requestId: string |},
  type: typeof SET_REQUEST_ID,
|};

export function setRequestId(requestId: string): SetRequestIdAction {
  return {
    type: SET_REQUEST_ID,
    payload: { requestId },
  };
}

type Action =
  | SetAuthTokenAction
  | SetLangAction
  | SetClientAppAction
  | SetRequestIdAction
  | SetUserAgentAction
  | LogOutUserAction;

export default function api(
  // eslint-disable-next-line default-param-last
  state: Exact<ApiState> = initialApiState,
  action: Action,
): Exact<ApiState> {
  switch (action.type) {
    case SET_AUTH_TOKEN:
      return {
        ...state,
        token: action.payload.token,
      };
    case SET_LANG:
      return { ...state, lang: action.payload.lang };
    case SET_CLIENT_APP:
      return { ...state, clientApp: action.payload.clientApp };
    case SET_REGION_CODE:
      return { ...state, regionCode: action.payload.regionCode };
    case SET_REQUEST_ID:
      return { ...state, requestId: action.payload.requestId };
    case SET_USER_AGENT: {
      const { browser, device, os } = UAParser(action.payload.userAgent);

      return {
        ...state,
        userAgent: action.payload.userAgent,
        userAgentInfo: { browser, device, os },
      };
    }
    case LOG_OUT_USER:
      return { ...state, token: null };
    default:
      return state;
  }
}
