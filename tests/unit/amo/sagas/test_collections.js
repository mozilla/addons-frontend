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
      const addonId = 9962;
      const userId = 3211;
      const state = sagaTester.getState();

      // Pretend this is a collection that the add-on belongs to.
      const collections = [createFakeCollectionDetail()];

      mockApi
        .expects('getAllUserAddonCollections')
        .withArgs({ addonId, api: state.api, user: userId })
        .once()
        .returns(Promise.resolve(collections));

      _fetchUserAddonCollections({ addonId, userId });

      const expectedLoadAction = loadUserAddonCollections({
        addonId, userId, collections,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      mockApi
        .expects('getAllUserAddonCollections')
        .returns(Promise.resolve([createFakeCollectionDetail()]));

      _fetchUserAddonCollections();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('dispatches an error', async () => {
      const state = sagaTester.getState();
      const addonId = 9962;
      const userId = 55432;
      const error = new Error('some API error maybe');

      mockApi
        .expects('getAllUserAddonCollections')
        .withArgs({ addonId, api: state.api, user: userId })
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

      const collections = [
        createFakeCollectionDetail({ slug: collectionSlug }),
      ];
      mockApi
        .expects('getAllUserAddonCollections')
        .withArgs({
          addonId: params.addonId, api: state.api, user: params.userId,
        })
        .once()
        .returns(Promise.resolve(collections));

      _addAddonToCollection(params);

      const expectedLoadAction = loadUserAddonCollections({
        addonId: params.addonId,
        collections,
        userId: params.userId,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
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
