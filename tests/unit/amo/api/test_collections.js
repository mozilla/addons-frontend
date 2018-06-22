import { oneLineTrim } from 'common-tags';

import * as api from 'core/api';
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
import { apiResponsePage, createApiResponse } from 'tests/unit/helpers';
import {
  createFakeCollectionAddonsListResponse,
  createFakeCollectionDetail,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let mockApi;
  let apiState;

  const getParams = ({ ...otherParams } = {}) => {
    return {
      api: apiState,
      slug: 'some-slug',
      username: 'some-user',
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

    it('throws an error when username is missing', () => {
      const params = getParams();
      delete params.username;

      expect(() => {
        getCollectionDetail(params);
      }).toThrow('username is required');
    });

    it('calls the collection detail API', async () => {
      const params = getParams();

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/account/some-user/collections/some-slug',
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

    it('throws an error when username is missing', () => {
      const params = getParams();
      delete params.username;

      expect(() => {
        getCollectionAddons(params);
      }).toThrow('username is required');
    });

    it('calls the collection add-ons list API', async () => {
      const queryParams = { page: 1 };
      const params = getParams({ ...queryParams });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/account/some-user/collections/some-slug/addons',
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
      const username = 'example-username';
      const slug = 'example-collection-slug';
      const addonResults = createFakeCollectionAddonsListResponse().results;

      const _getCollectionAddons = sinon.spy(() =>
        Promise.resolve(apiResponsePage({ results: addonResults })),
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const addons = await getAllCollectionAddons({
        api: apiState,
        username,
        slug,
        _allPages,
        _getCollectionAddons,
      });

      expect(addons).toEqual(addonResults);
      sinon.assert.called(_getCollectionAddons);
      expect(_getCollectionAddons.firstCall.args[0]).toEqual({
        api: apiState,
        username,
        slug,
        nextURL,
      });
    });
  });

  describe('listCollections', () => {
    const getListParams = (params = {}) => {
      return {
        api: apiState,
        username: 'some-user',
        ...params,
      };
    };

    it('throws an error when the username parameter is missing', () => {
      const params = getListParams();
      delete params.username;

      expect(() => listCollections(params)).toThrow(
        /username parameter is required/,
      );
    });

    it('calls the list collections API', async () => {
      const username = 'some-user';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${username}/collections`,
          state: apiState,
        })
        .once()
        .returns(createApiResponse());

      const params = getListParams({ username });
      await listCollections(params);
      mockApi.verify();
    });
  });

  describe('getAllUserCollections', () => {
    it('returns collections from multiple pages', async () => {
      const username = 'some-user';

      const collectionResults = [createFakeCollectionDetail({ slug: 'first' })];

      const _listCollections = sinon.spy(() =>
        Promise.resolve(apiResponsePage({ results: collectionResults })),
      );

      const nextURL = 'the-endpoint?page=2';
      const _allPages = sinon.spy((nextPage) => nextPage(nextURL));

      const collections = await getAllUserCollections({
        api: apiState,
        username,
        _allPages,
        _listCollections,
      });

      expect(collections).toEqual(collectionResults);
      sinon.assert.called(_listCollections);
      expect(_listCollections.firstCall.args[0]).toEqual({
        api: apiState,
        username,
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
        username: 'some-user',
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

      const endpoint = `accounts/account/${params.username}/collections/`;
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

      const endpoint = `accounts/account/${
        params.username
      }/collections/${slug}`;
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
        username: 'some-user',
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
        username: 'some-user',
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
        username: 'some-user',
        ...params,
      };
    };

    it('POSTs a collection addon', async () => {
      const params = defaultParams({
        action: 'create',
        addonId: 987675,
        slug: 'my-collection',
        username: 'some-user',
      });

      const endpoint = oneLineTrim`
        accounts/account/${params.username}/collections/
        ${params.slug}/addons
      `;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { addon: params.addonId, notes: undefined },
          endpoint,
          method: 'POST',
          state: params.api,
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
        accounts/account/${params.username}/collections/
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
        username: 'some-user',
      });

      const endpoint = oneLineTrim`
        accounts/account/${params.username}/collections/
        ${params.slug}/addons/${params.addonId}
      `;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: { notes },
          endpoint,
          method: 'PATCH',
          state: params.api,
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
        accounts/account/${params.username}/collections/
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
        username: 'some-user',
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
        username: 'cool-user',
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
      const username = 'my-user';

      const endpoint = `accounts/account/${username}/collections/${slug}/addons/${addonId}`;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint,
          method: 'DELETE',
          state: api,
        })
        .once()
        .returns(Promise.resolve());

      await removeAddonFromCollection({
        addonId,
        api,
        slug,
        username,
      });

      mockApi.verify();
    });
  });

  describe('deleteCollection', () => {
    it('sends a request to delete a collection', async () => {
      const slug = 'my-collection';
      const username = 'my-user';

      const endpoint = `accounts/account/${username}/collections/${slug}`;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint,
          method: 'DELETE',
          state: api,
        })
        .once()
        .returns(Promise.resolve());

      await deleteCollection({
        api,
        slug,
        username,
      });

      mockApi.verify();
    });
  });
});
