/* @flow */
// Stores the install source (e.g. 'homepage-primary-hero', 'featured') across
// internal page navigation. When a user clicks an addon link on a listing page,
// the source is dispatched here. Later, when the user clicks "Install" on the
// detail page, `installAddon.js` reads this value and injects it as UTM params
// into the page URL for Firefox attribution. Cleared when leaving the addon
// detail page. See `utils/installAttribution.js` for the full picture.
import {
  SET_ADDON_INSTALL_SOURCE,
  CLEAR_ADDON_INSTALL_SOURCE,
} from 'amo/constants';

export type AddonInstallSourceState = {|
  installSource: string | null,
|};

export const initialState: AddonInstallSourceState = {
  installSource: null,
};

type SetAddonInstallSourceAction = {|
  type: typeof SET_ADDON_INSTALL_SOURCE,
  payload: string,
|};

type ClearAddonInstallSourceAction = {|
  type: typeof CLEAR_ADDON_INSTALL_SOURCE,
|};

export const setAddonInstallSource = (
  installSource: string,
): SetAddonInstallSourceAction => ({
  type: SET_ADDON_INSTALL_SOURCE,
  payload: installSource,
});

export const clearAddonInstallSource = (): ClearAddonInstallSourceAction => ({
  type: CLEAR_ADDON_INSTALL_SOURCE,
});

type Action = SetAddonInstallSourceAction | ClearAddonInstallSourceAction;

export default function addonInstallSourceReducer(
  // eslint-disable-next-line default-param-last
  state: AddonInstallSourceState = initialState,
  action: Action,
): AddonInstallSourceState {
  switch (action.type) {
    case SET_ADDON_INSTALL_SOURCE:
      return { installSource: action.payload };
    case CLEAR_ADDON_INSTALL_SOURCE:
      return { installSource: null };
    default:
      return state;
  }
}
