export function setJWT(token) {
  return {
    type: 'SET_JWT',
    payload: {token},
  };
}

export function loadEntities(entities) {
  return {
    type: 'ENTITIES_LOADED',
    payload: {entities},
  };
}

export function setCurrentUser(username) {
  return {
    type: 'SET_CURRENT_USER',
    payload: {
      username,
    },
  };
}
