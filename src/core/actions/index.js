import {
  API_ERROR,
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

export function setApiError({ error, id }) {
  let messages = ['Unexpected server error'];
  if (error.response &&
      error.response.data &&
      error.response.data.non_field_errors) {
    // TODO: check for all field errors.
    messages = error.response.data.non_field_errors;
  }
  return {
    type: API_ERROR,
    payload: {
      error, id, messages,
    },
  };
}
