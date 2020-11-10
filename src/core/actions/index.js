/* @flow */
import {
  SET_AUTH_TOKEN,
  SET_CLIENT_APP,
  SET_LANG,
  SET_REGION_CODE,
  SET_REQUEST_ID,
  SET_USER_AGENT,
} from 'core/constants';

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
  if (!clientApp) {
    throw new Error('clientApp cannot be falsey');
  }
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
