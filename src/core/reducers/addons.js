import { ADDON_TYPE_THEME } from 'core/constants';

const initialState = {};

export function getGuid(result) {
  if (result.type === ADDON_TYPE_THEME) {
    // This mimics how Firefox appends @personas.mozilla.org internally.
    // It's needed to look up themes in mozAddonManager.
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
          // TODO: Remove this when
          // https://github.com/mozilla/addons-frontend/issues/1416 is fixed.
          // theme_data will contain `description: 'None'` when the description
          // is actually `null` and we don't want to set that on the addon
          // itself so we reset it in case it's been overwritten.
          //
          // See also https://github.com/mozilla/addons-server/issues/5650.
          description: thisAddon.description,
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
