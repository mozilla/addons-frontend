import { getLanding } from 'amo/actions/landing';
import landing from 'amo/reducers/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('landing reducer', () => {
  let initialData;

  beforeAll(() => {
    initialData = {
      featured: { count: 0, results: [] },
      highlyRated: { count: 0, results: [] },
      loading: true,
      popular: { count: 0, results: [] },
    };
  });

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
      const initialState = {
        featured: { foo: 'bar' },
        highlyRated: { count: 0 },
        loading: false,
        popular: { results: [] },
      };
      const {
        addonType, featured, highlyRated, loading, popular,
      } = landing(initialState, getLanding({ addonType: ADDON_TYPE_THEME }));

      expect(addonType).toEqual(ADDON_TYPE_THEME);
      expect(loading).toEqual(true);
      expect(featured).toEqual({ foo: 'bar' });
      expect(highlyRated).toEqual({ count: 0 });
      expect(popular).toEqual({ results: [] });
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
      const { featured, highlyRated, popular } = landing(initialData, {
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
      expect(featured.count).toEqual(2);
      expect(featured.results).toEqual([{ slug: 'foo' }, { slug: 'food' }]);
      expect(highlyRated).toEqual({ count: 0, results: [] });
      expect(popular).toEqual({ count: 0, results: [] });
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
        ...initialData,
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

  describe('LANDING_FAILED', () => {
    it('sets loading to false on failure', () => {
      const initialState = landing(initialData, { type: 'LANDING_GET', payload: { addonType: ADDON_TYPE_THEME } });
      const state = landing(initialState,
        { type: 'LANDING_FAILED', payload: { page: 2, addonType: ADDON_TYPE_THEME } });

      expect(state).toEqual({
        addonType: ADDON_TYPE_THEME,
        featured: { count: 0, results: [] },
        highlyRated: { count: 0, results: [] },
        loading: false,
        popular: { count: 0, results: [] },
      });
    });
  });
});
