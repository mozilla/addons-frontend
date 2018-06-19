import { normalize } from 'normalizr';

import { loadAddons } from 'core/reducers/addons';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { loadDiscoResults } from 'disco/actions';
import { discoResult } from 'disco/api';
import createStore from 'disco/store';
import { fakeAddon } from 'tests/unit/amo/helpers';

export function createFetchDiscoveryResult(results) {
  // Simulate how getDiscoveryAddons() applies its schema.
  return normalize({ results }, { results: [discoResult] });
}

/*
 * This takes addonResults (as if returned from the API)
 * and loads them into state the same way the real app does.
 *
 * addonResults is an AddonResultType, like this:
 *
 *  type AddonResultType = {
 *    heading: string,
 *    description: string,
 *    addon: AddonType,
 *  };
 *  type AddonResultsType = Array<AddonResultType>;
 */
export function loadDiscoResultsIntoState(
  addonResults,
  { store = createStore().store } = {},
) {
  const { entities, result } = createFetchDiscoveryResult(addonResults);
  store.dispatch(loadAddons(entities));
  store.dispatch(loadDiscoResults({ entities, result }));
  return store.getState();
}

/*
 * A minimal add-on object, as returned by the API in a
 * Discovery result.
 */
export const fakeDiscoAddon = Object.freeze({
  current_version: {
    compatibility: { ...fakeAddon.current_version.compatibility },
    files: [...fakeAddon.current_version.files],
  },
  guid: '1234@my-addons.firefox',
  icon_url: 'https://addons.cdn.mozilla.net/webdev-64.png',
  id: 1234,
  name: 'Chill Out',
  slug: 'chill-out',
  type: ADDON_TYPE_EXTENSION,
  url: 'https://somewhere/url-to-addon-detail/',
});
