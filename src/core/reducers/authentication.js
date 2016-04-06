const initialState = {};

export default function authentication(state = initialState, action) {
  const { payload, type } = action;
  if (type === 'SET_JWT') {
    return {
      token: payload.token,
    };
  }
  return state;
}
