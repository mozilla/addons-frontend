/* @flow */
import {
  ENTITIES_LOADED,
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_CLIENT_APP,
  SET_CURRENT_USER,
  SET_LANG,
  SET_USER_AGENT,
} from 'core/constants';

export type SetAuthTokenAction = {|
  payload: {| token: string |},
  type: string,
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

export type LogOutUserAction = {|
  type: string,
|};

export function logOutUser(): LogOutUserAction {
  return { type: LOG_OUT_USER };
}

export type SetClientAppAction = {|
  payload: {| clientApp: string |},
  type: string,
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
  type: string,
|};

export function setLang(lang: string): SetLangAction {
  return {
    type: SET_LANG,
    payload: { lang },
  };
}

export type SetUserAgentAction = {|
  payload: {| userAgent: string |},
  type: string,
|};

export function setUserAgent(userAgent: string): SetUserAgentAction {
  return {
    type: SET_USER_AGENT,
    payload: { userAgent },
  };
}

export type LoadEntitiesAction = {|
  payload: {| entities: Array<Object> |},
  type: string,
|};

export function loadEntities(entities: Array<Object>): LoadEntitiesAction {
  return {
    type: ENTITIES_LOADED,
    payload: { entities },
  };
}

export type SetCurrentUserAction = {|
  payload: {| username: string |},
  type: string,
|};

export function setCurrentUser(username: string): SetCurrentUserAction {
  return {
    type: SET_CURRENT_USER,
    payload: { username },
  };
}
