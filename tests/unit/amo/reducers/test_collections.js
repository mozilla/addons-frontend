import reducer, {
  createInternalCollection,
  fetchCollection,
  initialState,
  loadCollection,
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

    it('only resets the add-ons when a current collection is loaded', () => {
      const { store } = dispatchClientMetadata();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      // 1. User loads a collection.
      store.dispatch(loadCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      }));

      // 2. User clicks the "next" pagination link.
      store.dispatch(fetchCollection({
        errorHandlerId: createStubErrorHandler().id,
        page: parsePage(2),
        slug: 'some-collection-slug',
        user: 'some-user-id-or-name',
      }));

      const collectionsState = store.getState().collections;
      const loadedCollection = collectionsState.current;

      expect(collectionsState.loading).toEqual(true);
      expect(loadedCollection).toEqual({
        ...createInternalCollection({
          detail: collectionDetail,
          items: collectionAddons.results,
        }),
        addons: [],
      });
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
});
