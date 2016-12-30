import createStore from 'amo/store';
import * as searchActions from 'core/actions/search';
import * as api from 'core/api';
import { ADDON_TYPE_THEME } from 'core/constants';
import { loadByCategoryIfNeeded, mapStateToProps } from 'core/searchUtils';


describe('searchUtils mapStateToProps()', () => {
  const state = {
    api: { lang: 'fr-CA' },
    search: {
      filters: { clientApp: 'firefox', query: 'foo' },
      hasSearchParams: true,
    },
  };

  it('does not search if only clientApp is supplied', () => {
    // clientApp is always supplied and it's not enough to search on, so we
    // don't allow searches on it.
    const props = mapStateToProps(state, { location: { query: { } } });
    assert.deepEqual(props, { filters: {}, hasSearchParams: false });
  });
});

describe('searchUtils loadByCategoryIfNeeded()', () => {
  let filters;
  let ownProps;

  before(() => {
    filters = {
      addonType: ADDON_TYPE_THEME,
      category: 'anime',
      clientApp: 'android',
    };
    ownProps = {
      location: { query: {} },
      params: {
        application: 'android',
        visibleAddonType: 'themes',
        slug: 'anime',
      },
    };
  });

  it('returns right away when loaded', () => {
    const store = createStore();
    store.dispatch(searchActions.searchStart({ filters }));
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('search')
      .once()
      .withArgs({ page: 1, filters, api: {}, auth: {} })
      .returns(Promise.resolve({ entities, result }));
    return loadByCategoryIfNeeded({
      store,
      location: ownProps.location,
      params: ownProps.params,
    }).then(() => {
      assert.strictEqual(loadByCategoryIfNeeded({
        store,
        location: ownProps.location,
        params: ownProps.params,
      }), true);
    });
  });

  it('sets the page', () => {
    const store = createStore();
    store.dispatch(searchActions.searchStart({ filters }));
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('search')
      .once()
      .withArgs({ page: 1, filters, api: {}, auth: {} })
      .returns(Promise.resolve({ entities, result }));
    return loadByCategoryIfNeeded({
      store,
      location: ownProps.location,
      params: ownProps.params,
    })
      .then(() => mockApi.verify());
  });
});
