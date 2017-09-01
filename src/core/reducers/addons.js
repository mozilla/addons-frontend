/* @flow */
import { ADDON_TYPE_THEME } from 'core/constants';
import type { ErrorHandlerType } from 'core/errorHandler';
import type { AddonType } from 'core/types/addons';


export const FETCH_ADDON = 'FETCH_ADDON';

const initialState = {};

// TODO: fix Flow types
type Action = Object;
type AddonState = Object;

type FetchAddonParams = {|
  errorHandler: ErrorHandlerType,
  slug: string,
|};

export type FetchAddonAction = {|
  type: string,
  payload: {|
    errorHandlerId: string,
    slug: string,
  |},
|};

export function fetchAddon({ errorHandler, slug }: FetchAddonParams): FetchAddonAction {
  if (!errorHandler) {
    throw new Error('errorHandler cannot be empty');
  }
  if (!slug) {
    throw new Error('slug cannot be empty');
  }
  return {
    type: FETCH_ADDON,
    payload: { errorHandlerId: errorHandler.id, slug },
  };
}

export function getGuid(result: AddonType) {
  if (result.type === ADDON_TYPE_THEME) {
    // This mimics how Firefox appends @personas.mozilla.org internally.
    // It's needed to look up themes in mozAddonManager.
    return `${result.id}@personas.mozilla.org`;
  }
  return result.guid;
}

export function denormalizeAddon(apiAddon: AddonType) {
  if (apiAddon.icon_url) {
    return {
      ...apiAddon,
      // Set iconUrl to be consistent between disco and amo.
      iconUrl: apiAddon.icon_url,
    };
  }
  return apiAddon;
}

export default function addon(
  state: AddonState = initialState,
  action: Action = {}
) {
  const { payload } = action;

  if (payload && payload.entities && payload.entities.addons) {
    const newState = { ...state };
    Object.keys(payload.entities.addons).forEach((key) => {
      const thisAddon = {
        ...payload.entities.addons[key],
        isRestartRequired: false,
      };
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
          installURL: thisAddon.current_version.files[0].url || '',
          isRestartRequired: thisAddon.current_version.files.some(
            (file) => !!file.is_restart_required
          ),
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
