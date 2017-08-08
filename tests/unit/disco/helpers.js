import { normalize } from 'normalizr';

import { loadEntities } from 'core/actions';
import { ADDON_TYPE_EXTENSION } from 'core/constants';
import { discoResults } from 'disco/actions';
import { discoResult } from 'disco/api';
import createStore from 'disco/store';

export function createFetchDiscoveryResult(results) {
  // Simulate how getDiscoveryAddons() applies its schema.
  return normalize({ results }, { results: [discoResult] });
}

export function createFakeEvent() {
  return {
    currentTarget: sinon.stub(),
    preventDefault: sinon.stub(),
  };
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
export function loadDiscoResultsIntoState(addonResults) {
  const { entities, result } = createFetchDiscoveryResult(addonResults);
  const { store } = createStore();
  store.dispatch(loadEntities(entities));
  store.dispatch(discoResults(
    result.results.map((r) => entities.discoResults[r])
  ));
  return store.getState();
}

/*
 * A minimal add-on object, as returned by the API in a
 * Discovery result;
 */
export const fakeDiscoAddon = Object.freeze({
  current_version: {
    compatibility: {},
    files: [],
  },
  guid: '1234@my-addons.firefox',
  icon_url: 'https://addons.cdn.mozilla.net/webdev-64.png',
  id: 1234,
  name: 'Chill Out',
  slug: 'chill-out',
  type: ADDON_TYPE_EXTENSION,
  url: 'https://somewhere/url-to-addon-detail/',
});
