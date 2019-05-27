import landing, {
  getLanding,
  initialState,
  loadLanding,
} from 'amo/reducers/landing';
import { ADDON_TYPE_THEME } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLanding', () => {
    const getActionParams = () => ({
      addonType: ADDON_TYPE_THEME,
      errorHandlerId: 'some-error-handler',
      enableFeatureRecommendedBadges: true,
    });
    const action = getLanding(getActionParams());

    it('sets the type', () => {
      expect(action.type).toEqual('GET_LANDING');
    });

    it('sets the filters', () => {
      expect(action.payload).toEqual({
        addonType: ADDON_TYPE_THEME,
        category: null,
        errorHandlerId: 'some-error-handler',
        enableFeatureRecommendedBadges: true,
      });
    });

    it('optionally takes a category', () => {
      const category = 'some-category';
      const actionWithCategorySet = getLanding({
        ...getActionParams(),
        category,
      });

      expect(actionWithCategorySet.payload).toEqual({
        addonType: ADDON_TYPE_THEME,
        category,
        errorHandlerId: 'some-error-handler',
        enableFeatureRecommendedBadges: true,
      });
    });
  });

  describe('loadLanding', () => {
    function defaultParams() {
      return {
        addonType: ADDON_TYPE_THEME,
        featured: { count: 0, results: [] },
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
      const { featured, highlyRated, trending } = landing(undefined, {
        type: 'unrelated',
      });

      expect(featured.count).toBe(0);
      expect(highlyRated.count).toBe(0);
      expect(trending.count).toBe(0);
    });

    it('defaults to empty results', () => {
      const { featured, highlyRated, trending } = landing(undefined, {
        type: 'unrelated',
      });
      expect(featured.results).toEqual([]);
      expect(highlyRated.results).toEqual([]);
      expect(trending.results).toEqual([]);
    });

    describe('GET_LANDING', () => {
      it('sets the initialState', () => {
        const { addonType, featured, highlyRated, loading, trending } = landing(
          initialState,
          getLanding({
            addonType: ADDON_TYPE_THEME,
            errorHandlerId: 'some-error-handler',
          }),
        );

        expect(addonType).toEqual(ADDON_TYPE_THEME);
        expect(loading).toEqual(true);
        expect(featured).toEqual(initialState.featured);
        expect(highlyRated).toEqual(initialState.highlyRated);
        expect(trending).toEqual(initialState.trending);
      });

      it('sets resultsLoaded to false', () => {
        const state = landing(
          { ...initialState, resultsLoaded: true },
          getLanding({
            addonType: ADDON_TYPE_THEME,
            errorHandlerId: 'some-error-handler',
          }),
        );

        expect(state.resultsLoaded).toEqual(false);
      });

      it('resets each set of add-ons', () => {
        const state = landing(
          {
            ...initialState,
            featured: {
              count: 2,
              results: [
                { ...fakeAddon, slug: 'foo' },
                { ...fakeAddon, slug: 'food' },
              ],
            },
          },
          getLanding({
            addonType: ADDON_TYPE_THEME,
            errorHandlerId: 'some-error-handler',
          }),
        );

        expect(state.featured).toEqual(initialState.featured);
        expect(state.highlyRated).toEqual(initialState.highlyRated);
        expect(state.trending).toEqual(initialState.trending);
      });
    });

    describe('LOAD_LANDING', () => {
      it('sets the results', () => {
        const state = landing(
          initialState,
          loadLanding({
            addonType: ADDON_TYPE_THEME,
            featured: {
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
        expect(state.featured.count).toEqual(2);
        expect(state.featured.results).toEqual([
          createInternalAddon({ ...fakeAddon, slug: 'foo' }),
          createInternalAddon({ ...fakeAddon, slug: 'food' }),
        ]);
        expect(state.highlyRated).toEqual({ count: 0, results: [] });
        expect(state.trending).toEqual({ count: 0, results: [] });
        expect(state.resultsLoaded).toEqual(true);
      });

      it('does not set null keys', () => {
        const previousState = {
          ...initialState,
          highlyRated: 'hello',
        };

        const action = loadLanding({
          addonType: ADDON_TYPE_THEME,
          featured: {
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
