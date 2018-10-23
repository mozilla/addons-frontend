import UAParser from 'ua-parser-js';

import guideReducer, {
  fetchGuideAddons,
  initialState,
  loadGuideAddons,
} from 'amo/reducers/guide';
import { createInternalAddon, createPlatformFiles } from 'core/reducers/addons';
import {
  dispatchClientMetadata,
  fakeAddon,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadGuideAddons = ({ store, addons = [''] }) => {
      store.dispatch(
        loadGuideAddons({
          addons,
        }),
      );
    };

    it('initializes to its default state', () => {
      const state = guideReducer(undefined, ['']);
      expect(state).toEqual(initialState);
    });

    it('loads guide addons', () => {
      const { store } = dispatchClientMetadata();
      const results = Array(5).fill(createInternalAddon(fakeAddon));
      const guid =
        'support@lastpass.com,{b76ed4e7-12a6-4f25-a27b-fc3f93289008}';

      _loadGuideAddons({
        store,
        addons: results,
      });

      const guide = store.getState().guide;

      expect(guide).toEqual({ addons: results });
    });
  });
});
