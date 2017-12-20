import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import collectionsReducer, {
  abortFetchCurrentCollection,
  abortFetchUserAddonCollections,
  abortFetchUserCollections,
  addAddonToCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserAddonCollections,
  fetchUserCollections,
  loadCollectionAddons,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserAddonCollections,
  loadUserCollections,
} from 'amo/reducers/collections';
import collectionsSaga from 'amo/sagas/collections';
import apiReducer from 'core/reducers/api';
import { parsePage } from 'core/utils';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  createFakeCollectionAddons,
  createFakeCollectionDetail,
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  const user = 'user-id-or-name';
  const slug = 'collection-slug';

  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(collectionsApi);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        collections: collectionsReducer,
      },
    });
    sagaTester.start(collectionsSaga);
  });

  describe('fetchCurrentCollection', () => {
    function _fetchCurrentCollection(params) {
      sagaTester.dispatch(fetchCurrentCollection({
        errorHandlerId: errorHandler.id,
        ...params,
      }));
    }

    it('calls the API to fetch a collection', async () => {
      const state = sagaTester.getState();

      const collectionAddons = createFakeCollectionAddons();
      const collectionDetail = createFakeCollectionDetail();

      mockApi
        .expects('getCollectionDetail')
        .withArgs({
          api: state.api,
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionDetail));

      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          page: parsePage(1),
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollection({ page: parsePage(1), slug, user });

      const expectedLoadAction = loadCurrentCollection({
        addons: collectionAddons,
        detail: collectionDetail,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollection({ slug, user });

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getCollectionDetail')
        .once()
        .returns(Promise.reject(error));

      _fetchCurrentCollection({ slug, user });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchCurrentCollection());
    });
  });

  describe('fetchCurrentCollectionPage', () => {
    function _fetchCurrentCollectionPage(params) {
      sagaTester.dispatch(fetchCurrentCollectionPage({
        errorHandlerId: errorHandler.id,
        ...params,
      }));
    }

    it('calls the API to fetch a collection page', async () => {
      const state = sagaTester.getState();

      const collectionAddons = createFakeCollectionAddons();
      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          page: parsePage(1),
          slug,
          user,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _fetchCurrentCollectionPage({ page: parsePage(1), slug, user });

      const expectedLoadAction = loadCurrentCollectionPage({
        addons: collectionAddons,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchCurrentCollectionPage({ page: parsePage(1), slug, user });

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getCollectionAddons')
        .once()
        .returns(Promise.reject(error));

      _fetchCurrentCollectionPage({ page: parsePage(1), slug, user });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchCurrentCollection());
    });
  });

  describe('fetchUserCollections', () => {
    const _fetchUserCollections = (params) => {
      sagaTester.dispatch(fetchUserCollections({
        errorHandlerId: errorHandler.id,
        userId: 321,
        ...params,
      }));
    };

    it('calls the API to fetch user collections', async () => {
      const userId = 43321;
      const state = sagaTester.getState();

      const firstCollection = createFakeCollectionDetail({ id: 1 });
      const secondCollection = createFakeCollectionDetail({ id: 2 });
      const externalCollections = [firstCollection, secondCollection];

      mockApi
        .expects('getAllUserCollections')
        .withArgs({
          api: state.api,
          user: userId,
        })
        .once()
        .returns(Promise.resolve(externalCollections));

      _fetchUserCollections({ userId });

      const expectedLoadAction = loadUserCollections({
        userId, collections: externalCollections,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchUserCollections();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const userId = 55432;
      const error = new Error('some API error maybe');

      mockApi
        .expects('getAllUserCollections')
        .once()
        .returns(Promise.reject(error));

      _fetchUserCollections({ userId });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(abortFetchUserCollections({ userId }));
    });
  });

  describe('fetchUserAddonCollections', () => {
    const _fetchUserAddonCollections = (params) => {
      sagaTester.dispatch(fetchUserAddonCollections({
        errorHandlerId: errorHandler.id,
        addonId: 761,
        userId: 321,
        ...params,
      }));
    };

    it('fetches user collections by add-on from the API', async () => {
      const addonId = 9861;
      const userId = 43321;
      const state = sagaTester.getState();

      const firstCollection = createFakeCollectionDetail({
        slug: 'first',
      });
      const secondCollection = createFakeCollectionDetail({
        slug: 'second',
      });
      // These are all collections belonging to the user.
      const externalCollections = [firstCollection, secondCollection];
      // These are collections that have a matching add-on.
      const matchingExtCollections = [firstCollection];

      mockApi
        .expects('getAllUserCollections')
        .withArgs({
          api: state.api,
          user: userId,
        })
        .once()
        .returns(Promise.resolve(externalCollections));

      const addonMap = {
        [firstCollection.slug]: createFakeCollectionAddons({
          // This collection will have one matching add-on.
          addons: [{ ...fakeAddon, id: addonId }],
        }),
        [secondCollection.slug]: createFakeCollectionAddons({
          // This collection does not have any matching add-ons.
          addons: [{ ...fakeAddon, id: 123454 }],
        }),
      };

      // This API will be called once per collection.
      mockApi
        .expects('getAllCollectionAddons')
        .twice()
        .withArgs({
          api: state.api,
          slug: sinon.match((slugParam) => (
            slugParam === firstCollection.slug ||
            slugParam === secondCollection.slug
          )),
          user: userId,
        })
        .callsFake((params) => {
          const response = addonMap[params.slug];
          if (!response) {
            throw new Error(
              `No response mapped for collection slug ${params.slug}`);
          }
          return Promise.resolve(response.results);
        });

      _fetchUserAddonCollections({ addonId, userId });

      const expectedLoadAction = loadUserAddonCollections({
        addonId, userId, collections: matchingExtCollections,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('saves zero collections if none contain the add-on', async () => {
      const addonId = 9861;
      const userId = 43321;

      const firstCollection = createFakeCollectionDetail({
        slug: 'first',
      });
      const secondCollection = createFakeCollectionDetail({
        slug: 'second',
      });
      const externalCollections = [firstCollection, secondCollection];

      mockApi
        .expects('getAllUserCollections')
        .returns(Promise.resolve(externalCollections));

      mockApi
        .expects('getAllCollectionAddons')
        .twice()
        // Return no matching add-ons for any collection.
        .returns(Promise.resolve(createFakeCollectionAddons().results));

      _fetchUserAddonCollections({ addonId, userId });

      const expectedLoadAction = loadUserAddonCollections({
        // Since the add-on was not found in any collections, the saga
        // should load an empty list.
        addonId, userId, collections: [],
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchUserAddonCollections();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const addonId = 9962;
      const userId = 55432;
      const error = new Error('some API error maybe');

      mockApi
        .expects('getAllUserCollections')
        .once()
        .returns(Promise.reject(error));

      _fetchUserAddonCollections({ addonId, userId });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(abortFetchUserAddonCollections({ addonId, userId }));
    });
  });

  describe('addAddonToCollection', () => {
    const _addAddonToCollection = (params = {}) => {
      sagaTester.dispatch(addAddonToCollection({
        addonId: 543,
        collectionSlug: 'some-collection',
        errorHandlerId: errorHandler.id,
        userId: 321,
        ...params,
      }));
    };

    it('posts an add-on to a collection', async () => {
      const collectionSlug = 'a-collection';
      const params = {
        addonId: 123,
        collectionSlug,
        userId: 543,
      };
      const state = sagaTester.getState();

      // Load a collection for the user.
      sagaTester.dispatch(loadUserCollections({
        userId: params.userId,
        collections: [createFakeCollectionDetail({
          slug: collectionSlug, authorId: params.userId,
        })],
      }));

      mockApi
        .expects('addAddonToCollection')
        .withArgs({
          addon: params.addonId,
          api: state.api,
          collection: collectionSlug,
          notes: undefined,
          user: params.userId,
        })
        .once()
        .returns(Promise.resolve());

      const collectionAddons = createFakeCollectionAddons();
      mockApi
        .expects('getCollectionAddons')
        .withArgs({
          api: state.api,
          page: 1,
          slug: collectionSlug,
          user: params.userId,
        })
        .once()
        .returns(Promise.resolve(collectionAddons));

      _addAddonToCollection(params);

      const expectedLoadAction = loadCollectionAddons({
        collectionSlug, addons: collectionAddons,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[3];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _addAddonToCollection();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('addAddonToCollection')
        .once()
        .returns(Promise.reject(error));

      _addAddonToCollection();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      // expect(sagaTester.getCalledActions()[3])
      //   .toEqual(abortFetchUserCollections({ userId }));
    });
  });
});
