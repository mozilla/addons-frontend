import createStore from 'amo/store';
import * as landingActions from 'amo/actions/landing';
import * as api from 'core/api';
import { loadLandingAddons } from 'amo/utils';


describe('amo/utils', () => {
  describe('loadLandingAddons()', () => {
    const addonType = 'theme';
    let ownProps;

    beforeEach(() => {
      ownProps = {
        params: {
          application: 'android',
          pluralAddonType: 'themes',
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
          filters: { addonType, page_size: 4, sort: 'rating' },
          page: 1,
        })
        .returns(Promise.resolve({ entities, result }));
      mockApi
        .expects('search')
        .once()
        .withArgs({
          api: {},
          filters: { addonType, page_size: 4, sort: 'hotness' },
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
