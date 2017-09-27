import * as api from 'core/api';
import {
  getCollectionAddons,
  getCollectionDetail,
} from 'amo/api/collections';
import { parsePage } from 'core/utils';
import { createApiResponse } from 'tests/unit/helpers';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let mockApi;

  const getParams = ({
    apiState = dispatchClientMetadata().store.getState().api,
    ...otherParams
  } = {}) => {
    return {
      api: apiState,
      slug: 'some-slug',
      user: 'user-id-or-name',
      ...otherParams,
    };
  };

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('getCollectionDetail', () => {
    it('throws an error when slug is missing', () => {
      const params = getParams();
      delete params.slug;

      expect(() => {
        getCollectionDetail(params);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const params = getParams();
      delete params.user;

      expect(() => {
        getCollectionDetail(params);
      }).toThrow('user is required');
    });

    it('calls the collection detail API', () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const params = getParams({ api: apiState });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'accounts/account/user-id-or-name/collections/some-slug',
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      return getCollectionDetail(params)
        .then(() => {
          mockApi.verify();
        });
    });

    it('makes an authenticated request when API state allows it', () => {
      const apiState = dispatchSignInActions().store.getState().api;
      const params = getParams({ apiState });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint:
          'accounts/account/user-id-or-name/collections/some-slug',
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      return getCollectionDetail(params)
        .then(() => {
          mockApi.verify();
        });
    });
  });

  describe('getCollectionAddons', () => {
    it('throws an error when slug is missing', () => {
      const params = getParams();
      delete params.slug;

      expect(() => {
        getCollectionAddons(params);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const params = getParams();
      delete params.user;

      expect(() => {
        getCollectionAddons(params);
      }).toThrow('user is required');
    });

    it('calls the collection add-ons list API', () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const queryParams = { page: parsePage(1) };
      const params = getParams({ apiState, ...queryParams });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint:
          'accounts/account/user-id-or-name/collections/some-slug/addons',
          params: queryParams,
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      return getCollectionAddons(params)
        .then(() => {
          mockApi.verify();
        });
    });

    it('makes an authenticated request when API state allows it', () => {
      const apiState = dispatchSignInActions().store.getState().api;
      const queryParams = { page: parsePage(1) };
      const params = getParams({ apiState, ...queryParams });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint:
          'accounts/account/user-id-or-name/collections/some-slug/addons',
          params: queryParams,
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      return getCollectionAddons(params)
        .then(() => {
          mockApi.verify();
        });
    });
  });
});
