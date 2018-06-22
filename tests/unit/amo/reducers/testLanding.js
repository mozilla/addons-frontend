import { getLanding } from 'amo/actions/landing';
import landing, { initialState } from 'amo/reducers/landing';
import { ADDON_TYPE_THEME } from 'core/constants';
import { createInternalAddon } from 'core/reducers/addons';
import { fakeAddon } from 'tests/unit/amo/helpers';

describe(__filename, () => {
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

  describe('LANDING_GET', () => {
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
      const entities = {
        addons: {
          bar: { ...fakeAddon, slug: 'bar' },
          foo: { ...fakeAddon, slug: 'foo' },
          food: { ...fakeAddon, slug: 'food' },
        },
      };
      const state = landing(
        {
          ...initialState,
          featured: {
            entities,
            result: { count: 2, results: ['foo', 'food'] },
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

  describe('LANDING_LOADED', () => {
    it('sets the results', () => {
      const entities = {
        addons: {
          bar: { ...fakeAddon, slug: 'bar' },
          foo: { ...fakeAddon, slug: 'foo' },
          food: { ...fakeAddon, slug: 'food' },
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
          trending: { entities, result: { count: 0, results: [] } },
        },
      });
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
      const entities = {
        addons: {
          bar: { ...fakeAddon, slug: 'bar' },
          foo: { ...fakeAddon, slug: 'foo' },
          food: { ...fakeAddon, slug: 'food' },
        },
      };
      const { highlyRated } = landing(
        {
          ...initialState,
          highlyRated: 'hello',
        },
        {
          type: 'LANDING_LOADED',
          payload: {
            addonType: ADDON_TYPE_THEME,
            featured: {
              entities,
              result: { count: 2, results: ['foo', 'food'] },
            },
            trending: { entities, result: { count: 0, results: [] } },
          },
        },
      );
      expect(highlyRated).toEqual('hello');
    });
  });
});
