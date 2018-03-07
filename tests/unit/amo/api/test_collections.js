import * as api from 'core/api';
import {
  addAddonToCollection,
  createCollection,
  getAllCollectionAddons,
  getAllUserCollections,
  getCollectionAddons,
  getCollectionDetail,
  listCollections,
  modifyCollection,
  updateCollection,
} from 'amo/api/collections';
import { apiResponsePage, createApiResponse } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';


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
      const queryParams = { page: 1 };
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

  describe('getAllCollectionAddons', () => {
    it('gets all pages of the collection add-ons list API', async () => {
      const user = 'example-username';
      const slug = 'example-collection-slug';
      const addonResults = createFakeCollectionAddons().results;

      const _getCollectionAddons = sinon.spy(
        () => Promise.resolve(apiResponsePage({ results: addonResults }))
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const addons = await getAllCollectionAddons({
        api: apiState,
        user,
        slug,
        _allPages,
        _getCollectionAddons,
      });

      expect(addons).toEqual(addonResults);
      sinon.assert.called(_getCollectionAddons);
      expect(_getCollectionAddons.firstCall.args[0]).toEqual({
        api: apiState, user, slug, nextURL,
      });
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

    it('posts an addon with notes', async () => {
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

  describe('getAllUserCollections', () => {
    it('returns collections from multiple pages', async () => {
      const user = 'some-user-id';

      const collectionResults = [
        createFakeCollectionDetail({ slug: 'first' }),
      ];

      const _listCollections = sinon.spy(
        () => Promise.resolve(
          apiResponsePage({ results: collectionResults })
        )
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const collections = await getAllUserCollections({
        api: apiState, user, _allPages, _listCollections,
      });

      expect(collections).toEqual(collectionResults);
      sinon.assert.called(_listCollections);
      expect(_listCollections.firstCall.args[0]).toEqual({
        api: apiState, user, nextURL,
      });
    });
  });

  describe('modifyCollection', () => {
    const slug = 'collection-slug';
    const name = { fr: 'nomme' };

    const defaultParams = (params = {}) => {
      return {
        api: apiState,
        name,
        user: 'user-id-or-username',
        ...params,
      };
    };

    it('validates description value', async () => {
      const validator = sinon.stub();
      const description = { fr: 'la description' };
      const params = defaultParams({
        description,
        slug,
        _validateLocalizedString: validator,
      });

      mockApi.expects('callApi');
      await modifyCollection('create', params);

      sinon.assert.calledWith(validator, description);
      mockApi.verify();
    });

    it('validates name value', async () => {
      const validator = sinon.stub();
      const params = defaultParams({
        slug,
        _validateLocalizedString: validator,
      });

      mockApi.expects('callApi');
      await modifyCollection('create', params);

      sinon.assert.calledWith(validator, name);
      mockApi.verify();
    });

    it('makes a POST request to the API for create', async () => {
      const params = defaultParams({ slug });

      const endpoint =
        `accounts/account/${params.user}/collections/`;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: {
            default_locale: undefined,
            description: undefined,
            name,
            slug,
          },
          endpoint,
          method: 'POST',
          state: params.api,
        })
        .once()
        .returns(Promise.resolve());

      await modifyCollection('create', params);

      mockApi.verify();
    });

    it('makes a PATCH request to the API for update', async () => {
      const params = defaultParams({ collectionSlug: slug });

      const endpoint =
        `accounts/account/${params.user}/collections/${slug}`;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: {
            default_locale: undefined,
            description: undefined,
            name,
            slug: undefined,
          },
          endpoint,
          method: 'PATCH',
          state: params.api,
        })
        .once()
        .returns(Promise.resolve());

      await modifyCollection('update', params);

      mockApi.verify();
    });
  });

  describe('updateCollection', () => {
    it('calls modifyCollection with the expected params', async () => {
      const validator = sinon.stub();
      const modifier = sinon.spy(() => Promise.resolve());
      const modifyParams = {
        api: apiState,
        collectionSlug: 'collection-slug',
        defaultLocale: undefined,
        description: undefined,
        name: undefined,
        slug: undefined,
        user: 'user-id-or-username',
        _validateLocalizedString: validator,
      };
      const updateParams = {
        ...modifyParams,
        _modifyCollection: modifier,
      };

      await updateCollection(updateParams);

      sinon.assert.calledWith(modifier, 'update', modifyParams);
    });
  });

  describe('createCollection', () => {
    it('calls modifyCollection with the expected params', async () => {
      const validator = sinon.stub();
      const modifier = sinon.spy(() => Promise.resolve());
      const modifyParams = {
        api: apiState,
        defaultLocale: undefined,
        description: undefined,
        name: undefined,
        slug: 'collection-slug',
        user: 'user-id-or-username',
        _validateLocalizedString: validator,
      };
      const createParams = {
        ...modifyParams,
        _modifyCollection: modifier,
      };

      await createCollection(createParams);

      sinon.assert.calledWith(modifier, 'create', modifyParams);
    });
  });
});
