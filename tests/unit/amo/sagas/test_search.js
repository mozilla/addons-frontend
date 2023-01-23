import SagaTester from 'redux-saga-tester';

import * as api from 'amo/api/search';
import apiReducer from 'amo/reducers/api';
import { clearError } from 'amo/reducers/errors';
import searchReducer, {
  SEARCH_LOADED,
  abortSearch,
  searchStart,
  searchLoad,
} from 'amo/reducers/search';
import searchSaga from 'amo/sagas/search';
import {
  createStubErrorHandler,
  dispatchSignInActions,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(api);
    const initialState = dispatchSignInActions().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: { api: apiReducer, search: searchReducer },
    });
    sagaTester.start(searchSaga);
  });

  function _searchStart(params) {
    sagaTester.dispatch(
      searchStart({
        errorHandlerId: 'create-stub-error-handler-id',
        ...params,
      }),
    );
  }

  it('searches the API for add-ons', async () => {
    const filters = { page: 2, query: 'test' };

    mockApi
      .expects('search')
      .once()
      .returns(Promise.resolve({ results: [], count: 0, page_count: 0 }));

    _searchStart({ filters });

    // The saga should respond by dispatching the search loaded action.
    await sagaTester.waitFor(SEARCH_LOADED);
    mockApi.verify();

    // The searchLoad action should contain the pageCount attribute taken from the API response
    const expectedLoadAction = searchLoad({
      results: [],
      count: 0,
      pageCount: 0,
    });

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _searchStart({ filters: { query: 'foo' } });

    await sagaTester.waitFor(clearError.type);
    expect(sagaTester.getCalledActions()[1]).toEqual(
      errorHandler.createClearingAction(),
    );
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('search').returns(Promise.reject(error));

    _searchStart({ filters: {} });

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    expect(sagaTester.getCalledActions()[3]).toEqual(abortSearch());
  });
});
