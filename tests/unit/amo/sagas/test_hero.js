import SagaTester from 'redux-saga-tester';

import * as heroApi from 'amo/api/hero';
import heroReducer, {
  abortFetchHeroShelves,
  fetchHeroShelves,
  loadHeroShelves,
} from 'amo/reducers/hero';
import heroSaga from 'amo/sagas/hero';
import apiReducer from 'core/reducers/api';
import {
  createStubErrorHandler,
  fakeHeroShelves,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    const clientData = dispatchClientMetadata();
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(heroApi);
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        hero: heroReducer,
      },
    });
    sagaTester.start(heroSaga);
  });

  function _fetchHeroShelves() {
    sagaTester.dispatch(
      fetchHeroShelves({
        errorHandlerId: errorHandler.id,
      }),
    );
  }

  it('calls the API to fetch hero shelves', async () => {
    const state = sagaTester.getState();

    const heroShelves = fakeHeroShelves;

    mockApi
      .expects('getHeroShelves')
      .withArgs({
        api: state.api,
      })
      .once()
      .returns(Promise.resolve(heroShelves));

    _fetchHeroShelves();

    const expectedLoadAction = loadHeroShelves({ heroShelves });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    expect(loadAction).toEqual(expectedLoadAction);
    mockApi.verify();
  });

  it('clears the error handler', async () => {
    _fetchHeroShelves();

    const expectedAction = errorHandler.createClearingAction();

    const action = await sagaTester.waitFor(expectedAction.type);
    expect(action).toEqual(expectedAction);
  });

  it('dispatches an error and aborts the fetching', async () => {
    const error = new Error('some API error maybe');

    mockApi
      .expects('getHeroShelves')
      .once()
      .returns(Promise.reject(error));

    _fetchHeroShelves();

    const expectedAction = errorHandler.createErrorAction(error);
    const action = await sagaTester.waitFor(expectedAction.type);
    expect(expectedAction).toEqual(action);
    expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchHeroShelves());
  });
});
