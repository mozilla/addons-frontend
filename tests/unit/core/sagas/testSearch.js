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
  let apiState;
  let authState;
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
    apiState = initialState.api;
    authState = initialState.auth;
    sagaTester = new SagaTester({
      initialState,
      reducers: { api: apiReducer, auth: authReducer, search: searchReducer },
    });
    sagaTester.start(searchSaga);
  });

  function _searchStart(params) {
    sagaTester.dispatch(searchStart({
      errorHandlerId: 'some-search-handler',
      page: 1,
      results: [],
      ...params,
    }));
  }

  it('searches the API for add-ons', async() => {
    const entities = sinon.stub();
    const result = sinon.stub();

    const filters = { query: 'test' };

    mockApi
      .expects('search')
      .once()
      .withArgs({ api: apiState, auth: authState, filters, page: 1 })
      .returns(Promise.resolve({ entities, result }));

    _searchStart({ filters });

    // The saga should respond by dispatching the search loaded action.
    await sagaTester.waitFor(SEARCH_LOADED);
    mockApi.verify();
  });

  it('clears the error handler', async() => {
    const entities = sinon.stub();
    const result = sinon.stub();

    const filters = { query: 'test' };

    mockApi
      .expects('search')
      .once()
      .withArgs({ api: apiState, auth: authState, filters, page: 1 })
      .returns(Promise.resolve({ entities, result }));

    _searchStart({ filters });

    await sagaTester.waitFor(CLEAR_ERROR);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async() => {
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
