import landing, {
  getLanding,
  initialState,
  loadLanding,
} from 'amo/reducers/landing';
import { ADDON_TYPE_STATIC_THEME } from 'amo/constants';
import { setLang } from 'amo/reducers/api';
import { createInternalAddonWithLang, fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLanding', () => {
    const getActionParams = () => ({
      addonType: ADDON_TYPE_STATIC_THEME,
      errorHandlerId: 'some-error-handler',
    });
    const action = getLanding(getActionParams());

    it('sets the type', () => {
      expect(action.type).toEqual('GET_LANDING');
    });

    it('sets the filters', () => {
      expect(action.payload).toEqual({
        addonType: ADDON_TYPE_STATIC_THEME,
        category: null,
        errorHandlerId: 'some-error-handler',
      });
    });

    it('optionally takes a category', () => {
      const category = 'some-category';
      const actionWithCategorySet = getLanding({
        ...getActionParams(),
        category,
      });

      expect(actionWithCategorySet.payload).toEqual({
        addonType: ADDON_TYPE_STATIC_THEME,
        category,
        errorHandlerId: 'some-error-handler',
      });
    });
  });

  describe('loadLanding', () => {
    function defaultParams() {
      return {
        addonType: ADDON_TYPE_STATIC_THEME,
        recommended: { count: 0, results: [] },
        highlyRated: { count: 0, results: [] },
        trending: { count: 0, results: [] },
      };
    }

    it('sets the type', () => {
      expect(loadLanding(defaultParams()).type).toEqual('LOAD_LANDING');
    });

    it('sets the payload', () => {
      const action = loadLanding(defaultParams());
      const expectedPayload = defaultParams();
      expect(action.payload).toEqual(expectedPayload);
    });
  });

  describe('reducer', () => {
    it('defaults to not loading', () => {
      const { loading } = landing(undefined, { type: 'unrelated' });

      expect(loading).toBe(false);
    });

    it('defaults to zero count', () => {
      const { recommended, highlyRated, trending } = landing(undefined, {
        type: 'unrelated',
      });

      expect(recommended.count).toBe(0);
      expect(highlyRated.count).toBe(0);
      expect(trending.count).toBe(0);
    });

    it('defaults to empty results', () => {
      const { recommended, highlyRated, trending } = landing(undefined, {
        type: 'unrelated',
      });
      expect(recommended.results).toEqual([]);
      expect(highlyRated.results).toEqual([]);
      expect(trending.results).toEqual([]);
    });

    describe('GET_LANDING', () => {
      it('sets the initialState', () => {
        const { addonType, recommended, highlyRated, loading, trending } =
          landing(
            initialState,
            getLanding({
              addonType: ADDON_TYPE_STATIC_THEME,
              errorHandlerId: 'some-error-handler',
            }),
          );

        expect(addonType).toEqual(ADDON_TYPE_STATIC_THEME);
        expect(loading).toEqual(true);
        expect(recommended).toEqual(initialState.recommended);
        expect(highlyRated).toEqual(initialState.highlyRated);
        expect(trending).toEqual(initialState.trending);
      });

      it('sets resultsLoaded to false', () => {
        const state = landing(
          { ...initialState, resultsLoaded: true },
          getLanding({
            addonType: ADDON_TYPE_STATIC_THEME,
            errorHandlerId: 'some-error-handler',
          }),
        );

        expect(state.resultsLoaded).toEqual(false);
      });

      it('resets each set of add-ons', () => {
        const state = landing(
          {
            ...initialState,
            recommended: {
              count: 2,
              results: [
                { ...fakeAddon, slug: 'foo' },
                { ...fakeAddon, slug: 'food' },
              ],
            },
          },
          getLanding({
            addonType: ADDON_TYPE_STATIC_THEME,
            errorHandlerId: 'some-error-handler',
          }),
        );

        expect(state.recommended).toEqual(initialState.recommended);
        expect(state.highlyRated).toEqual(initialState.highlyRated);
        expect(state.trending).toEqual(initialState.trending);
      });
    });

    describe('LOAD_LANDING', () => {
      const stateWithLang = landing(undefined, setLang('en-US'));

      it('sets the results', () => {
        const state = landing(
          stateWithLang,
          loadLanding({
            addonType: ADDON_TYPE_STATIC_THEME,
            recommended: {
              count: 2,
              results: [
                { ...fakeAddon, slug: 'foo' },
                { ...fakeAddon, slug: 'food' },
              ],
            },
            highlyRated: { count: 0, results: [] },
            trending: { count: 0, results: [] },
          }),
        );
        expect(state.recommended.count).toEqual(2);
        expect(state.recommended.results).toEqual([
          createInternalAddonWithLang({ ...fakeAddon, slug: 'foo' }),
          createInternalAddonWithLang({ ...fakeAddon, slug: 'food' }),
        ]);
        expect(state.highlyRated).toEqual({ count: 0, results: [] });
        expect(state.trending).toEqual({ count: 0, results: [] });
        expect(state.resultsLoaded).toEqual(true);
      });

      it('does not set null keys', () => {
        const previousState = {
          ...stateWithLang,
          highlyRated: 'hello',
        };

        const action = loadLanding({
          addonType: ADDON_TYPE_STATIC_THEME,
          recommended: {
            count: 2,
            results: [
              { ...fakeAddon, slug: 'foo' },
              { ...fakeAddon, slug: 'food' },
            ],
          },
          highlyRated: { count: 0, results: [] },
          trending: { count: 0, results: [] },
        });
        // We have `invariant` to prevent us from doing this in the action
        // creator, but we want to test the reducer's internals.
        delete action.payload.highlyRated;

        const { highlyRated } = landing(previousState, action);
        expect(highlyRated).toEqual(previousState.highlyRated);
      });
    });
  });
});
