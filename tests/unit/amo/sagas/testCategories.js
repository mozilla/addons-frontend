import { hideLoading, showLoading } from 'react-redux-loading-bar';
import SagaTester from 'redux-saga-tester';

import categoriesSaga from 'amo/sagas/categories';
import createStore from 'amo/store';
import { setClientApp, setLang } from 'core/actions';
import * as actions from 'core/actions/categories';
import * as api from 'core/api';
import {
  CATEGORIES_FAIL,
  CATEGORIES_LOAD,
} from 'core/constants';
import apiReducer from 'core/reducers/api';
import categoriesReducer from 'core/reducers/categories';


describe('categoriesSaga', () => {
  let initialState;
  let sagaTester;
  let store;

  beforeEach(() => {
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

  it('should get Api from state then make API request to categories', async () => {
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('categories')
      .once()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve({ entities, result }));

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(actions.categoriesFetch());

    expect(sagaTester.getState()).toEqual({
      ...initialState,
      categories: { ...initialState.categories, loading: true },
    });

    await sagaTester.waitFor(CATEGORIES_LOAD);

    const calledActions = sagaTester.getCalledActions();

    // First action is CATEGORIES_FETCH.
    expect(calledActions[0]).toEqual(actions.categoriesFetch());

    // Next action is showing the loading bar.
    expect(calledActions[1]).toEqual(showLoading());

    // Next action is loading the categories returned by the API.
    expect(calledActions[2]).toEqual(actions.categoriesLoad({ result }));

    // Last action is to hide the loading bar.
    expect(calledActions[3]).toEqual(hideLoading());

    mockApi.verify();
  });

  it('should dispatch fail if API request fails', async () => {
    const mockApi = sinon.mock(api);
    const error = new Error('I have failed!');

    mockApi.expects('categories').throws(error);

    expect(sagaTester.getState()).toEqual(initialState);

    sagaTester.dispatch(actions.categoriesFetch());

    await sagaTester.waitFor(CATEGORIES_FAIL);

    const calledActions = sagaTester.getCalledActions();

    // First action is CATEGORIES_FETCH.
    expect(calledActions[0]).toEqual(actions.categoriesFetch());

    // Next action is showing the loading bar.
    expect(calledActions[1]).toEqual(showLoading());

    // Next action is failure because the API request failed.
    expect(calledActions[2]).toEqual(actions.categoriesFail(error));

    // Last action is to hide the loading bar.
    expect(calledActions[3]).toEqual(hideLoading());
  });

  it('should respond to all CATEGORIES_FETCH actions', async () => {
    const mockApi = sinon.mock(api);
    const entities = sinon.stub();
    const result = sinon.stub();

    mockApi
      .expects('categories')
      .twice()
      .withArgs({
        api: { ...initialState.api },
      })
      .returns(Promise.resolve({ entities, result }));

    sagaTester.dispatch(actions.categoriesFetch());
    // Dispatch the fetch action again to ensure takeEvery() is respected
    // and both actions are responded to.
    sagaTester.dispatch(actions.categoriesFetch());

    await sagaTester.waitFor(CATEGORIES_LOAD);

    expect(sagaTester.numCalled(CATEGORIES_LOAD)).toBe(2);

    // Ensure the categories API was called twice because we respond to every
    // CATEGORIES_FETCH dispatch.
    mockApi.verify();
  });
});
