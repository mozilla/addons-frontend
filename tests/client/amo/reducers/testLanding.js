import { getLanding } from 'amo/actions/landing';
import landing from 'amo/reducers/landing';
import { ADDON_TYPE_THEME } from 'core/constants';


describe('landing reducer', () => {
  let initialData;

  before(() => {
    initialData = {
      featured: { count: 0, results: [] },
      highlyRated: { count: 0, results: [] },
      loading: true,
      popular: { count: 0, results: [] },
    };
  });

  it('defaults to not loading', () => {
    const { loading } = landing(undefined, { type: 'unrelated' });

    assert.strictEqual(loading, false);
  });

  it('defaults to zero count', () => {
    const { featured, highlyRated, popular } = landing(undefined, {
      type: 'unrelated',
    });

    assert.strictEqual(featured.count, 0);
    assert.strictEqual(highlyRated.count, 0);
    assert.strictEqual(popular.count, 0);
  });

  it('defaults to empty results', () => {
    const { featured, highlyRated, popular } = landing(undefined, {
      type: 'unrelated',
    });
    assert.deepEqual(featured.results, []);
    assert.deepEqual(highlyRated.results, []);
    assert.deepEqual(popular.results, []);
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

      assert.equal(addonType, ADDON_TYPE_THEME);
      assert.equal(loading, true);
      assert.deepEqual(featured, { foo: 'bar' });
      assert.deepEqual(highlyRated, { count: 0 });
      assert.deepEqual(popular, { results: [] });
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
      assert.equal(featured.count, 2);
      assert.deepEqual(featured.results, [{ slug: 'foo' }, { slug: 'food' }]);
      assert.deepEqual(highlyRated, { count: 0, results: [] });
      assert.deepEqual(popular, { count: 0, results: [] });
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
      assert.deepEqual(highlyRated, 'hello');
    });
  });

  describe('LANDING_FAILED', () => {
    it('sets loading to false on failure', () => {
      const initialState = landing(initialData, { type: 'LANDING_GET', payload: { addonType: ADDON_TYPE_THEME } });
      const state = landing(initialState,
        { type: 'LANDING_FAILED', payload: { page: 2, addonType: ADDON_TYPE_THEME } });

      assert.deepEqual(state, {
        addonType: ADDON_TYPE_THEME,
        featured: { count: 0, results: [] },
        highlyRated: { count: 0, results: [] },
        loading: false,
        popular: { count: 0, results: [] },
      });
    });
  });
});
