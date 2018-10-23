import guideReducer, {
  initialState,
  loadGuideAddons,
} from 'amo/reducers/guide';
import { createInternalAddon } from 'core/reducers/addons';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadGuideAddons = ({ store, addons = [] }) => {
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

      _loadGuideAddons({
        store,
        addons: results,
      });

      const { guide } = store.getState();

      expect(guide).toEqual({ addons: results });
    });
  });
});
