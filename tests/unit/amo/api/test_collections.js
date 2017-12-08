import * as api from 'core/api';
import {
  addAddonToCollection,
  getCollectionAddons,
  getCollectionDetail,
  listCollections,
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

  describe('listCollections', () => {
    const getListParams = (params = {}) => {
      return {
        api: apiState,
        user: 'user-id-or-string',
        ...params,
      };
    };

    it('throws an error when the user parameter is missing', () => {
      const params = getListParams();
      delete params.user;

      expect(() => listCollections(params))
        .toThrow(/user parameter is required/);
    });

    it('calls the list collections API', async () => {
      const user = 'some-user-id';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${user}/collections`,
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      const params = getListParams({ user });
      await listCollections(params);
      mockApi.verify();
    });
  });

  describe('addAddonToCollection', () => {
    const getAddParams = (params = {}) => {
      return {
        addon: 'addon-id-or-slug',
        api: apiState,
        collection: 'collection-id-or-slug',
        user: 'user-id-or-username',
        ...params,
      };
    };

    it('posts an addon to a collection', async () => {
      const params = getAddParams({
        addon: 'some-addon',
        user: 'my-username',
        collection: 'my-collection',
      });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { addon: 'some-addon', notes: undefined },
          endpoint:
            'accounts/account/my-username/collections/my-collection/addons',
          method: 'POST',
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      await addAddonToCollection(params);
      mockApi.verify();
    });

    it('posts notes about an addon', async () => {
      const notes = 'some notes about the add-on';
      const params = getAddParams({ addon: 'some-addon', notes });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { addon: 'some-addon', notes },
          endpoint: `accounts/account/${params.user}` +
            `/collections/${params.collection}/addons`,
          method: 'POST',
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      await addAddonToCollection(params);
      mockApi.verify();
    });

    it('requires an addon', () => {
      const params = getAddParams();
      delete params.addon;

      expect(() => addAddonToCollection(params))
        .toThrow(/addon parameter is required/);
    });

    it('requires a collection', () => {
      const params = getAddParams();
      delete params.collection;

      expect(() => addAddonToCollection(params))
        .toThrow(/collection parameter is required/);
    });

    it('requires a user', () => {
      const params = getAddParams();
      delete params.user;

      expect(() => addAddonToCollection(params))
        .toThrow(/user parameter is required/);
    });
  });
});
