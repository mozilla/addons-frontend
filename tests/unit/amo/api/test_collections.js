import { oneLineTrim } from 'common-tags';

import * as api from 'amo/api';
import {
  createCollection,
  createCollectionAddon,
  deleteCollection,
  getAllCollectionAddons,
  getAllUserCollections,
  getCollectionAddons,
  getCollectionDetail,
  listCollections,
  modifyCollection,
  modifyCollectionAddon,
  removeAddonFromCollection,
  updateCollection,
  updateCollectionAddon,
} from 'amo/api/collections';
import { COLLECTION_SORT_DATE_ADDED_ASCENDING } from 'amo/constants';
import {
  apiResponsePage,
  createApiResponse,
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;
  let apiState;

  const getParams = ({ ...otherParams } = {}) => {
    return {
      api: apiState,
      slug: 'some-slug',
      userId: 123,
      ...otherParams,
    };
  };

  beforeEach(() => {
    mockApi = sinon.mock(api);
    apiState = dispatchClientMetadata().store.getState().api;
  });

  describe('getCollectionDetail', () => {
    it('calls the collection detail API', async () => {
      const params = getParams();

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}/collections/${params.slug}`,
          apiState,
        })
        .once()
        .returns(createApiResponse());

      await getCollectionDetail(params);
      mockApi.verify();
    });
  });

  describe('getCollectionAddons', () => {
    it('calls the collection add-ons list API', async () => {
      const filters = {
        page: '1',
        collectionSort: COLLECTION_SORT_DATE_ADDED_ASCENDING,
      };

      const params = getParams({ filters });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}/collections/${params.slug}/addons`,
          params: { page: filters.page, sort: filters.collectionSort },
          apiState,
        })
        .once()
        .returns(createApiResponse());

      await getCollectionAddons(params);
      mockApi.verify();
    });
  });

  describe('getAllCollectionAddons', () => {
    it('gets all pages of the collection add-ons list API', async () => {
      const userId = 123;
      const slug = 'example-collection-slug';
      const addonResults = createFakeCollectionAddonsListResponse().results;

      const _getCollectionAddons = sinon.spy(() =>
        Promise.resolve(apiResponsePage({ results: addonResults })),
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const addons = await getAllCollectionAddons({
        api: apiState,
        userId,
        slug,
        _allPages,
        _getCollectionAddons,
      });

      expect(addons).toEqual(addonResults);
      sinon.assert.called(_getCollectionAddons);
      expect(_getCollectionAddons.firstCall.args[0]).toEqual({
        api: apiState,
        userId,
        slug,
        nextURL,
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

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${userId}/collections`,
          apiState,
        })
        .once()
        .returns(createApiResponse());

      const params = getListParams({ userId });
      await listCollections(params);
      mockApi.verify();
    });
  });

  describe('getAllUserCollections', () => {
    it('returns collections from multiple pages', async () => {
      const userId = 456;

      const collectionResults = [createFakeCollectionDetail({ slug: 'first' })];

      const _listCollections = sinon.spy(() =>
        Promise.resolve(apiResponsePage({ results: collectionResults })),
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const collections = await getAllUserCollections({
        api: apiState,
        userId,
        _allPages,
        _listCollections,
      });

      expect(collections).toEqual(collectionResults);
      sinon.assert.called(_listCollections);
      expect(_listCollections.firstCall.args[0]).toEqual({
        api: apiState,
        userId,
        nextURL,
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
        userId: 456,
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

      const endpoint = `accounts/account/${params.userId}/collections/`;
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
          apiState: params.api,
        })
        .once()
        .returns(Promise.resolve());

      await modifyCollection('create', params);

      mockApi.verify();
    });

    it('makes a PATCH request to the API for update', async () => {
      const params = defaultParams({ collectionSlug: slug });

      const endpoint = `accounts/account/${params.userId}/collections/${slug}`;
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
          apiState: params.api,
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
        userId: 456,
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
        userId: 456,
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
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { addon: params.addonId, notes: undefined },
          endpoint,
          method: 'POST',
          apiState: params.api,
        })
        .once()
        .returns(Promise.resolve());

      await modifyCollectionAddon(params);

      mockApi.verify();
    });

    it('POSTs notes for a collection addon', async () => {
      const notes = 'This is a really great add-on';
      const params = defaultParams({ action: 'create', notes });

      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons
      `;
      mockApi
        .expects('callApi')
        .withArgs(
          sinon.match({
            body: { addon: params.addonId, notes },
            endpoint,
            method: 'POST',
          }),
        )
        .returns(Promise.resolve());

      await modifyCollectionAddon(params);

      mockApi.verify();
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
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { notes },
          endpoint,
          method: 'PATCH',
          apiState: params.api,
        })
        .once()
        .returns(Promise.resolve());

      await modifyCollectionAddon(params);

      mockApi.verify();
    });

    it('allows you to nullify add-on notes', async () => {
      const notes = null;
      const params = defaultParams({ action: 'update', notes });

      const endpoint = oneLineTrim`
        accounts/account/${params.userId}/collections/
        ${params.slug}/addons/${params.addonId}
      `;
      mockApi
        .expects('callApi')
        .withArgs(
          sinon.match({
            body: { notes },
            endpoint,
            method: 'PATCH',
          }),
        )
        .returns(Promise.resolve());

      await modifyCollectionAddon(params);

      mockApi.verify();
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

      const modifier = sinon.spy(() => Promise.resolve());

      await createCollectionAddon({
        _modifyCollectionAddon: modifier,
        ...params,
      });

      sinon.assert.calledWith(modifier, { action: 'create', ...params });
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

      const modifier = sinon.spy(() => Promise.resolve());

      await updateCollectionAddon({
        _modifyCollectionAddon: modifier,
        ...params,
      });

      sinon.assert.calledWith(modifier, { action: 'update', ...params });
    });
  });

  describe('removeAddonFromCollection', () => {
    it('sends a request to remove an add-on from a collection', async () => {
      const addonId = 123;
      const slug = 'my-collection';
      const userId = 157;

      const endpoint = `accounts/account/${userId}/collections/${slug}/addons/${addonId}`;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint,
          method: 'DELETE',
          apiState: api,
        })
        .once()
        .returns(Promise.resolve());

      await removeAddonFromCollection({
        addonId,
        api,
        slug,
        userId,
      });

      mockApi.verify();
    });
  });

  describe('deleteCollection', () => {
    it('sends a request to delete a collection', async () => {
      const slug = 'my-collection';
      const userId = 157;

      const endpoint = `accounts/account/${userId}/collections/${slug}`;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint,
          method: 'DELETE',
          apiState: api,
        })
        .once()
        .returns(Promise.resolve());

      await deleteCollection({
        api,
        slug,
        userId,
      });

      mockApi.verify();
    });
  });
});
