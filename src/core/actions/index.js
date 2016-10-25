import {
  SET_JWT,
  SET_CLIENT_APP,
  SET_LANG,
  ENTITIES_LOADED,
  SET_CURRENT_USER,
} from 'core/constants';

export function setJWT(token) {
  return {
    type: SET_JWT,
    payload: { token },
  };
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

export function loadEntities(entities) {
  return {
    type: ENTITIES_LOADED,
    payload: { entities },
  };
}

export function setCurrentUser(username) {
  return {
    type: SET_CURRENT_USER,
    payload: {
      username,
    },
  };
}
