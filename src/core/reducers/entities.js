const initialState = {
  addons: {},
};

export default function entities(state = initialState, action) {
  if (action.response && action.response.entities) {
    const loadedEntities = action.response.entities;
    const newState = Object.assign({}, state);
    Object.keys(loadedEntities).forEach((entity) => {
      Object.keys(loadedEntities[entity]).forEach((id) => {
        newState[entity][id] = loadedEntities[entity][id];
      });
    });
    return newState;
  }
  return state;
}
