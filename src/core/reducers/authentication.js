import cookie from 'react-cookie';
import config from 'config';

export default function authentication(state = {}, action) {
  const { payload, type } = action;
  if (type === 'SET_JWT') {
    return { ...state, token: payload.token };
  } else if (type === 'SET_CURRENT_USER') {
    return { ...state, username: payload.username };
  } else if (type === 'LOG_OUT_USER') {
    cookie.remove(config.get('cookieName'));
    return {};
  }
  return state;
}
