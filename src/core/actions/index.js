export function setJWT(token) {
  return {
    type: 'SET_JWT',
    payload: {token},
  };
}
