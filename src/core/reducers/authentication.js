export default function authentication(state = {}, action) {
  const { payload, type } = action;
  if (type === 'SET_JWT') {
    return { token: payload.token };
  } else if (type === 'SET_CURRENT_USER') {
    return { ...state, username: payload.username };
  }
  return state;
}
