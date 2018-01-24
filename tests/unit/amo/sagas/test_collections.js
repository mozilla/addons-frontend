import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import collectionsReducer, {
  abortAddAddonToCollection,
  abortFetchCurrentCollection,
  abortFetchUserCollections,
  addAddonToCollection,
  addonAddedToCollection,
  fetchCurrentCollection,
  fetchCurrentCollectionPage,
  fetchUserCollections,
  finishUpdateCollection,
  loadCurrentCollection,
  loadCurrentCollectionPage,
  loadUserCollections,
  updateCollection,
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

  describe('addAddonToCollection', () => {
    const _addAddonToCollection = (params = {}) => {
      sagaTester.dispatch(addAddonToCollection({
        addonId: 543,
        collectionId: 321,
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
        collectionId: 5432,
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

      _addAddonToCollection(params);

      const expectedLoadAction = addonAddedToCollection({
        addonId: params.addonId,
        collectionId: params.collectionId,
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
      const addonId = 8876;
      const userId = 12334;
      const error = new Error('some API error maybe');

      mockApi
        .expects('addAddonToCollection')
        .returns(Promise.reject(error));

      _addAddonToCollection({ addonId, userId });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(abortAddAddonToCollection({ addonId, userId }));
    });
  });

  describe('updateCollection', () => {
    const _updateCollection = (params = {}) => {
      sagaTester.dispatch(updateCollection({
        errorHandlerId: errorHandler.id,
        collectionSlug: 'some-collection',
        user: 321,
        ...params,
      }));
    };

    it('sends a patch to the collection API', async () => {
      const collectionSlug = 'a-collection';
      const params = {
        collectionSlug,
        name: 'New collection name',
        user: 543,
      };
      const state = sagaTester.getState();

      mockApi
        .expects('updateCollection')
        .withArgs({
          api: state.api,
          collectionSlug,
          defaultLocale: undefined,
          description: undefined,
          isPublic: undefined,
          name: params.name,
          slug: undefined,
          user: params.user,
        })
        .once()
        .returns(Promise.resolve());

      _updateCollection(params);

      const expectedLoadAction = finishUpdateCollection({
        collectionSlug: params.collectionSlug,
        successful: true,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _updateCollection();

      const expectedAction = errorHandler.createClearingAction();

      await sagaTester.waitFor(expectedAction.type);
      expect(sagaTester.getCalledActions()[1])
        .toEqual(errorHandler.createClearingAction());
    });

    it('handles errors', async () => {
      const collectionSlug = 'a-collection';
      const error = new Error('some API error maybe');

      mockApi
        .expects('updateCollection')
        .returns(Promise.reject(error));

      _updateCollection({ collectionSlug });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
      expect(sagaTester.getCalledActions()[3])
        .toEqual(finishUpdateCollection({
          collectionSlug, successful: false,
        }));
    });
  });
});
