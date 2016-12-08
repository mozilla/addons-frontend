// import * as actions from 'core/actions';
import createStore from 'amo/store';
import * as featuredActions from 'amo/actions/featured';
import * as highlyRatedActions from 'amo/actions/highlyRated';
import * as popularActions from 'amo/actions/popular';
import * as api from 'core/api';
import { loadFeatured, loadHighlyRated, loadPopular } from 'amo/utils';


describe('AMO utils loadFeatured()', () => {
  const addonType = 'theme';
  let ownProps;

  before(() => {
    ownProps = {
      params: {
        addonType: 'themes',
        application: 'android',
      },
    };
  });

  it('returns right away when loaded', () => {
    const store = createStore({ application: 'android' });
    store.dispatch(featuredActions.featuredGet({ addonType }));
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('featured')
      .once()
      .withArgs({ addonType, api: {}, page_size: 4 })
      .returns(Promise.resolve({ entities, result }));
    return loadFeatured({
      store,
      location: ownProps.location,
      params: ownProps.params,
    }).then(() => {
      mockApi.verify();
      assert.strictEqual(loadFeatured({
        store: {
          dispatch: sinon.stub(),
          getState: () => ({ addonType: 'theme', loading: false }),
        },
        location: ownProps.location,
        params: ownProps.params,
      }), true);
    });
  });
});

describe('AMO utils loadHighlyRated()', () => {
  const addonType = 'theme';
  let ownProps;

  before(() => {
    ownProps = {
      params: {
        addonType: 'themes',
        application: 'android',
      },
    };
  });

  it('returns right away when loaded', () => {
    const store = createStore({ application: 'android' });
    store.dispatch(
      highlyRatedActions.highlyRatedStart({ filters: { addonType } }));
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('search')
      .once()
      .withArgs({
        api: {},
        filters: { addonType: 'theme', page_size: 4, sort: 'rating' },
        page: 1,
      })
      .returns(Promise.resolve({ entities, result }));
    return loadHighlyRated({
      store,
      location: ownProps.location,
      params: ownProps.params,
    }).then(() => {
      mockApi.verify();
      assert.strictEqual(loadHighlyRated({
        store: {
          dispatch: sinon.stub(),
          getState: () => ({
            filters: { addonType: 'theme', page_size: 4, sort: 'rating' },
            loading: false,
          }),
        },
        location: ownProps.location,
        params: ownProps.params,
      }), true);
    });
  });
});

describe('AMO utils loadPopular()', () => {
  const addonType = 'extension';
  let ownProps;

  before(() => {
    ownProps = {
      params: {
        addonType: 'extensions',
        application: 'android',
      },
    };
  });

  it('returns right away when loaded', () => {
    const store = createStore({ application: 'android' });
    store.dispatch(popularActions.popularStart({ filters: { addonType } }));
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('search')
      .once()
      .withArgs({
        api: {},
        filters: { addonType: 'extension', page_size: 4, sort: 'hotness' },
        page: 1,
      })
      .returns(Promise.resolve({ entities, result }));
    return loadPopular({
      store,
      location: ownProps.location,
      params: ownProps.params,
    }).then(() => {
      mockApi.verify();
      assert.strictEqual(loadPopular({
        store: {
          dispatch: sinon.stub(),
          getState: () => ({
            filters: { addonType: 'extension', page_size: 4, sort: 'hotness' },
            loading: false,
          }),
        },
        location: ownProps.location,
        params: ownProps.params,
      }), true);
    });
  });
});
