import createStore from 'amo/store';
import * as landingActions from 'amo/actions/landing';
import * as api from 'core/api';
import {
  ADDON_TYPE_THEME,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_TOP_RATED,
} from 'core/constants';
import { loadLandingAddons } from 'amo/utils';


describe('amo/utils', () => {
  describe('loadLandingAddons()', () => {
    const addonType = ADDON_TYPE_THEME;
    let ownProps;

    beforeEach(() => {
      ownProps = {
        params: {
          application: 'android',
          visibleAddonType: 'themes',
        },
      };
    });

    it('returns right away when loaded', () => {
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

      return loadLandingAddons({ store, params: ownProps.params })
        .then(() => {
          mockApi.verify();
        });
    });
  });
});
