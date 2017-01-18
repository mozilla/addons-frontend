import { ADDON_TYPE_THEME } from 'core/constants';

const initialState = {};

export function getGuid(result) {
  if (result.type === ADDON_TYPE_THEME) {
    return `${result.id}@personas.mozilla.org`;
  }
  return result.guid;
}

export function denormalizeAddon(apiAddon) {
  if (apiAddon.icon_url) {
    return {
      ...apiAddon,
      // Set iconUrl to be consistent between disco and amo.
      iconUrl: apiAddon.icon_url,
    };
  }
  return apiAddon;
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
          type: ADDON_TYPE_THEME,
        };
        delete newState[key].theme_data;
      } else if (thisAddon.current_version && thisAddon.current_version.files.length > 0) {
        newState[key] = {
          ...thisAddon,
          installURL: thisAddon.current_version.files[0].url,
        };
      } else {
        newState[key] = thisAddon;
      }
      newState[key] = denormalizeAddon(newState[key]);
    });
    return newState;
  }
  return state;
}
