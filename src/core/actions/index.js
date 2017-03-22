import {
  ENTITIES_LOADED,
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_CLIENT_APP,
  SET_CURRENT_USER,
  SET_LANG,
  SET_USER_AGENT,
} from 'core/constants';

export function setAuthToken(token) {
  return {
    type: SET_AUTH_TOKEN,
    payload: { token },
  };
}

export function logOutUser() {
  return { type: LOG_OUT_USER };
}

export function setClientApp(clientApp) {
  if (!clientApp) {
    throw new Error('clientApp cannot be falsey');
  }
  return {
    type: SET_CLIENT_APP,
    payload: { clientApp },
  };
}

export function setLang(lang) {
  return {
    type: SET_LANG,
    payload: { lang },
  };
}

export function setUserAgent(userAgent) {
  return {
    type: SET_USER_AGENT,
    payload: { userAgent },
  };
}

export function loadEntities(entities) {
  return {
    type: ENTITIES_LOADED,
    payload: { entities },
  };
}

export function setCurrentUser(username) {
  return {
    type: SET_CURRENT_USER,
    payload: { username },
  };
}
