import base64url from 'base64url';

import log from 'core/logger';
import {
  LOG_OUT_USER,
  SET_AUTH_TOKEN,
  SET_CURRENT_USER,
} from 'core/constants';

function getUserIdFromAuthToken(token) {
  let data;
  try {
    const parts = token.split(':');
    if (parts.length < 3) {
      throw new Error('not enough auth token segments');
    }
    data = JSON.parse(base64url.decode(parts[0]));
    log.info('decoded auth token data:', data);
    if (!data.user_id) {
      throw new Error('user_id is missing from decoded data');
    }
    return data.user_id;
  } catch (error) {
    throw new Error(`Error parsing auth token "${token}": ${error}`);
  }
}

export default function authentication(state = {}, action) {
  const { payload, type } = action;
  switch (type) {
    case SET_AUTH_TOKEN:
      return {
        ...state,
        token: payload.token,
        // Extract user data from the auth token (which is loaded from a cookie
        // on each request). This doesn't check the token's signature
        // because the server is responsible for that.
        userId: getUserIdFromAuthToken(payload.token),
      };
    case SET_CURRENT_USER:
      return { ...state, username: payload.username };
    case LOG_OUT_USER:
      return {};
    default:
      return state;
  }
}
