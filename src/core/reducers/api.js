import {
  API_ERROR,
  SET_JWT,
  SET_LANG,
  SET_CLIENT_APP,
} from 'core/constants';

const initialState = {
  errors: {},
};

export default function api(state = initialState, action) {
  switch (action.type) {
    case API_ERROR:
      return {
        ...state,
        errors: {
          ...state.errors,
          [action.payload.id]: {
            error: {
              messages: action.payload.messages,
              error: action.payload.error,
            },
          },
        },
      };
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
