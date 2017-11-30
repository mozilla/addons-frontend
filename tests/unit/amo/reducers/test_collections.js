import reducer, {
  abortFetchCollection,
  createInternalAddons,
  createInternalCollection,
  fetchCollection,
  fetchCurrentCollectionPage,
  initialState,
  loadCollection,
  loadCollectionPage,
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
      const state = reducer(undefined, fetchCollection({
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

      let state = reducer(undefined, loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      state = reducer(state, fetchCurrentCollectionPage({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: collectionDetail.slug,
        user: 'some-user-id-or-name',
      }));

      const collection = state.byId[state.current.id];
      expect(collection.addons).toEqual([]);
    });

    it('loads a collection', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      const state = reducer(undefined, loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const loadedCollection = state.byId[state.current.id];

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
      let state = reducer(undefined, loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User navigates to another collection.
      state = reducer(state, fetchCollection({
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
      let state = reducer(undefined, loadCollection({
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
      const addons = createFakeCollectionAddons();

      expect(() => reducer(undefined, loadCollectionPage({ addons })))
        .toThrow(/current collection does not exist/);
    });

    it('loads a collection page', () => {
      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // Load a current collection.
      // TODO: rename to loadCurrentCollection()
      let state = reducer(undefined, loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      const newAddons = createFakeCollectionAddons({
        addons: [{ ...fakeAddon, id: 333 }],
      });
      state = reducer(state, loadCollectionPage({ addons: newAddons }));

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

    it('preserves collection data when fetching is aborted', () => {
      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });

      let state = reducer(undefined, loadCollection({
        addons: createFakeCollectionAddons(),
        detail: firstCollection,
      }));

      state = reducer(state, loadCollection({
        addons: createFakeCollectionAddons(),
        detail: secondCollection,
      }));

      state = reducer(state, abortFetchCollection());

      // Make sure collection data still exists.
      expect(state.byId[firstCollection.id]).toBeDefined();
      expect(state.byId[secondCollection.id]).toBeDefined();
      expect(state.current.loading).toEqual(false);
      expect(state.current.id).toEqual(null);
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

  describe('loadCollectionPage()', () => {
    it('throws an error when addons are missing', () => {
      expect(() => {
        loadCollectionPage();
      }).toThrow('addons are required');
    });
  });
});
