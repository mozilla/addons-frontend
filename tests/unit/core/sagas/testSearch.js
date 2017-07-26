import SagaTester from 'redux-saga-tester';

import { searchStart } from 'core/actions/search';
import * as api from 'core/api';
import { CLEAR_ERROR, SEARCH_LOADED } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import searchReducer from 'core/reducers/search';
import apiReducer from 'core/reducers/api';
import authReducer from 'core/reducers/authentication';
import searchSaga from 'core/sagas/search';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';


describe('Search Saga', () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      id: 'some-search-handler',
      dispatch: sinon.stub(),
    });
    mockApi = sinon.mock(api);
    const initialState = dispatchSignInActions().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: { api: apiReducer, auth: authReducer, search: searchReducer },
    });
    sagaTester.start(searchSaga);
  });

  function _searchStart(params) {
    sagaTester.dispatch(searchStart({
      errorHandlerId: 'some-search-handler',
      ...params,
    }));
  }

  it('searches the API for add-ons', async () => {
    const entities = sinon.stub();
    const result = sinon.stub();

    const filters = { page: 2, query: 'test' };

    mockApi
      .expects('search')
      .once()
      .returns(Promise.resolve({ entities, result }));

    _searchStart({ filters });

    // The saga should respond by dispatching the search loaded action.
    await sagaTester.waitFor(SEARCH_LOADED);
    mockApi.verify();
  });

  it('handles missing page filter for search', async () => {
    const entities = sinon.stub();
    const result = sinon.stub();
    const state = sagaTester.getState();

    const filters = { query: 'test' };

    mockApi
      .expects('search')
      .once()
      .withArgs({
        api: state.api,
        auth: state.auth,
        filters,
        // The search saga will set `page` to `parsePage(filters.page)`, so
        // in the case of a missing `page` param it should be `1`.
        page: 1,
      })
      .returns(Promise.resolve({ entities, result }));

    _searchStart({ filters });

    // The saga should respond by dispatching the search loaded action.
    await sagaTester.waitFor(SEARCH_LOADED);
    mockApi.verify();
  });

  it('clears the error handler', async () => {
    _searchStart({ filters: { query: 'foo' } });

    await sagaTester.waitFor(CLEAR_ERROR);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('search')
      .returns(Promise.reject(error));

    _searchStart({ filters: {} });

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
