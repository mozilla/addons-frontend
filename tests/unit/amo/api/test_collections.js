import * as api from 'core/api';
import {
  getCollectionAddons,
  getCollectionDetail,
} from 'amo/api/collections';
import { parsePage } from 'core/utils';
import { createApiResponse } from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let mockApi;
  let apiState;

  const getParams = ({
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
    apiState = dispatchClientMetadata().store.getState().api;
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

    it('calls the collection detail API', async () => {
      const params = getParams();

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/account/user-id-or-name/collections/some-slug',
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      await getCollectionDetail(params);
      mockApi.verify();
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

    it('calls the collection add-ons list API', async () => {
      const queryParams = { page: parsePage(1) };
      const params = getParams({ ...queryParams });

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

      await getCollectionAddons(params);
      mockApi.verify();
    });
  });
});
