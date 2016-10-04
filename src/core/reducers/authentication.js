import base64url from 'base64url';

export default function authentication(state = {}, action) {
  const { payload, type } = action;
  switch (type) {
    case 'SET_JWT':
      return {
        ...state,
        token: payload.token,
        // Extract user data from the JWT (which is loaded from a cookie
        // on each request). This doesn't check the token's siganture
        // because the server is responsible for that.
        username: getUserNameFromJwt(payload.token),
      };
    case 'SET_CURRENT_USER':
      return { ...state, username: payload.username };
    case 'LOG_OUT_USER':
      return {};
  }
  return state;
}

function getUserNameFromJwt(token) {
  let data;
  try {
    const parts = token.split('.');
    if (parts.length < 3) {
      throw new Error('not enough JWT segments');
    }
    data = JSON.parse(base64url.decode(parts[1]));
  } catch (error) {
    throw new Error(`Error parsing token "${token}": ${error}`);
  }
  return data.username;
}
