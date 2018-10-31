import guidesReducer, {
  fetchGuidesAddons,
  initialState,
} from 'amo/reducers/guides';
import { loadAddonResults } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes to its default state', () => {
      const state = guidesReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('updates the loading flag status', () => {
      const state = guidesReducer(
        undefined,
        fetchGuidesAddons({ guids: 'test,test2', errorHandlerId: 'test' }),
      );

      expect(state.loading).toEqual(true);

      const afterAddonsLoadedState = guidesReducer(
        undefined,
        loadAddonResults({ addons: [fakeAddon] }),
      );

      expect(afterAddonsLoadedState.loading).toEqual(false);
    });
  });
});
