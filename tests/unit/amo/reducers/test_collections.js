import reducer, {
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addAddonToCollection,
  addonAddedToCollection,
  addonRemovedFromCollection,
  beginCollectionModification,
  beginEditingCollectionDetails,
  collectionEditUrl,
  collectionUrl,
  convertFiltersToQueryParams,
  createCollection,
  createInternalAddons,
  createInternalCollection,
  deleteCollection,
  expandCollections,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserCollections,
  finishCollectionModification,
  finishEditingCollectionDetails,
  getCollectionById,
  getCurrentCollection,
  initialState,
  loadCollectionAddons,
  loadCollectionIntoState,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  localizeCollectionDetail,
  removeAddonFromCollection,
  unloadCollectionBySlug,
  updateCollection,
} from 'amo/reducers/collections';
import { DEFAULT_API_PAGE_SIZE } from 'core/api';
import { COLLECTION_SORT_NAME } from 'core/constants';
import {
  createFakeCollectionAddon,
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  createStubErrorHandler,
  fakeAddon,
} from 'tests/unit/helpers';

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
      const state = reducer(
        undefined,
        fetchCurrentCollection({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-collection-slug',
          userId: 'some-user',
        }),
      );

      expect(state.current.loading).toEqual(true);
      expect(state.current.id).toEqual(null);
    });

    it('sets a loading flag when fetching a collection page', () => {
      const state = reducer(
        undefined,
        fetchCurrentCollectionPage({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-collection-slug',
          userId: 'some-user',
        }),
      );

      expect(state.current.loading).toEqual(true);
    });

    it('resets add-ons when fetching a collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        fetchCurrentCollectionPage({
          errorHandlerId: createStubErrorHandler().id,
          slug: collectionDetail.slug,
          userId: 'some-user',
        }),
      );

      expect(getCurrentCollection(state).addons).toEqual([]);
    });

    it('loads a collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      const state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      const loadedCollection = getCurrentCollection(state);

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection).toEqual(
        createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );
      expect(state.current.loading).toEqual(false);
    });

    it('resets the current collection when fetching a new collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      // 2. User navigates to another collection.
      state = reducer(
        state,
        fetchCurrentCollection({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-collection-slug',
          userId: 'some-user',
        }),
      );

      expect(state.current.loading).toEqual(true);
      expect(state.current.id).toEqual(null);
    });

    it('resets the add-ons when fetching a new collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      // 2. User clicks the "next" pagination link.
      state = reducer(
        state,
        fetchCurrentCollectionPage({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-collection-slug',
          userId: 'some-user',
        }),
      );

      expect(state.current.loading).toEqual(true);
      expect(getCurrentCollection(state)).toEqual({
        ...createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons.results,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
        addons: [],
      });
    });

    it('cannot load collection page without a current collection', () => {
      const addons = createFakeCollectionAddons();

      expect(() =>
        reducer(
          undefined,
          loadCurrentCollectionPage({
            addons,
            numberOfAddons: 5,
            pageSize: DEFAULT_API_PAGE_SIZE,
          }),
        ),
      ).toThrow(/current collection does not exist/);
    });

    it('loads a collection page', () => {
      const notes = 'These are some notes';
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      const fakeCollectionAddon = createFakeCollectionAddon({
        addon: { ...fakeAddon, id: 333 },
        notes,
      });
      const newAddons = createFakeCollectionAddons({
        addons: [fakeCollectionAddon],
      });
      state = reducer(
        state,
        loadCurrentCollectionPage({
          addons: newAddons,
          numberOfAddons: 5,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      const loadedCollection = getCurrentCollection(state);

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection.addons).toEqual(createInternalAddons(newAddons));
      expect(loadedCollection.numberOfAddons).toEqual(5);
      expect(state.current.loading).toEqual(false);
      expect(loadedCollection.addons[0].notes).toEqual(notes);
    });

    it('resets the current collection when fetching is aborted', () => {
      const state = reducer(
        undefined,
        fetchCurrentCollection({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-collection-slug',
          userId: 'some-user',
        }),
      );

      expect(state.current.loading).toEqual(true);

      const newState = reducer(state, abortFetchCurrentCollection());
      expect(newState.current.loading).toEqual(false);
      expect(newState.current.id).toEqual(null);
    });

    it('preserves collection data when fetching is aborted', () => {
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: createFakeCollectionAddons(),
          detail: firstCollection,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      state = reducer(
        state,
        loadCurrentCollection({
          addons: createFakeCollectionAddons(),
          detail: secondCollection,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      state = reducer(state, abortFetchCurrentCollection());

      // Make sure collection data still exists.
      expect(state.byId[firstCollection.id]).toBeDefined();
      expect(state.byId[secondCollection.id]).toBeDefined();
      expect(state.current.loading).toEqual(false);
      expect(state.current.id).toEqual(null);
    });

    it('sets a loading flag when fetching user collections', () => {
      const username = 'some-user';

      const state = reducer(
        undefined,
        fetchUserCollections({
          errorHandlerId: 'some-error-id',
          userId: username,
        }),
      );

      const userState = state.userCollections[username];
      expect(userState).toBeDefined();
      expect(userState.loading).toEqual(true);
      expect(userState.collections).toEqual(null);
    });

    it('aborts fetching a user collection', () => {
      const username = 'some-user';

      let state = reducer(
        undefined,
        fetchUserCollections({
          errorHandlerId: 'some-error-id',
          userId: username,
        }),
      );

      state = reducer(state, abortFetchUserCollections({ userId: username }));

      const userState = state.userCollections[username];
      expect(userState.loading).toEqual(false);
      expect(userState.collections).toEqual(null);
    });

    it('loads user collections by ID', () => {
      const username = 'some-user';
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      const state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [firstCollection, secondCollection],
        }),
      );

      const userState = state.userCollections[username];
      expect(userState.loading).toEqual(false);
      expect(userState.collections).toEqual([1, 2]);

      expect(state.byId[userState.collections[0]]).toEqual(
        createInternalCollection({
          detail: firstCollection,
          pageSize: null,
        }),
      );
      expect(state.byId[userState.collections[1]]).toEqual(
        createInternalCollection({
          detail: secondCollection,
          pageSize: null,
        }),
      );
    });

    it('loads user collections by slug', () => {
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      const state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [collection],
        }),
      );

      const userState = state.userCollections[username];
      expect(userState.collections).toEqual([1]);

      expect(state.bySlug[collection.slug]).toEqual(collection.id);
    });

    it('unloads user collections after creating', () => {
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      let state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [collection],
        }),
      );

      expect(state.userCollections[username].collections).toEqual([1]);

      state = reducer(
        state,
        createCollection({
          errorHandlerId: createStubErrorHandler().id,
          name: 'some-collection',
          slug: 'some-slug',
          userId: username,
        }),
      );

      expect(state.userCollections[username].collections).toEqual(null);
    });

    it('unloads user collections after updating', () => {
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      let state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [collection],
        }),
      );

      expect(state.userCollections[username].collections).toEqual([1]);

      state = reducer(
        state,
        updateCollection({
          collectionSlug: 'some-slug',
          errorHandlerId: createStubErrorHandler().id,
          filters: {},
          name: 'some-collection',
          userId: username,
        }),
      );

      expect(state.userCollections[username].collections).toEqual(null);
    });

    it('unloads user collections after deleting', () => {
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      let state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [collection],
        }),
      );

      expect(state.userCollections[username].collections).toEqual([1]);

      state = reducer(
        state,
        deleteCollection({
          errorHandlerId: createStubErrorHandler().id,
          slug: 'some-slug',
          userId: username,
        }),
      );

      expect(state.userCollections[username].collections).toEqual(null);
    });

    it('sets a loading flag when begining to add add-on to collection', () => {
      const addonId = 871;
      const username = 'some-user';

      const state = reducer(
        undefined,
        addAddonToCollection({
          addonId,
          userId: username,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

      const savedState = state.addonInCollections[username][addonId];
      expect(savedState).toBeDefined();
      expect(savedState.loading).toEqual(true);
      expect(savedState.collections).toEqual(null);
    });

    it('unsets a hasAddonBeenAdded flag when beginning to add add-on to collection', () => {
      const addonId = 1;
      const collectionId = 2;
      const username = 'some-user';

      let state = reducer(
        undefined,
        addonAddedToCollection({
          addonId,
          collectionId,
          userId: username,
        }),
      );

      state = reducer(
        state,
        addAddonToCollection({
          addonId,
          collectionId,
          errorHandlerId: 'error-handler',
          slug: 'some-collection',
          userId: 'some-user',
        }),
      );

      expect(state.hasAddonBeenAdded).toEqual(false);
    });

    it('unsets a hasAddonBeenRemoved flag when beginning to remove an add-on from a collection', () => {
      let state = reducer(undefined, addonRemovedFromCollection());

      state = reducer(
        state,
        removeAddonFromCollection({
          addonId: 1,
          collectionId: 3,
          errorHandlerId: 'error-handler',
          filters: {},
          slug: 'some-collection',
          userId: 'some-user',
        }),
      );

      expect(state.hasAddonBeenRemoved).toEqual(false);
    });

    it('preserves existing collections when adding new ones', () => {
      const addonId = 871;
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      // Add an add-on to a collection
      let state = reducer(
        undefined,
        addonAddedToCollection({
          userId: username,
          addonId,
          collectionId: collection.id,
        }),
      );

      state = reducer(
        state,
        addAddonToCollection({
          addonId,
          userId: username,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

      const savedState = state.addonInCollections[username][addonId];
      // The old collections should be preserved.
      expect(savedState.collections).toEqual([collection.id]);
    });

    it('aborts adding an add-on to a collection', () => {
      const addonId = 721;
      const username = 'some-user';

      // Begin adding the add-on to a new collection.
      let state = reducer(
        undefined,
        addAddonToCollection({
          addonId,
          userId: username,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

      state = reducer(
        state,
        abortAddAddonToCollection({ addonId, userId: username }),
      );

      const savedState = state.addonInCollections[username][addonId];
      expect(savedState.collections).toEqual(null);
      expect(savedState.loading).toEqual(false);
      expect(state.hasAddonBeenAdded).toEqual(false);
    });

    it('preserves collection data when aborting new additions', () => {
      const addonId = 721;
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      // Add an add-on to a collection
      let state = reducer(
        undefined,
        addonAddedToCollection({
          userId: username,
          addonId,
          collectionId: collection.id,
        }),
      );

      // Begin adding the add-on to a new collection.
      state = reducer(
        state,
        addAddonToCollection({
          addonId,
          userId: username,
          collectionId: 321,
          slug: 'some-collection',
          errorHandlerId: 'error-handler',
        }),
      );

      state = reducer(
        state,
        abortAddAddonToCollection({ addonId, userId: username }),
      );

      const savedState = state.addonInCollections[username][addonId];
      // The old collections should be preserved.
      expect(savedState.collections).toEqual([collection.id]);
    });

    it('adds an add-on to a collection', () => {
      const addonId = 611;
      const username = 'some-user';
      const collection = createFakeCollectionDetail({ id: 1 });

      const state = reducer(
        undefined,
        addonAddedToCollection({
          userId: username,
          addonId,
          collectionId: collection.id,
        }),
      );

      const savedState = state.addonInCollections[username][addonId];
      expect(savedState.loading).toEqual(false);
      expect(savedState.collections).toEqual([collection.id]);
    });

    it('sets a hasAddonBeenAdded flag after an add-on has been added', () => {
      const state = reducer(
        undefined,
        addonAddedToCollection({
          userId: 'some-user',
          addonId: 2,
          collectionId: 3,
        }),
      );

      expect(state.hasAddonBeenAdded).toEqual(true);
    });

    it('sets a hasAddonBeenRemoved flag after an add-on has been removed', () => {
      const state = reducer(undefined, addonRemovedFromCollection());

      expect(state.hasAddonBeenRemoved).toEqual(true);
    });

    it('appends a new add-on to the list of its collections', () => {
      const addonId = 611;
      const username = 'some-user';
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      let state = reducer(
        undefined,
        addonAddedToCollection({
          userId: username,
          addonId,
          collectionId: firstCollection.id,
        }),
      );
      state = reducer(
        state,
        addonAddedToCollection({
          userId: username,
          addonId,
          collectionId: secondCollection.id,
        }),
      );

      const savedState = state.addonInCollections[username][addonId];
      expect(savedState.collections).toEqual([
        firstCollection.id,
        secondCollection.id,
      ]);
    });

    it('records the beginning of editing collection details', () => {
      const state = reducer(initialState, beginEditingCollectionDetails());

      expect(state.editingCollectionDetails).toEqual(true);
    });

    it('records the end of editing collection details', () => {
      const state = reducer(initialState, finishEditingCollectionDetails());

      expect(state.editingCollectionDetails).toEqual(false);
    });
  });

  describe('loadCollectionIntoState', () => {
    it('preserves existing collection addons', () => {
      const fakePageSize = 5;
      const fakeCollectionAddon = createFakeCollectionAddon({
        addon: { ...fakeAddon, id: 1 },
      });
      const addons = createFakeCollectionAddons({
        addons: [fakeCollectionAddon],
      });
      const collection = createFakeCollectionDetail({
        id: 1,
        addons,
      });

      let state = loadCollectionIntoState({
        state: initialState,
        collection,
        addons,
        pageSize: fakePageSize,
      });

      // Simulate loading it a second time but without addons.
      state = loadCollectionIntoState({ state, collection });

      const collectionInState = state.byId[collection.id];
      expect(collectionInState.addons).toEqual(createInternalAddons(addons));
      expect(collectionInState.pageSize).toEqual(fakePageSize);
    });

    it('loads notes for collection add-ons', () => {
      const notes = 'These are some notes.';
      const fakeCollectionAddon = createFakeCollectionAddon({ notes });
      const addons = createFakeCollectionAddons({
        addons: [fakeCollectionAddon],
      });
      const collection = createFakeCollectionDetail({ addons });

      const state = loadCollectionIntoState({
        state: initialState,
        collection,
        addons,
      });

      const collectionInState = state.byId[collection.id];
      expect(collectionInState.addons[0].notes).toEqual(notes);
    });
  });

  describe('getCollectionById', () => {
    const getParams = (params = {}) => {
      return { state: initialState, id: 4321, ...params };
    };

    it('returns a collection', () => {
      const id = 45321;
      const addons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail({ id });
      const internalCollection = createInternalCollection({
        items: addons,
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      });

      const state = reducer(
        undefined,
        loadCurrentCollection({
          addons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      expect(getCollectionById(getParams({ id, state }))).toEqual(
        internalCollection,
      );
    });

    it('returns null when the collection does not exist', () => {
      // No collection has been loaded into state.
      expect(getCollectionById(getParams({ id: 3333 }))).toEqual(null);
    });
  });

  describe('getCurrentCollection', () => {
    it('returns null if the current collection does not exist', () => {
      expect(getCurrentCollection(initialState)).toEqual(null);
    });

    it('returns the current collection', () => {
      const id = 45321;
      const addons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail({ id });
      const internalCollection = createInternalCollection({
        items: addons,
        detail: collectionDetail,
        pageSize: DEFAULT_API_PAGE_SIZE,
      });

      const state = reducer(
        undefined,
        loadCurrentCollection({
          addons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      expect(getCurrentCollection(state)).toEqual(internalCollection);
    });
  });

  describe('loadCollectionAddons', () => {
    const getParams = (params = {}) => {
      return {
        addons: createFakeCollectionAddons(),
        slug: 'my-collection',
        ...params,
      };
    };

    it('loads collection add-ons', () => {
      const notes = 'These are some notes.';
      const fakeCollectionAddon = createFakeCollectionAddon({
        addon: { ...fakeAddon, id: 1 },
      });
      const addons = createFakeCollectionAddons({
        addons: [fakeCollectionAddon],
      });
      const collectionDetail = createFakeCollectionDetail();

      // Load a collection with add-ons.
      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      // Load new add-ons for the collection.
      const newFakeCollectionAddon = createFakeCollectionAddon({
        addon: { ...fakeAddon, id: 2 },
        notes,
      });
      const newAddons = createFakeCollectionAddons({
        addons: [newFakeCollectionAddon],
      });
      state = reducer(
        state,
        loadCollectionAddons({
          addons: newAddons,
          slug: collectionDetail.slug,
        }),
      );

      expect(state.byId[collectionDetail.id].addons).toEqual(
        createInternalAddons(newAddons),
      );
      expect(state.byId[collectionDetail.id].addons[0].notes).toEqual(notes);
    });

    it('requires a loaded collection first', () => {
      const addons = createFakeCollectionAddons();
      expect(() => {
        reducer(
          undefined,
          loadCollectionAddons({
            addons,
            // This collection has not been loaded into state yet.
            slug: 'a-collection',
          }),
        );
      }).toThrow(/Cannot load add-ons for collection/);
    });

    it('requires an addons parameter', () => {
      const params = getParams();
      delete params.addons;

      expect(() => loadCollectionAddons(params)).toThrow(
        /addons parameter is required/,
      );
    });

    it('requires a collectionId parameter', () => {
      const params = getParams();
      delete params.slug;

      expect(() => loadCollectionAddons(params)).toThrow(
        /slug parameter is required/,
      );
    });
  });

  describe('beginCollectionModification', () => {
    it('records the beginning of a modification', () => {
      const state = reducer(initialState, beginCollectionModification());

      expect(state.isCollectionBeingModified).toEqual(true);
    });
  });

  describe('finishCollectionModification', () => {
    it('records the end of a modification', () => {
      const state = reducer(initialState, finishCollectionModification());

      expect(state.isCollectionBeingModified).toEqual(false);
    });
  });

  describe('unloadCollectionBySlug', () => {
    it('requires a slug', () => {
      expect(() => unloadCollectionBySlug()).toThrow(/slug is required/);
    });

    it('does nothing when no collection exists', () => {
      const state = reducer(undefined, unloadCollectionBySlug('a-slug'));

      expect(state.byId).toEqual(initialState.byId);
    });

    it('deletes a collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      let state = reducer(
        undefined,
        loadCurrentCollection({
          addons: collectionAddons,
          detail: collectionDetail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      state = reducer(state, unloadCollectionBySlug(collectionDetail.slug));

      expect(state.byId[collectionDetail.id]).toBeUndefined();
    });

    it('preserves other collections', () => {
      let state;

      const collection1Addons = createFakeCollectionAddons();
      const collection1Detail = createFakeCollectionDetail();
      state = reducer(
        state,
        loadCurrentCollection({
          addons: collection1Addons,
          detail: collection1Detail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      const collection2Addons = createFakeCollectionAddons();
      const collection2Detail = createFakeCollectionDetail();
      state = reducer(
        state,
        loadCurrentCollection({
          addons: collection2Addons,
          detail: collection2Detail,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );

      const action = unloadCollectionBySlug(collection2Detail.slug);
      state = reducer(state, action);

      expect(state.byId[collection1Detail.id]).toEqual(
        createInternalCollection({
          detail: collection1Detail,
          items: collection1Addons,
          pageSize: DEFAULT_API_PAGE_SIZE,
        }),
      );
    });
  });

  describe('localizeCollectionDetail', () => {
    it('localizes collection detail', () => {
      const lang = 'en-US';
      const collectionDetail = createFakeCollectionDetail();
      const collectionDetailWithLocalizedStrings = {
        ...collectionDetail,
        description: { [lang]: collectionDetail.description },
        name: { [lang]: collectionDetail.name },
      };
      const localizedDetail = localizeCollectionDetail({
        detail: collectionDetailWithLocalizedStrings,
        lang,
      });

      expect(localizedDetail).toEqual(collectionDetail);
    });
  });

  describe('expandCollections', () => {
    const username = 'some-username';

    it('returns null if there is no meta passed', () => {
      const state = reducer(undefined, {});

      expect(expandCollections(state)).toEqual(null);
    });

    it('returns null if there is no collections key in meta', () => {
      const state = reducer(undefined, {});
      const meta = {};

      expect(expandCollections(state, meta)).toEqual(null);
    });

    it('returns collection objects when ids are passed in via meta.collections', () => {
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });
      const meta = {
        collections: [firstCollection.id, secondCollection.id],
      };

      const state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [firstCollection, secondCollection],
        }),
      );

      const collections = expandCollections(state, meta);
      expect(collections.length).toEqual(2);
      expect(collections[0]).toEqual(
        createInternalCollection({
          detail: firstCollection,
          pageSize: null,
        }),
      );
      expect(collections[1]).toEqual(
        createInternalCollection({
          detail: secondCollection,
          pageSize: null,
        }),
      );
    });

    it('skips unloaded collections', () => {
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });
      const meta = {
        collections: [firstCollection.id, secondCollection.id],
      };

      const state = reducer(
        undefined,
        loadUserCollections({
          userId: username,
          collections: [firstCollection],
        }),
      );

      const collections = expandCollections(state, meta);
      expect(collections.length).toEqual(1);
      expect(collections[0]).toEqual(
        createInternalCollection({
          detail: firstCollection,
          pageSize: null,
        }),
      );
    });
  });

  describe('convertFiltersToQueryParams', () => {
    it('returns expected query params from filters', () => {
      const page = 1;
      const sort = COLLECTION_SORT_NAME;

      expect(
        convertFiltersToQueryParams({ collectionSort: sort, page }),
      ).toEqual({ collection_sort: sort, page });
    });
  });

  describe('collectionUrl', () => {
    it('returns a URL for a collection', () => {
      const authorId = 123;
      const slug = 'some-slug';
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({ authorId, slug }),
      });

      expect(collectionUrl({ collection })).toEqual(
        `/collections/${authorId}/${slug}/`,
      );
    });

    it('returns a URL for an authorId / collectionSlug', () => {
      const authorId = 345;
      const slug = 'some-slug';

      expect(
        collectionUrl({
          authorId,
          collection: null,
          collectionSlug: slug,
        }),
      ).toEqual(`/collections/${authorId}/${slug}/`);
    });

    it('returns a URL for the collection when all 3 params are passed', () => {
      const authorId = 1;
      const slug = 'some-slug';
      const collection = createInternalCollection({
        detail: createFakeCollectionDetail({ authorId, slug }),
      });

      expect(
        collectionUrl({
          authorId: authorId + 1000,
          collection,
          collectionSlug: 'a-different-slug',
        }),
      ).toEqual(`/collections/${authorId}/${slug}/`);
    });
  });

  describe('collectionEditUrl', () => {
    it('calls collectionUrl and appends `edit/` to it', () => {
      const _collectionUrl = sinon.spy(() => '/base/url/');
      const params = {
        authorId: 123,
        collection: null,
        collectionSlug: 'some-slug',
      };

      expect(collectionEditUrl({ ...params, _collectionUrl })).toEqual(
        '/base/url/edit/',
      );
      sinon.assert.calledWith(_collectionUrl, { ...params });
    });
  });

  describe('createInternalCollection', () => {
    it('prevents the name to be `null`', () => {
      const detail = createFakeCollectionDetail({ name: null });

      expect(createInternalCollection({ detail })).toHaveProperty('name', '');
    });
  });
});
