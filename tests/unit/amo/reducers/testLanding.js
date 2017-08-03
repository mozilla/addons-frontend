import { getLanding } from 'amo/actions/landing';
import landing, { initialState } from 'amo/reducers/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('landing reducer', () => {
  it('defaults to not loading', () => {
    const { loading } = landing(undefined, { type: 'unrelated' });

    expect(loading).toBe(false);
  });

  it('defaults to zero count', () => {
    const { featured, highlyRated, popular } = landing(undefined, {
      type: 'unrelated',
    });

    expect(featured.count).toBe(0);
    expect(highlyRated.count).toBe(0);
    expect(popular.count).toBe(0);
  });

  it('defaults to empty results', () => {
    const { featured, highlyRated, popular } = landing(undefined, {
      type: 'unrelated',
    });
    expect(featured.results).toEqual([]);
    expect(highlyRated.results).toEqual([]);
    expect(popular.results).toEqual([]);
  });

  describe('LANDING_GET', () => {
    it('sets the initialState', () => {
      const {
        addonType, featured, highlyRated, loading, popular,
      } = landing(initialState, getLanding({
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'some-error-handler',
      }));

      expect(addonType).toEqual(ADDON_TYPE_THEME);
      expect(loading).toEqual(true);
      expect(featured).toEqual(initialState.featured);
      expect(highlyRated).toEqual(initialState.highlyRated);
      expect(popular).toEqual(initialState.popular);
    });

    it('sets resultsLoaded to false', () => {
      const state = landing({ ...initialState, resultsLoaded: true }, getLanding({
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'some-error-handler',
      }));

      expect(state.resultsLoaded).toEqual(false);
    });
  });

  describe('LANDING_LOADED', () => {
    it('sets the results', () => {
      const entities = {
        addons: {
          bar: { slug: 'bar' },
          foo: { slug: 'foo' },
          food: { slug: 'food' },
        },
      };
      const state = landing(initialState, {
        type: 'LANDING_LOADED',
        payload: {
          addonType: ADDON_TYPE_THEME,
          featured: {
            entities,
            result: { count: 2, results: ['foo', 'food'] },
          },
          highlyRated: { entities, result: { count: 0, results: [] } },
          popular: { entities, result: { count: 0, results: [] } },
        },
      });
      expect(state.featured.count).toEqual(2);
      expect(state.featured.results)
        .toEqual([{ slug: 'foo' }, { slug: 'food' }]);
      expect(state.highlyRated).toEqual({ count: 0, results: [] });
      expect(state.popular).toEqual({ count: 0, results: [] });
      expect(state.resultsLoaded).toEqual(true);
    });

    it('does not set null keys', () => {
      const entities = {
        addons: {
          bar: { slug: 'bar' },
          foo: { slug: 'foo' },
          food: { slug: 'food' },
        },
      };
      const { highlyRated } = landing({
        ...initialState,
        highlyRated: 'hello',
      }, {
        type: 'LANDING_LOADED',
        payload: {
          addonType: ADDON_TYPE_THEME,
          featured: {
            entities,
            result: { count: 2, results: ['foo', 'food'] },
          },
          popular: { entities, result: { count: 0, results: [] } },
        },
      });
      expect(highlyRated).toEqual('hello');
    });
  });
});
