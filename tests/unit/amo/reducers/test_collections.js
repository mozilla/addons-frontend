import reducer, {
  abortFetchCollection,
  createInternalAddons,
  createInternalCollection,
  fetchCollection,
  fetchCollectionPage,
  initialState,
  loadCollection,
  loadCollectionPage,
} from 'amo/reducers/collections';
import { parsePage } from 'core/utils';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
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
      const { store } = dispatchClientMetadata();

      store.dispatch(fetchCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const collectionsState = store.getState().collections;
      expect(collectionsState.current.loading).toEqual(true);
      expect(collectionsState.current.id).toEqual(null);
    });

    it('sets a loading flag when fetching a collection page', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(fetchCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const state = store.getState().collections;
      expect(state.current.loading).toEqual(true);
    });

    it('resets add-ons when fetching a collection page', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      store.dispatch(fetchCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: collectionDetail.slug,
        user: 'some-user-id-or-name',
      }));

      const state = store.getState().collections;
      const collection = state.byId[state.current.id];
      expect(collection.addons).toEqual([]);
    });

    it('loads a collection', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const state = store.getState().collections;
      const loadedCollection = state.byId[state.current.id];

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection).toEqual(createInternalCollection({
        detail: collectionDetail,
        items: collectionAddons.results,
      }));
      expect(state.current.loading).toEqual(false);
    });

    it('resets the current collection when fetching a new collection', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User navigates to another collection.
      store.dispatch(fetchCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const collectionsState = store.getState().collections;

      expect(collectionsState.current.loading).toEqual(true);
      expect(collectionsState.current.id).toEqual(null);
    });

    it('resets the add-ons when fetching a new collection page', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User clicks the "next" pagination link.
      store.dispatch(fetchCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const state = store.getState().collections;

      expect(state.current.loading).toEqual(true);
      const collection = state.byId[state.current.id];
      expect(collection).toEqual({
        ...createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons.results,
        }),
        addons: [],
      });
    });

    it('cannot load collection page without a current collection', () => {
      // TODO: use the reducer directly instead of the entire store
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();

      expect(() => {
        store.dispatch(loadCollectionPage({ addons: collectionAddons }));
      }).toThrow(/current collection does not exist/);
    });

    it('loads a collection page', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // Load a current collection.
      // TODO: rename to loadCurrentCollection()
      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const newAddons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 333 }],
      });
      store.dispatch(loadCollectionPage({ addons: newAddons }));

      const state = store.getState().collections;
      const loadedCollection = state.byId[state.current.id];

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection.addons)
        .toEqual(createInternalAddons(newAddons.results));
      expect(state.current.loading).toEqual(false);
    });

    it('resets the current collection when fetching is aborted', () => {
      const state = reducer(undefined, fetchCollection({
        errorHandlerId: createStubErrorHandler().id,
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.current.loading).toEqual(true);

      const newState = reducer(state, abortFetchCollection());
      expect(newState.current.loading).toEqual(false);
      expect(newState.current.id).toEqual(null);
    });
  });

  describe('fetchCollection()', () => {
    const defaultParams = {
      errorHandlerId: 'some-error-handler-id',
      slug: 'some-collection-slug',
      user: 'some-user-id-or-name',
    };

    it('throws an error when errorHandlerId is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.errorHandlerId;

      expect(() => {
        fetchCollection(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when slug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.slug;

      expect(() => {
        fetchCollection(partialParams);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.user;

      expect(() => {
        fetchCollection(partialParams);
      }).toThrow('user is required');
    });
  });

  describe('loadCollection()', () => {
    const defaultParams = {
      addons: createFakeCollectionAddons(),
      detail: createFakeCollectionDetail(),
    };

    it('throws an error when addons are missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.addons;

      expect(() => {
        loadCollection(partialParams);
      }).toThrow('addons are required');
    });

    it('throws an error when detail is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.detail;

      expect(() => {
        loadCollection(partialParams);
      }).toThrow('detail is required');
    });
  });

  describe('fetchCollectionPage()', () => {
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
        fetchCollectionPage(partialParams);
      }).toThrow('errorHandlerId is required');
    });

    it('throws an error when slug is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.slug;

      expect(() => {
        fetchCollectionPage(partialParams);
      }).toThrow('slug is required');
    });

    it('throws an error when user is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.user;

      expect(() => {
        fetchCollectionPage(partialParams);
      }).toThrow('user is required');
    });

    it('throws an error when page is missing', () => {
      const partialParams = { ...defaultParams };
      delete partialParams.page;

      expect(() => {
        fetchCollectionPage(partialParams);
      }).toThrow('page is required');
    });
  });

  describe('loadCollectionPage()', () => {
    it('throws an error when addons are missing', () => {
      expect(() => {
        loadCollectionPage();
      }).toThrow('addons are required');
    });
  });
});
