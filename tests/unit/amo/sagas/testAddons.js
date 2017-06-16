import { hideLoading, showLoading } from 'react-redux-loading-bar';
import SagaTester from 'redux-saga-tester';

import addonsSaga from 'amo/sagas/addons';
import { fetchAddon } from 'core/actions/addons';
import * as api from 'core/api';
import { ENTITIES_LOADED } from 'core/constants';
import { ErrorHandler } from 'core/errorHandler';
import addonsReducer from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import { dispatchSignInActions, fakeAddon } from 'tests/unit/amo/helpers';
import { createFetchAddonResult } from 'tests/unit/helpers';


describe('amo/sagas/addons', () => {
  let apiState;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = new ErrorHandler({
      id: 'some-addon-handler',
      dispatch: sinon.stub(),
    });
    mockApi = sinon.mock(api);
    const initialState = dispatchSignInActions().state;
    apiState = initialState.api;
    sagaTester = new SagaTester({
      initialState,
      reducers: { addons: addonsReducer, api: apiReducer },
    });
    sagaTester.start(addonsSaga);
  });

  function _fetchAddon(params = {}) {
    sagaTester.dispatch(fetchAddon({
      errorHandler,
      slug: fakeAddon.slug,
      ...params,
    }));
  }

  it('fetches an addon from the API', async () => {
    mockApi
      .expects('fetchAddon')
      .once()
      .withArgs({ slug: fakeAddon.slug, api: { ...apiState } })
      .returns(Promise.resolve(createFetchAddonResult(fakeAddon)));

    _fetchAddon({ slug: fakeAddon.slug });

    // The saga should respond by dispatching the addon entity.
    await sagaTester.waitFor(ENTITIES_LOADED);
    mockApi.verify();
  });

  it('shows a progress bar', async () => {
    mockApi
      .expects('fetchAddon')
      .returns(Promise.resolve(createFetchAddonResult(fakeAddon)));

    _fetchAddon();

    await sagaTester.waitFor(ENTITIES_LOADED);
    expect(sagaTester.getCalledActions()[2]).toEqual(showLoading());
    expect(sagaTester.getCalledActions()[4]).toEqual(hideLoading());
  });

  it('clears the error handler', async () => {
    mockApi
      .expects('fetchAddon')
      .returns(Promise.resolve(createFetchAddonResult(fakeAddon)));

    _fetchAddon();

    await sagaTester.waitFor(ENTITIES_LOADED);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('fetchAddon')
      .returns(Promise.reject(error));

    _fetchAddon();

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[3]).toEqual(errorAction);
    expect(sagaTester.getCalledActions()[4]).toEqual(hideLoading());
  });
});
