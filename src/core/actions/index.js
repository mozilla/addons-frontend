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
  type: typeof SET_AUTH_TOKEN,
  payload: {| token: string |},
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
  type: typeof LOG_OUT_USER,
|};

export function logOutUser(): LogOutUserAction {
  return { type: LOG_OUT_USER };
}

export type SetClientAppAction = {|
  type: typeof SET_CLIENT_APP,
  payload: {| clientApp: string |},
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
  type: typeof SET_LANG,
  payload: {| lang: string |},
|};

export function setLang(lang: string): SetLangAction {
  return {
    type: SET_LANG,
    payload: { lang },
  };
}

export type SetUserAgentAction = {|
  type: typeof SET_USER_AGENT,
  payload: {| userAgent: string |},
|};

export function setUserAgent(userAgent: string): SetUserAgentAction {
  return {
    type: SET_USER_AGENT,
    payload: { userAgent },
  };
}

export type LoadEntitiesAction = {|
  type: typeof ENTITIES_LOADED,
  payload: {| entities: Array<Object> |},
|};

export function loadEntities(entities: Array<Object>): LoadEntitiesAction {
  return {
    type: ENTITIES_LOADED,
    payload: { entities },
  };
}

export type SetCurrentUserAction = {|
  type: typeof SET_CURRENT_USER,
  payload: {| username: string |},
|};

export function setCurrentUser(username: string): SetCurrentUserAction {
  return {
    type: SET_CURRENT_USER,
    payload: { username },
  };
}
