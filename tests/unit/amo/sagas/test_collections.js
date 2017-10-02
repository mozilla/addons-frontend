import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import collectionsReducer, {
  fetchCollection,
  fetchCollectionPage,
  loadCollection,
  loadCollectionPage,
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

  describe('fetchCollection', () => {
    function _fetchCollection(params) {
      sagaTester.dispatch(fetchCollection({
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

      _fetchCollection({ page: parsePage(1), slug, user });

      const expectedLoadAction = loadCollection({
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
      _fetchCollection({ slug, user });

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

      _fetchCollection({ slug, user });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });

  describe('fetchCollectionPage', () => {
    function _fetchCollectionPage(params) {
      sagaTester.dispatch(fetchCollectionPage({
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

      _fetchCollectionPage({ page: parsePage(1), slug, user });

      const expectedLoadAction = loadCollectionPage({
        addons: collectionAddons,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();
      const loadAction = calledActions[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _fetchCollectionPage({ page: parsePage(1), slug, user });

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

      _fetchCollectionPage({ page: parsePage(1), slug, user });

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });
});
