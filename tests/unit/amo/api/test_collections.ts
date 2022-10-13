import { oneLineTrim } from 'common-tags';

import * as api from 'amo/api';
import { createCollection, createCollectionAddon, deleteCollection, getAllCollectionAddons, getAllUserCollections, getCollectionAddons, getCollectionDetail, listCollections, modifyCollection, modifyCollectionAddon, removeAddonFromCollection, updateCollection, updateCollectionAddon } from 'amo/api/collections';
import { COLLECTION_SORT_DATE_ADDED_ASCENDING } from 'amo/constants';
import { apiResponsePage, createFakeCollectionAddonsListResponse, createFakeCollectionDetail, dispatchClientMetadata } from 'tests/unit/helpers';

jest.mock('amo/api', () => ({ ...jest.requireActual('amo/api'),
  callApi: jest.fn().mockResolvedValue(),
}));
describe(__filename, () => {
  let apiState;

  const getParams = ({ ...otherParams
  } = {}) => {
    return {
      api: apiState,
      slug: 'some-slug',
      userId: 123,
      ...otherParams,
    };
  };

  beforeEach(() => {
    apiState = dispatchClientMetadata().store.getState().api;
  });
  afterEach(() => {
    jest.clearAllMocks().resetModules();
  });
  describe('getCollectionDetail', () => {
    it('calls the collection detail API', async () => {
      const params = getParams();
      await getCollectionDetail(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        endpoint: `accounts/account/${params.userId}/collections/${params.slug}`,
        apiState,
      });
    });
  });
  describe('getCollectionAddons', () => {
    it('calls the collection add-ons list API', async () => {
      const filters = {
        page: '1',
        collectionSort: COLLECTION_SORT_DATE_ADDED_ASCENDING,
      };
      const params = getParams({
        filters,
      });
      await getCollectionAddons(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        endpoint: `accounts/account/${params.userId}/collections/${params.slug}/addons`,
        params: {
          page: filters.page,
          sort: filters.collectionSort,
        },
        apiState,
      });
    });
  });
  describe('getAllCollectionAddons', () => {
    it('gets all pages of the collection add-ons list API', async () => {
      const userId = 123;
      const slug = 'example-collection-slug';
      const addonResults = createFakeCollectionAddonsListResponse().results;

      const _getCollectionAddons = jest.fn().mockResolvedValue(apiResponsePage({
        results: addonResults,
      }));

      const nextURL = 'the-endpoint?page=2';

      const _allPages = jest.fn((nextPage) => nextPage(nextURL));

      const addons = await getAllCollectionAddons({
        api: apiState,
        userId,
        slug,
        _allPages,
        _getCollectionAddons,
      });
      expect(addons).toEqual(addonResults);
      expect(_getCollectionAddons).toHaveBeenCalledWith({
        api: apiState,
        userId,
        slug,
        nextURL,
      });
    });
    it('uses default values for _allPages and _getCollectionAddons', async () => {
      const userId = 123;
      const slug = 'example-collection-slug';
      const addonResults = createFakeCollectionAddonsListResponse().results;
      api.callApi.mockResolvedValue(apiResponsePage({
        results: addonResults,
      }));
      const addons = await getAllCollectionAddons({
        api: apiState,
        userId,
        slug,
      });
      expect(addons).toEqual(addonResults);
      expect(api.callApi).toHaveBeenCalledWith({
        apiState,
        auth: true,
        endpoint: `accounts/account/${userId}/collections/${slug}/addons`,
        params: undefined,
      });
    });
  });
  describe('listCollections', () => {
    const getListParams = (params = {}) => {
      return {
        api: apiState,
        userId: 123,
        ...params,
      };
    };

    it('calls the list collections API', async () => {
      const userId = 345;
      const params = getListParams({
        userId,
      });
      await listCollections(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        endpoint: `accounts/account/${userId}/collections`,
        apiState,
      });
    });
  });
  describe('getAllUserCollections', () => {
    it('returns collections from multiple pages', async () => {
      const userId = 456;
      const collectionResults = [createFakeCollectionDetail({
        slug: 'first',
      })];

      const _listCollections = jest.fn().mockResolvedValue(apiResponsePage({
        results: collectionResults,
      }));

      const nextURL = 'the-endpoint?page=2';

      const _allPages = jest.fn((nextPage) => nextPage(nextURL));

      const collections = await getAllUserCollections({
        api: apiState,
        userId,
        _allPages,
        _listCollections,
      });
      expect(collections).toEqual(collectionResults);
      expect(_listCollections).toHaveBeenCalledWith({
        api: apiState,
        userId,
        nextURL,
      });
    });
  });
  describe('modifyCollection', () => {
    const slug = 'collection-slug';
    const name = {
      fr: 'nomme',
    };

    const defaultParams = (params = {}) => {
      return {
        api: apiState,
        name,
        userId: 456,
        ...params,
      };
    };

    it('validates description value', async () => {
      const validator = jest.fn();
      const description = {
        fr: 'la description',
      };
      const params = defaultParams({
        description,
        slug,
        _validateLocalizedString: validator,
      });
      await modifyCollection('create', params);
      expect(validator).toHaveBeenCalledWith(description);
      expect(api.callApi).toHaveBeenCalled();
    });
    it('validates name value', async () => {
      const validator = jest.fn();
      const params = defaultParams({
        slug,
        _validateLocalizedString: validator,
      });
      await modifyCollection('create', params);
      expect(validator).toHaveBeenCalledWith(name);
      expect(api.callApi).toHaveBeenCalled();
    });
    it('makes a POST request to the API for create', async () => {
      const params = defaultParams({
        slug,
      });
      const endpoint = `accounts/account/${params.userId}/collections/`;
      await modifyCollection('create', params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          default_locale: undefined,
          description: undefined,
          name,
          slug,
        },
        endpoint,
        method: 'POST',
        apiState: params.api,
      });
    });
    it('makes a PATCH request to the API for update', async () => {
      const params = defaultParams({
        collectionSlug: slug,
      });
      const endpoint = `accounts/account/${params.userId}/collections/${slug}`;
      await modifyCollection('update', params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          default_locale: undefined,
          description: undefined,
          name,
          slug: undefined,
        },
        endpoint,
        method: 'PATCH',
        apiState: params.api,
      });
    });
  });
  describe('updateCollection', () => {
    it('calls modifyCollection with the expected params', async () => {
      const validator = jest.fn();
      const modifier = jest.fn().mockResolvedValue();
      const modifyParams = {
        api: apiState,
        collectionSlug: 'collection-slug',
        defaultLocale: undefined,
        description: undefined,
        name: undefined,
        slug: undefined,
        userId: 456,
        _validateLocalizedString: validator,
      };
      const updateParams = { ...modifyParams,
        _modifyCollection: modifier,
      };
      await updateCollection(updateParams);
      expect(modifier).toHaveBeenCalledWith('update', modifyParams);
    });
  });
  describe('createCollection', () => {
    it('calls modifyCollection with the expected params', async () => {
      const validator = jest.fn();
      const modifier = jest.fn().mockResolvedValue();
      const modifyParams = {
        api: apiState,
        defaultLocale: undefined,
        description: undefined,
        name: undefined,
        slug: 'collection-slug',
        userId: 456,
        _validateLocalizedString: validator,
      };
      const createParams = { ...modifyParams,
        _modifyCollection: modifier,
      };
      await createCollection(createParams);
      expect(modifier).toHaveBeenCalledWith('create', modifyParams);
    });
    it('uses default params', async () => {
      const createParams = {
        api: apiState,
        defaultLocale: undefined,
        description: undefined,
        name: undefined,
        slug: 'collection-slug',
        userId: 456,
      };
      await createCollection(createParams);
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          default_locale: undefined,
          description: undefined,
          name: undefined,
          slug: createParams.slug,
        },
        endpoint: `accounts/account/${createParams.userId}/collections/`,
        method: 'POST',
        apiState: createParams.api,
      });
    });
  });
  describe('modifyCollectionAddon', () => {
    const defaultParams = (params = {}) => {
      return {
        action: 'create',
        addonId: 123458,
        api: apiState,
        slug: 'some-collection',
        userId: 456,
        ...params,
      };
    };

    it('POSTs a collection addon', async () => {
      const params = defaultParams({
        action: 'create',
        addonId: 987675,
        slug: 'my-collection',
        userId: 456,
      });
      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons
      `;
      await modifyCollectionAddon(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          addon: params.addonId,
          notes: undefined,
        },
        endpoint,
        method: 'POST',
        apiState: params.api,
      });
    });
    it('POSTs notes for a collection addon', async () => {
      const notes = 'This is a really great add-on';
      const params = defaultParams({
        action: 'create',
        notes,
      });
      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons
      `;
      await modifyCollectionAddon(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          addon: params.addonId,
          notes,
        },
        endpoint,
        method: 'POST',
        apiState: params.api,
      });
    });
    it('PATCHes notes for a collection addon', async () => {
      const notes = 'This add-on is essential';
      const params = defaultParams({
        action: 'update',
        addonId: 987675,
        slug: 'my-collection',
        notes,
        userId: 456,
      });
      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons/${params.addonId}
      `;
      await modifyCollectionAddon(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          notes,
        },
        endpoint,
        method: 'PATCH',
        apiState: params.api,
      });
    });
    it('allows you to nullify add-on notes', async () => {
      const notes = null;
      const params = defaultParams({
        action: 'update',
        notes,
      });
      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons/${params.addonId}
      `;
      await modifyCollectionAddon(params);
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        body: {
          notes,
        },
        endpoint,
        method: 'PATCH',
        apiState: params.api,
      });
    });
  });
  describe('createCollectionAddon', () => {
    it('calls modifyCollectionAddon', async () => {
      const params = {
        addonId: 1122432,
        api: apiState,
        slug: 'the-collection',
        notes: 'Beware of this one weird bug',
        userId: 456,
      };
      const modifier = jest.fn().mockResolvedValue();
      await createCollectionAddon({
        _modifyCollectionAddon: modifier,
        ...params,
      });
      expect(modifier).toHaveBeenCalledWith({
        action: 'create',
        ...params,
      });
    });
  });
  describe('updateCollectionAddon', () => {
    it('calls modifyCollectionAddon', async () => {
      const params = {
        addonId: 1122432,
        api: apiState,
        slug: 'cool-collection',
        notes: 'This add-on speaks to my soul',
        userId: 789,
      };
      const modifier = jest.fn().mockResolvedValue();
      await updateCollectionAddon({
        _modifyCollectionAddon: modifier,
        ...params,
      });
      expect(modifier).toHaveBeenCalledWith({
        action: 'update',
        ...params,
      });
    });
  });
  describe('removeAddonFromCollection', () => {
    it('sends a request to remove an add-on from a collection', async () => {
      const addonId = 123;
      const slug = 'my-collection';
      const userId = 157;
      const endpoint = `accounts/account/${userId}/collections/${slug}/addons/${addonId}`;
      await removeAddonFromCollection({
        addonId,
        api,
        slug,
        userId,
      });
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        endpoint,
        method: 'DELETE',
        apiState: api,
      });
    });
  });
  describe('deleteCollection', () => {
    it('sends a request to delete a collection', async () => {
      const slug = 'my-collection';
      const userId = 157;
      const endpoint = `accounts/account/${userId}/collections/${slug}`;
      await deleteCollection({
        api,
        slug,
        userId,
      });
      expect(api.callApi).toHaveBeenCalledOnce();
      expect(api.callApi).toHaveBeenCalledWith({
        auth: true,
        endpoint,
        method: 'DELETE',
        apiState: api,
      });
    });
  });
});