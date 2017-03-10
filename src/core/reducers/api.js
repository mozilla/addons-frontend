import UAParser from 'ua-parser-js';

import {
  LOG_OUT_USER,
  SET_JWT,
  SET_LANG,
  SET_CLIENT_APP,
  SET_USER_AGENT,
} from 'core/constants';

export default function api(state = {}, action) {
  switch (action.type) {
    case SET_JWT:
      return { ...state, token: action.payload.token };
    case SET_LANG:
      return { ...state, lang: action.payload.lang };
    case SET_CLIENT_APP:
      return { ...state, clientApp: action.payload.clientApp };
    case SET_USER_AGENT:
      const { browser, os } = UAParser(action.payload.userAgent);

      return {
        ...state,
        userAgent: action.payload.userAgent,
        userAgentInfo: { browser, os },
      };
    case LOG_OUT_USER:
      // Create a lexical scope for the const.
      {
        const newState = { ...state };
        delete newState.token;
        return newState;
      }
    default:
      return state;
  }
}
