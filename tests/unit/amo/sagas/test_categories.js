import SagaTester from 'redux-saga-tester';

import categoriesSaga from 'amo/sagas/categories';
import createStore from 'amo/store';
import { setClientApp, setLang } from 'core/actions';
import * as actions from 'core/actions/categories';
import * as api from 'core/api';
import { CATEGORIES_LOAD } from 'core/constants';
import apiReducer from 'core/reducers/api';
import categoriesReducer from 'core/reducers/categories';
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

  function _categoriesFetch(overrides = {}) {
    return actions.categoriesFetch({
      errorHandlerId: errorHandler.id,
      ...overrides,
    });
  }

  it('should get Api from state then make API request to categories', async () => {
    const mockApi = sinon.mock(api);
    const results = [];

    mockApi
      .expects('categories')
      .once()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve(results));

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(_categoriesFetch());

    expect(sagaTester.getState()).toEqual({
      ...initialState,
      categories: { ...initialState.categories, loading: true },
    });

    await sagaTester.waitFor(CATEGORIES_LOAD);

    const calledActions = sagaTester.getCalledActions();

    // First action is CATEGORIES_FETCH.
    expect(calledActions[0]).toEqual(_categoriesFetch());

    // Next action is loading the categories returned by the API.
    expect(calledActions[1]).toEqual(actions.categoriesLoad(results));

    mockApi.verify();
  });

  it('should handle API errors', async () => {
    const mockApi = sinon.mock(api);
    const error = new Error('I have failed!');
    mockApi.expects('categories').throws(error);

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(_categoriesFetch());

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);

    const calledActions = sagaTester.getCalledActions();
    expect(calledActions[1]).toEqual(errorAction);
  });

  it('should respond to all CATEGORIES_FETCH actions', async () => {
    const mockApi = sinon.mock(api);

    mockApi
      .expects('categories')
      .twice()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve({ results: [] }));

    sagaTester.dispatch(_categoriesFetch());
    // Dispatch the fetch action again to ensure takeEvery() is respected
    // and both actions are responded to.
    sagaTester.dispatch(_categoriesFetch());

    await sagaTester.waitFor(CATEGORIES_LOAD);

    expect(sagaTester.numCalled(CATEGORIES_LOAD)).toBe(2);

    // Ensure the categories API was called twice because we respond to every
    // CATEGORIES_FETCH dispatch.
    mockApi.verify();
  });
});
