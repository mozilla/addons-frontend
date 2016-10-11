import base64url from 'base64url';

import log from 'core/logger';

function decodeUserIdFromJwt(token) {
  let data;
  try {
    const parts = token.split('.');
    if (parts.length < 3) {
      throw new Error('not enough JWT segments');
    }
    data = JSON.parse(base64url.decode(parts[1]));
    log.info('decoded JWT data:', data);
    if (!data.user_id) {
      throw new Error('user_id is missing from decoded data');
    }
    return data.user_id;
  } catch (error) {
    throw new Error(`Error parsing token "${token}": ${error}`);
  }
}

export default function authentication(state = {}, action) {
  const { payload, type } = action;
  switch (type) {
    case 'SET_JWT':
      return {
        ...state,
        token: payload.token,
        // Extract user data from the JWT (which is loaded from a cookie
        // on each request). This doesn't check the token's signature
        // because the server is responsible for that.
        userId: decodeUserIdFromJwt(payload.token),
      };
    case 'SET_CURRENT_USER':
      return { ...state, username: payload.username };
    case 'LOG_OUT_USER':
      return {};
    default:
      return state;
  }
}
