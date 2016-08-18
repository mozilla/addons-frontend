import { API_THEME_TYPE, THEME_TYPE } from 'core/constants';

const initialState = {};

export function getGuid(result) {
  if (result.type === API_THEME_TYPE) {
    return `${result.id}@personas.mozilla.org`;
  }
  return result.guid;
}

export default function addon(state = initialState, action) {
  const { payload } = action;
  if (payload && payload.entities && payload.entities.addons) {
    const newState = { ...state };
    Object.keys(payload.entities.addons).forEach((key) => {
      const thisAddon = payload.entities.addons[key];
      if (thisAddon.theme_data) {
        newState[key] = {
          ...thisAddon,
          ...thisAddon.theme_data,
          guid: getGuid(thisAddon),
          type: THEME_TYPE,
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
