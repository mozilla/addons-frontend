import NotAuthorized from 'amo/components/NotAuthorized';
import NotFound from 'amo/components/NotFound';
import ServerError from 'amo/components/ServerError';
import createStore from 'amo/store';
import * as featuredActions from 'amo/actions/featured';
import * as landingActions from 'amo/actions/landing';
import * as api from 'core/api';
import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import {
  getErrorComponent,
  loadFeaturedAddons,
  loadLandingAddons,
} from 'amo/utils';
import { unexpectedSuccess } from 'tests/client/helpers';


describe('amo/utils', () => {
  const ownProps = {
    params: {
      application: 'android',
      visibleAddonType: 'extensions',
    },
  };

  describe('loadFeaturedAddons()', () => {
    it('requests a large page of featured add-ons', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const store = createStore({ application: 'android' });
      store.dispatch(featuredActions.getFeatured({ addonType }));
      const mockApi = sinon.mock(api);
      const entities = sinon.stub();
      const result = { results: [] };

      mockApi
        .expects('featured')
        .once()
        .withArgs({ api: {}, filters: { addonType, page_size: 25 } })
        .returns(Promise.resolve({ entities, result }));

      return loadFeaturedAddons({ store, params: ownProps.params })
        .then(() => {
          mockApi.verify();
        });
    });
  });

  describe('loadLandingAddons()', () => {
    it('calls featured and search APIs to collect results', () => {
      const addonType = ADDON_TYPE_THEME;
      const store = createStore({ application: 'android' });
      store.dispatch(landingActions.getLanding({ addonType }));
      const mockApi = sinon.mock(api);
      const entities = sinon.stub();
      const result = sinon.stub();

      mockApi
        .expects('featured')
        .once()
        .withArgs({ api: {}, filters: { addonType, page_size: 4 } })
        .returns(Promise.resolve({ entities, result }));
      mockApi
        .expects('search')
        .once()
        .withArgs({
          api: {},
          filters: { addonType, page_size: 4, sort: SEARCH_SORT_TOP_RATED },
          page: 1,
        })
        .returns(Promise.resolve({ entities, result }));
      mockApi
        .expects('search')
        .once()
        .withArgs({
          api: {},
          filters: { addonType, page_size: 4, sort: SEARCH_SORT_POPULAR },
          page: 1,
        })
        .returns(Promise.resolve({ entities, result }));

      return loadLandingAddons({
        store,
        params: { ...ownProps.params, visibleAddonType: 'themes' },
      })
        .then(() => {
          mockApi.verify();
        });
    });

    it('returns a rejected Promise if the addonsType is wrong', () => {
      const store = createStore({ application: 'android' });

      return loadLandingAddons({
        store,
        params: { ...ownProps.params, visibleAddonType: 'addon-with-a-typo' },
      })
        .then(unexpectedSuccess)
        .catch((err) => {
          assert.equal(
            err.message,
            '"addon-with-a-typo" not found in API_ADDON_TYPES_MAPPING'
          );
        });
    });
  });

  describe('getErrorComponent', () => {
    it('returns a NotAuthorized component for 401 errors', () => {
      assert.deepEqual(getErrorComponent(401), NotAuthorized);
    });

    it('returns a NotFound component for 404 errors', () => {
      assert.deepEqual(getErrorComponent(404), NotFound);
    });

    it('returns a ServerError component for 500 errors', () => {
      assert.deepEqual(getErrorComponent(500), ServerError);
    });

    it('returns a ServerError component by default', () => {
      assert.deepEqual(getErrorComponent(501), ServerError);
    });
  });
});
