const initialState = {};

export default function addon(state = initialState, action) {
  const { payload } = action;
  if (payload && payload.entities && payload.entities.addons) {
    return {...state, ...payload.entities.addons};
  }
  return state;
}
