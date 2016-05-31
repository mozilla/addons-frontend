const initialState = {};

export default function addon(state = initialState, action) {
  const { payload } = action;
  if (payload && payload.entities && payload.entities.addons) {
    const newState = {...state};
    Object.keys(payload.entities.addons).forEach((key) => {
      const thisAddon = payload.entities.addons[key];
      if (thisAddon.theme_data) {
        newState[key] = {
          ...thisAddon,
          ...thisAddon.theme_data,
          guid: `${thisAddon.id}@personas.mozilla.org`,
        };
        delete newState[key].theme_data;
      } else {
        if (thisAddon.current_version && thisAddon.current_version.files.length > 0) {
          newState[key] = {
            ...thisAddon,
            installURL: thisAddon.current_version.files[0].url,
          };
        } else {
          newState[key] = thisAddon;
        }
      }
    });
    return newState;
  }
  return state;
}
