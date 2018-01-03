import reducer, {
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  abortUserAddonCollectionsWork,
  addAddonToCollection,
  beginUserAddonCollectionsWork,
  createInternalAddons,
  createInternalCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserCollections,
  fetchUserAddonCollections,
  getCollectionById,
  getCurrentCollection,
  initialState,
  loadCollectionAddons,
  loadCollectionIntoState,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  loadUserAddonCollections,
} from 'amo/reducers/collections';
import { parsePage } from 'core/utils';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  fakeAddon,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = reducer(undefined, {});
      expect(state).toEqual(initialState);
    });

    it('ignores unrelated actions', () => {
      const state = reducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('indicates when fetching a collection', () => {
      const state = reducer(undefined, fetchCurrentCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);
      expect(state.current.id).toEqual(null);
    });

    it('sets a loading flag when fetching a collection page', () => {
      const state = reducer(undefined, fetchCurrentCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);
    });

    it('resets add-ons when fetching a collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      let state = reducer(undefined, loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      state = reducer(state, fetchCurrentCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: collectionDetail.slug,
        user: 'some-user-id-or-name',
      }));

      expect(getCurrentCollection(state).addons).toEqual([]);
    });

    it('loads a collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      const state = reducer(undefined, loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const loadedCollection = getCurrentCollection(state);

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection).toEqual(createInternalCollection({
        detail: collectionDetail,
        items: collectionAddons.results,
      }));
      expect(state.current.loading).toEqual(false);
    });

    it('resets the current collection when fetching a new collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      let state = reducer(undefined, loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User navigates to another collection.
      state = reducer(state, fetchCurrentCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);
      expect(state.current.id).toEqual(null);
    });

    it('resets the add-ons when fetching a new collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      let state = reducer(undefined, loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User clicks the "next" pagination link.
      state = reducer(state, fetchCurrentCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);
      expect(getCurrentCollection(state)).toEqual({
        ...createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons.results,
        }),
        addons: [],
      });
    });

    it('cannot load collection page without a current collection', () => {
      const addons = createFakeCollectionAddons();

      expect(() => reducer(undefined, loadCurrentCollectionPage({ addons })))
        .toThrow(/current collection does not exist/);
    });

    it('loads a collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      let state = reducer(undefined, loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const newAddons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 333 }],
      });
      state = reducer(state, loadCurrentCollectionPage({
        addons: newAddons,
      }));

      const loadedCollection = getCurrentCollection(state);

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection.addons)
        .toEqual(createInternalAddons(newAddons.results));
      expect(state.current.loading).toEqual(false);
    });

    it('resets the current collection when fetching is aborted', () => {
      const state = reducer(undefined, fetchCurrentCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);

      const newState = reducer(state, abortFetchCurrentCollection());
      expect(newState.current.loading).toEqual(false);
      expect(newState.current.id).toEqual(null);
    });

    it('preserves collection data when fetching is aborted', () => {
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      let state = reducer(undefined, loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: firstCollection,
      }));

      state = reducer(state, loadCurrentCollection({
        addons: createFakeCollectionAddons(),
        detail: secondCollection,
      }));

      state = reducer(state, abortFetchCurrentCollection());

      // Make sure collection data still exists.
      expect(state.byId[firstCollection.id]).toBeDefined();
      expect(state.byId[secondCollection.id]).toBeDefined();
      expect(state.current.loading).toEqual(false);
      expect(state.current.id).toEqual(null);
    });

    it('sets a loading flag when fetching user collections', () => {
      const userId = 321;

      const state = reducer(undefined, fetchUserCollections({
        errorHandlerId: 'some-error-id',
        userId,
      }));

      const userState = state.userCollections[userId];
      expect(userState).toBeDefined();
      expect(userState.loading).toEqual(true);
      expect(userState.collections).toEqual(null);
    });

    it('aborts fetching a user collection', () => {
      const userId = 321;

      let state = reducer(undefined, fetchUserCollections({
        errorHandlerId: 'some-error-id',
        userId,
      }));

      state = reducer(state, abortFetchUserCollections({ userId }));

      const userState = state.userCollections[userId];
      expect(userState.loading).toEqual(false);
      expect(userState.collections).toEqual(null);
    });

    it('loads user collections by ID', () => {
      const userId = 321;
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      const state = reducer(undefined, loadUserCollections({
        userId, collections: [firstCollection, secondCollection],
      }));

      const userState = state.userCollections[userId];
      expect(userState.loading).toEqual(false);
      expect(userState.collections).toEqual([1, 2]);

      expect(state.byId[userState.collections[0]])
        .toEqual(createInternalCollection({ detail: firstCollection }));
      expect(state.byId[userState.collections[1]])
        .toEqual(createInternalCollection({ detail: secondCollection }));
    });

    it('loads user collections by slug', () => {
      const userId = 321;
      const collection = createFakeCollectionDetail({ id: 1 });

      const state = reducer(undefined, loadUserCollections({
        userId, collections: [collection],
      }));

      const userState = state.userCollections[userId];
      expect(userState.collections).toEqual([1]);

      expect(state.bySlug[collection.slug]).toEqual(collection.id);
    });

    it('sets a loading flag when begining user addon collections work', () => {
      const addonId = 871;
      const userId = 321;

      const state = reducer(undefined, beginUserAddonCollectionsWork({
        addonId, userId,
      }));

      const savedState = state.userAddonCollections[userId][addonId];
      expect(savedState).toBeDefined();
      expect(savedState.loading).toEqual(true);
      expect(savedState.collections).toEqual(null);
    });

    it('aborts user addon collections work', () => {
      const addonId = 721;
      const userId = 321;

      let state = reducer(undefined, fetchUserAddonCollections({
        addonId, userId, errorHandlerId: 'some-error-id',
      }));

      state = reducer(state,
        abortUserAddonCollectionsWork({ addonId, userId })
      );

      const savedState = state.userAddonCollections[userId][addonId];
      expect(savedState.loading).toEqual(false);
      expect(savedState.collections).toEqual(null);
    });

    it('loads user collections by add-on', () => {
      const addonId = 611;
      const userId = 321;
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      const state = reducer(undefined, loadUserAddonCollections({
        userId, addonId, collections: [firstCollection, secondCollection],
      }));

      const savedState = state.userAddonCollections[userId][addonId];
      expect(savedState.loading).toEqual(false);
      expect(savedState.collections).toEqual([1, 2]);

      // Also make sure the collections were loaded into state.
      expect(state.byId[savedState.collections[0]])
        .toEqual(createInternalCollection({ detail: firstCollection }));
      expect(state.byId[savedState.collections[1]])
        .toEqual(createInternalCollection({ detail: secondCollection }));
    });
  });

  describe('loadCollectionIntoState', () => {
    it('preserves existing collection addons', () => {
      const addons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 1 }],
      });
      const collection = createFakeCollectionDetail({
        id: 1, addons,
      });

      let state = loadCollectionIntoState({
        state: initialState, collection, addons: addons.results,
      });

      // Simulate loading it a second time but without addons.
      state = loadCollectionIntoState({ state, collection });

      const collectionInState = state.byId[collection.id];
      expect(collectionInState.addons)
        .toEqual(createInternalAddons(addons.results));
    });
  });

  describe('fetchCurrentCollection()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      slug: 'some-collection-slug',
      user: 'some-user-id-or-name',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchCurrentCollection(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when slug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.slug;

      expect(() => {
        fetchCurrentCollection(partialParams);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.user;

      expect(() => {
        fetchCurrentCollection(partialParams);
      }).toThrow('user is required');
    });
  });

  describe('fetchUserCollections', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      userId: 1,
    };

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => fetchUserCollections(params))
        .toThrow(/userId is required/);
    });

    it('throws an error when errorHandlerId is missing', () => {
      const params = { ...defaultParams };
      delete params.errorHandlerId;

      expect(() => fetchUserCollections(params))
        .toThrow(/errorHandlerId is required/);
    });
  });

  describe('abortFetchUserCollections', () => {
    const defaultParams = {
      userId: 1,
    };

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => abortFetchUserCollections(params))
        .toThrow(/userId is required/);
    });
  });

  describe('fetchUserAddonCollections', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      userId: 1,
      addonId: 2,
    };

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => fetchUserAddonCollections(params))
        .toThrow(/userId is required/);
    });

    it('throws an error when addonId is missing', () => {
      const params = { ...defaultParams };
      delete params.addonId;

      expect(() => fetchUserAddonCollections(params))
        .toThrow(/addonId is required/);
    });

    it('throws an error when errorHandlerId is missing', () => {
      const params = { ...defaultParams };
      delete params.errorHandlerId;

      expect(() => fetchUserAddonCollections(params))
        .toThrow(/errorHandlerId is required/);
    });
  });

  describe('beginUserAddonCollectionsWork', () => {
    const defaultParams = {
      userId: 1,
      addonId: 2,
    };

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => beginUserAddonCollectionsWork(params))
        .toThrow(/userId is required/);
    });

    it('throws an error when addonId is missing', () => {
      const params = { ...defaultParams };
      delete params.addonId;

      expect(() => beginUserAddonCollectionsWork(params))
        .toThrow(/addonId is required/);
    });
  });

  describe('abortUserAddonCollectionsWork', () => {
    const defaultParams = {
      userId: 1,
      addonId: 2,
    };

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => abortUserAddonCollectionsWork(params))
        .toThrow(/userId is required/);
    });

    it('throws an error when addonId is missing', () => {
      const params = { ...defaultParams };
      delete params.addonId;

      expect(() => abortUserAddonCollectionsWork(params))
        .toThrow(/addonId is required/);
    });
  });

  describe('loadUserCollections', () => {
    const defaultParams = {
      userId: 4321,
      collections: [createFakeCollectionDetail()],
    };

    it('throws an error when collections is missing', () => {
      const params = { ...defaultParams };
      delete params.collections;

      expect(() => loadUserCollections(params))
        .toThrow(/collections parameter is required/);
    });

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => loadUserCollections(params))
        .toThrow(/userId parameter is required/);
    });
  });

  describe('loadUserAddonCollections', () => {
    const defaultParams = {
      addonId: 2221,
      userId: 4321,
      collections: [createFakeCollectionDetail()],
    };

    it('throws an error when collections is missing', () => {
      const params = { ...defaultParams };
      delete params.collections;

      expect(() => loadUserAddonCollections(params))
        .toThrow(/collections parameter is required/);
    });

    it('throws an error when userId is missing', () => {
      const params = { ...defaultParams };
      delete params.userId;

      expect(() => loadUserAddonCollections(params))
        .toThrow(/userId parameter is required/);
    });

    it('throws an error when addonId is missing', () => {
      const params = { ...defaultParams };
      delete params.addonId;

      expect(() => loadUserAddonCollections(params))
        .toThrow(/addonId parameter is required/);
    });
  });

  describe('loadCurrentCollection()', () => {
    const defaultParams = {
      addons: createFakeCollectionAddons(),
      detail: createFakeCollectionDetail(),
    };

    it('throws an error when addons are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.addons;

      expect(() => {
        loadCurrentCollection(partialParams);
      }).toThrow('addons are required');
    });

    it('throws an error when detail is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.detail;

      expect(() => {
        loadCurrentCollection(partialParams);
      }).toThrow('detail is required');
    });
  });

  describe('fetchCurrentCollectionPage()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      page: 123,
      slug: 'some-collection-slug',
      user: 'some-user-id-or-name',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchCurrentCollectionPage(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when slug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.slug;

      expect(() => {
        fetchCurrentCollectionPage(partialParams);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.user;

      expect(() => {
        fetchCurrentCollectionPage(partialParams);
      }).toThrow('user is required');
    });

    it('throws an error when page is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.page;

      expect(() => {
        fetchCurrentCollectionPage(partialParams);
      }).toThrow('page is required');
    });
  });

  describe('loadCurrentCollectionPage()', () => {
    it('throws an error when addons are missing', () => {
      expect(() => {
        loadCurrentCollectionPage();
      }).toThrow('addons are required');
    });
  });

  describe('getCollectionById', () => {
    const getParams = (params = {}) => {
      return { state: initialState, id: 4321, ...params };
    };

    it('requires a state parameter', () => {
      const params = getParams();
      delete params.state;

      expect(() => getCollectionById(params))
        .toThrow(/state parameter is required/);
    });

    it('requires an id parameter', () => {
      const params = getParams();
      delete params.id;

      expect(() => getCollectionById(params))
        .toThrow(/id parameter is required/);
    });

    it('returns a collection', () => {
      const id = 45321;
      const addons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail({ id });
      const internalCollection = createInternalCollection({
        items: addons.results, detail: collectionDetail,
      });

      const state = reducer(undefined, loadCurrentCollection({
        addons, detail: collectionDetail,
      }));

      expect(getCollectionById(getParams({ id, state })))
        .toEqual(internalCollection);
    });

    it('returns null when the collection does not exist', () => {
      // No collection has been loaded into state.
      expect(getCollectionById(getParams({ id: 3333 }))).toEqual(null);
    });
  });

  describe('getCurrentCollection', () => {
    it('requires the state parameter', () => {
      expect(() => getCurrentCollection())
        .toThrow(/state parameter is required/);
    });

    it('returns null if the current collection does not exist', () => {
      expect(getCurrentCollection(initialState)).toEqual(null);
    });

    it('returns the current collection', () => {
      const id = 45321;
      const addons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail({ id });
      const internalCollection = createInternalCollection({
        items: addons.results, detail: collectionDetail,
      });

      const state = reducer(undefined, loadCurrentCollection({
        addons, detail: collectionDetail,
      }));

      expect(getCurrentCollection(state)).toEqual(internalCollection);
    });
  });

  describe('addAddonToCollection', () => {
    const getParams = () => {
      return {
        addonId: 123,
        collectionSlug: 'my-collection',
        errorHandlerId: 'some-error-handler',
        userId: 654,
      };
    };

    it('requires an addonId', () => {
      const params = getParams();
      delete params.addonId;

      expect(() => addAddonToCollection(params))
        .toThrow(/addonId parameter is required/);
    });

    it('requires a collectionSlug', () => {
      const params = getParams();
      delete params.collectionSlug;

      expect(() => addAddonToCollection(params))
        .toThrow(/collectionSlug parameter is required/);
    });

    it('requires an errorHandlerId', () => {
      const params = getParams();
      delete params.errorHandlerId;

      expect(() => addAddonToCollection(params))
        .toThrow(/errorHandlerId parameter is required/);
    });

    it('requires a userId', () => {
      const params = getParams();
      delete params.userId;

      expect(() => addAddonToCollection(params))
        .toThrow(/userId parameter is required/);
    });
  });

  describe('loadCollectionAddons', () => {
    const getParams = (params = {}) => {
      return {
        addons: createFakeCollectionAddons().results,
        collectionSlug: 'my-collection',
        ...params,
      };
    };

    it('loads collection add-ons', () => {
      const addons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 1 }],
      });
      const collectionDetail = createFakeCollectionDetail();

      // Load a collection with add-ons.
      let state = reducer(undefined, loadCurrentCollection({
        addons, detail: collectionDetail,
      }));

      // Load new add-ons for the collection.
      const newAddons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 2 }],
      });
      state = reducer(state, loadCollectionAddons({
        addons: newAddons.results,
        collectionSlug: collectionDetail.slug,
      }));

      expect(state.byId[collectionDetail.id].addons)
        .toEqual(createInternalAddons(newAddons.results));
    });

    it('requires a loaded collection first', () => {
      const addons = createFakeCollectionAddons().results;
      expect(() => {
        reducer(undefined, loadCollectionAddons({
          addons,
          // This collection has not been loaded into state yet.
          collectionSlug: 'a-collection',
        }));
      })
        .toThrow(/Cannot load add-ons for collection/);
    });

    it('requires an addons parameter', () => {
      const params = getParams();
      delete params.addons;

      expect(() => loadCollectionAddons(params))
        .toThrow(/addons parameter is required/);
    });

    it('requires a collectionId parameter', () => {
      const params = getParams();
      delete params.collectionSlug;

      expect(() => loadCollectionAddons(params))
        .toThrow(/collectionSlug parameter is required/);
    });
  });
});
