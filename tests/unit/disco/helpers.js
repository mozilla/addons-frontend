import { loadAddonResults } from 'core/reducers/addons';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import {
  createExternalAddonMap,
  loadDiscoResults,
} from 'disco/reducers/discoResults';
import createStore from 'disco/store';
import { fakeAddon } from 'tests/unit/amo/helpers';

export function createFetchDiscoveryResult(results) {
  return {
    count: results.length,
    results,
  };
}

/*
 * This takes addonResults (as if returned from the API) and loads them into
 * state the same way the real app does.
 */
export function loadDiscoResultsIntoState(
  addonResults,
  { store = createStore().store } = {},
) {
  const { results } = createFetchDiscoveryResult(addonResults);
  const addons = createExternalAddonMap({ results });

  store.dispatch(loadAddonResults({ addons }));
  store.dispatch(loadDiscoResults({ results }));

  return store.getState();
}

/*
 * A minimal add-on object, as returned by the API in a Discovery result.
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

export const createDiscoResult = (props = {}) => {
  return {
    addon: fakeDiscoAddon,
    description: 'some description',
    heading: 'some heading',
    is_recommendation: true,
    ...props,
  };
};
