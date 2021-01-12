import SagaTester from 'redux-saga-tester';

import createStore from 'amo/store';
import categoriesSaga from 'amo/sagas/categories';
import * as api from 'amo/api/categories';
import apiReducer, { setClientApp, setLang } from 'amo/reducers/api';
import categoriesReducer, {
  LOAD_CATEGORIES,
  fetchCategories,
  loadCategories,
} from 'amo/reducers/categories';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let initialState;
  let sagaTester;
  let store;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    store = createStore().store;
    store.dispatch(setClientApp('firefox'));
    store.dispatch(setLang('en-US'));

    const state = store.getState();
    initialState = {
      api: state.api,
      categories: state.categories,
    };

    sagaTester = new SagaTester({
      initialState,
      reducers: { api: apiReducer, categories: categoriesReducer },
    });
    sagaTester.start(categoriesSaga);
  });

  function _fetchCategories(overrides = {}) {
    return fetchCategories({
      errorHandlerId: errorHandler.id,
      ...overrides,
    });
  }

  it('should get Api from state then make API request to categories', async () => {
    const mockApi = sinon.mock(api);
    const results = [];

    mockApi
      .expects('getCategories')
      .once()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve(results));

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(_fetchCategories());

    expect(sagaTester.getState()).toEqual({
      ...initialState,
      categories: { ...initialState.categories, loading: true },
    });

    await sagaTester.waitFor(LOAD_CATEGORIES);

    const calledActions = sagaTester.getCalledActions();

    // First action is FETCH_CATEGORIES.
    expect(calledActions[0]).toEqual(_fetchCategories());

    // Next action is loading the categories returned by the API.
    expect(calledActions[1]).toEqual(loadCategories({ results }));

    mockApi.verify();
  });

  it('should handle API errors', async () => {
    const mockApi = sinon.mock(api);
    const error = new Error('I have failed!');
    mockApi.expects('getCategories').throws(error);

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(_fetchCategories());

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);

    const calledActions = sagaTester.getCalledActions();
    expect(calledActions[1]).toEqual(errorAction);
  });

  it('should respond to all FETCH_CATEGORIES actions', async () => {
    const mockApi = sinon.mock(api);

    mockApi
      .expects('getCategories')
      .twice()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve({ results: [] }));

    sagaTester.dispatch(_fetchCategories());
    // Dispatch the fetch action again to ensure takeEvery() is respected
    // and both actions are responded to.
    sagaTester.dispatch(_fetchCategories());

    await sagaTester.waitFor(LOAD_CATEGORIES);

    expect(sagaTester.numCalled(LOAD_CATEGORIES)).toBe(2);

    // Ensure the categories API was called twice because we respond to every
    // FETCH_CATEGORIES dispatch.
    mockApi.verify();
  });
});
