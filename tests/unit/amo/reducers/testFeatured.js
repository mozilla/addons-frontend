import * as actions from 'amo/actions/featured';
import featured, { initialState } from 'amo/reducers/featured';
import { ADDON_TYPE_THEME } from 'core/constants';

describe('featured reducer', () => {
  it('defaults to not loading', () => {
    const { loading } = featured(initialState, { type: 'unrelated' });
    expect(loading).toBe(false);
  });

  it('defaults to `null` addonType', () => {
    const { addonType } = featured(initialState, { type: 'unrelated' });
    expect(addonType).toBe(null);
  });

  it('defaults to empty results', () => {
    const { results } = featured(initialState, { type: 'unrelated' });
    expect(results).toEqual([]);
  });

  describe('FEATURED_GET', () => {
    it('sets the initialState', () => {
      const { addonType, loading, results } = featured(
        initialState, actions.getFeatured({
          addonType: ADDON_TYPE_THEME, errorHandlerId: 'some-error-handler',
        }));

      expect(addonType).toEqual(ADDON_TYPE_THEME);
      expect(loading).toEqual(true);
      expect(results).toEqual([]);
    });
  });

  describe('FEATURED_LOADED', () => {
    it('sets the results', () => {
      const entities = {
        addons: {
          bar: { slug: 'bar' },
          foo: { slug: 'foo' },
          food: { slug: 'food' },
        },
      };
      const { addonType, loading, results } = featured(
        initialState,
        actions.loadFeatured({
          addonType: 'theme',
          entities,
          result: { results: ['foo', 'food'] },
        })
      );
      expect(addonType).toEqual('theme');
      expect(loading).toBe(false);
      expect(results).toEqual([{ slug: 'foo' }, { slug: 'food' }]);
    });
  });
});
