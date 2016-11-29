import {
  SET_JWT,
  SET_LANG,
  SET_CLIENT_APP,
} from 'core/constants';

const initialState = {};

export default function api(state = initialState, action) {
  switch (action.type) {
    case SET_JWT:
      return { ...state, token: action.payload.token };
    case SET_LANG:
      return { ...state, lang: action.payload.lang };
    case SET_CLIENT_APP:
      return { ...state, clientApp: action.payload.clientApp };
    default:
      return state;
  }
}
