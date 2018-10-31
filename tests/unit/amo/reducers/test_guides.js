import guideReducer, {
  fetchGuidesAddons,
  FETCH_GUIDES_ADDONS,
  initialState,
} from 'amo/reducers/guides';
import { LOAD_ADDON_RESULTS } from 'core/reducers/addons';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes to its default state', () => {
      const state = guideReducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('updates the loading flag status', () => {
      const state = guideReducer(
        undefined,
        fetchGuidesAddons({ guid: 'test', errorHandlerId: 'test' }),
      );

      const newState = guideReducer(state, { type: FETCH_GUIDES_ADDONS });
      expect(newState.loading).toEqual(true);

      const afterAddonsLoadedState = guideReducer(state, {
        type: LOAD_ADDON_RESULTS,
      });
      expect(afterAddonsLoadedState.loading).toEqual(false);
    });
  });
});
