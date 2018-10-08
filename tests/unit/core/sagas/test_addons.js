import SagaTester from 'redux-saga-tester';

import * as api from 'core/api';
import addonsReducer, {
  loadAddonResults,
  fetchAddon,
} from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import addonsSaga from 'core/sagas/addons';
import {
  createFetchAddonResult,
  createStubErrorHandler,
  dispatchSignInActions,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let apiState;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
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
    sagaTester.dispatch(
      fetchAddon({
        errorHandler,
        slug: fakeAddon.slug,
        ...params,
      }),
    );
  }

  it('fetches an addon from the API', async () => {
    mockApi
      .expects('fetchAddon')
      .once()
      .withArgs({ slug: fakeAddon.slug, api: { ...apiState } })
      .returns(Promise.resolve(fakeAddon));

    _fetchAddon({ slug: fakeAddon.slug });

    const expectedAction = loadAddonResults({ addons: [fakeAddon] });
    await sagaTester.waitFor(expectedAction.type);

    mockApi.verify();
  });

  it('clears the error handler', async () => {
    mockApi.expects('fetchAddon').returns(Promise.resolve(fakeAddon));

    _fetchAddon();

    const expectedAction = loadAddonResults({ addons: [fakeAddon] });
    await sagaTester.waitFor(expectedAction.type);

    expect(sagaTester.getCalledActions()[1]).toEqual(
      errorHandler.createClearingAction(),
    );
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('fetchAddon').returns(Promise.reject(error));

    _fetchAddon();

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
