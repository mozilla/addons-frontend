import * as api from 'core/api';
import {
  addAddonToCollection,
  getAllCollectionAddons,
  getAllUserCollections,
  getCollectionAddons,
  getCollectionDetail,
  listCollections,
} from 'amo/api/collections';
import { parsePage } from 'core/utils';
import { apiResponsePage, createApiResponse } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  fakeAddon,
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

  describe('getAllCollectionAddons', () => {
    it('gets all pages of the collection add-ons list API', async () => {
      const user = 'example-username';
      const slug = 'example-collection-slug';

      const firstAddonSet = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 1 }],
      });
      const secondAddonSet = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 2 }],
      });

      let page = 0;
      const endpoint =
        `accounts/account/${user}/collections/${slug}/addons`;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: sinon.match(endpoint),
          params: sinon.match.any,
          state: apiState,
        })
        .twice()
        .callsFake((request) => {
          page += 1;
          let next;
          let results = [];
          if (page === 1) {
            next = `${endpoint}?page=2`;
            results = firstAddonSet.results;
          } else {
            results = secondAddonSet.results;
            // When we pass a next URL, it will include ?page=... so it
            // is important that the page parameter is not sent.
            expect(request.params).toEqual(undefined);
          }
          return Promise.resolve(apiResponsePage({ next, results }));
        });

      const addons = await getAllCollectionAddons({
        api: apiState, user, slug,
      });
      expect(addons)
        .toEqual(firstAddonSet.results.concat(secondAddonSet.results));
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

  describe('getAllUserCollections', () => {
    it('returns collections from multiple pages', async () => {
      const user = 'some-user-id';

      const firstCollection = createFakeCollectionDetail({
        slug: 'first',
      });
      const secondCollection = createFakeCollectionDetail({
        slug: 'second',
      });

      let page = 0;
      const endpoint = `accounts/account/${user}/collections`;
      mockApi
        .expects('callApi')
        .withArgs({
          auth: true, endpoint: sinon.match(endpoint), state: apiState,
        })
        .twice()
        .callsFake(() => {
          page += 1;
          let next;
          const results = [];
          if (page === 1) {
            next = `${endpoint}?page=2`;
            results.push(firstCollection);
          } else {
            results.push(secondCollection);
          }
          return Promise.resolve(apiResponsePage({ next, results }));
        });

      const results = await getAllUserCollections({
        user, api: apiState,
      });
      expect(results).toEqual([firstCollection, secondCollection]);
      mockApi.verify();
    });
  });
});
