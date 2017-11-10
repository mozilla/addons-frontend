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
      expect(collectionsState.loading).toEqual(true);
      expect(collectionsState.current).toEqual(null);
    });

    it('indicates when fetching a collection page', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(fetchCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const collectionsState = store.getState().collections;
      expect(collectionsState.loading).toEqual(true);
      expect(collectionsState.current.addons).toEqual([]);
    });

    it('loads a collection', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const collectionsState = store.getState().collections;
      const loadedCollection = collectionsState.current;

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection).toEqual(createInternalCollection({
        detail: collectionDetail,
        items: collectionAddons.results,
      }));
      expect(collectionsState.loading).toEqual(false);
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

      expect(collectionsState.loading).toEqual(true);
      expect(collectionsState.current).toEqual(null);
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

      const collectionsState = store.getState().collections;

      expect(collectionsState.loading).toEqual(true);
      expect(collectionsState.current).toEqual({
        ...createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons.results,
        }),
        addons: [],
      });
    });

    it('loads a collection page', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();

      store.dispatch(loadCollectionPage({ addons: collectionAddons }));

      const collectionsState = store.getState().collections;
      const loadedCollection = collectionsState.current;

      expect(loadedCollection).not.toEqual(null);
      expect(loadedCollection.addons)
        .toEqual(createInternalAddons(collectionAddons.results));
      expect(collectionsState.loading).toEqual(false);
    });

    it('resets the state when fetching is aborted', () => {
      const state = reducer(undefined, fetchCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      expect(state.loading).toEqual(true);
      expect(state.current.addons).toEqual([]);

      const newState = reducer(state, abortFetchCollection());
      expect(newState.loading).toEqual(false);
      expect(newState.current).toEqual(null);
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
