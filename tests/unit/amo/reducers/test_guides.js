import guideReducer, {
  initialState,
  loadGuidesAddons,
} from 'amo/reducers/guides';
import { createInternalAddon } from 'core/reducers/addons';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    const _loadGuidesAddons = ({ store, addons = [] }) => {
      store.dispatch(
        loadGuidesAddons({
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

      _loadGuidesAddons({
        store,
        addons: results,
      });

      const { guides } = store.getState();

      expect(guides).toEqual({ addons: results });
    });
  });
});
