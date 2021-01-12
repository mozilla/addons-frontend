import SagaTester from 'redux-saga-tester';

import * as shelvesApi from 'amo/api/shelves';
import shelvesReducer, {
  abortFetchSponsored,
  fetchSponsored,
  loadSponsored,
} from 'amo/reducers/shelves';
import shelvesSaga from 'amo/sagas/shelves';
import apiReducer from 'amo/reducers/api';
import {
  createStubErrorHandler,
  fakeSponsoredShelf,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    const clientData = dispatchClientMetadata();
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(shelvesApi);
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        shelves: shelvesReducer,
      },
    });
    sagaTester.start(shelvesSaga);
  });

  function _fetchSponsored() {
    sagaTester.dispatch(
      fetchSponsored({
        errorHandlerId: errorHandler.id,
      }),
    );
  }

  describe('getSponsoredShelf', () => {
    it('calls the API to fetch the sponsored shelf', async () => {
      const state = sagaTester.getState();

      const shelfData = fakeSponsoredShelf;

      mockApi
        .expects('getSponsoredShelf')
        .withArgs({
          api: state.api,
        })
        .once()
        .returns(Promise.resolve(shelfData));

      _fetchSponsored();

      const expectedLoadAction = loadSponsored({
        shelfData,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchSponsored();

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error and aborts the fetching', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getSponsoredShelf')
        .once()
        .returns(Promise.reject(error));

      _fetchSponsored();

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(expectedAction).toEqual(action);
      expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchSponsored());
    });
  });
});
