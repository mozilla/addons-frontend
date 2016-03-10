const initialState = {};

export default function addon(state = initialState, action) {
  const { payload } = action;
  if (payload && payload.entities && payload.entities.addons) {
    const newState = Object.assign({}, state);
    Object.keys(payload.entities.addons).forEach((slug) => {
      newState[slug] = payload.entities.addons[slug];
    });
    return newState;
  }
  return state;
}
