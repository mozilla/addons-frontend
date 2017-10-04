import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/languageTools';
import addonsReducer, {
  fetchLanguageTools,
  loadAddonResults,
} from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import languageToolsSaga from 'core/sagas/languageTools';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeLanguageAddon,
  createStubErrorHandler,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(api);
    sagaTester = new SagaTester({
      initialState: dispatchClientMetadata().state,
      reducers: {
        api: apiReducer,
        addons: addonsReducer,
      },
    });
    sagaTester.start(languageToolsSaga);
  });

  it('calls the API for language tools', async () => {
    const addon = { ...fakeAddon, slug: 'fancy' };
    const response = { results: createFakeLanguageAddon({ addon }) };

    mockApi
      .expects('languageTools')
      .once()
      .withArgs({ api: sagaTester.getState().api })
      .returns(Promise.resolve(response));

    sagaTester.dispatch(fetchLanguageTools({
      errorHandlerId: errorHandler.id,
    }));

    const expectedLoadAction = loadAddonResults({ addons: response.results });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    const clearingAction = errorHandler.createClearingAction();

    sagaTester.dispatch(fetchLanguageTools({
      errorHandlerId: errorHandler.id,
    }));

    await sagaTester.waitFor(clearingAction.type);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(clearingAction);
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('languageTools')
      .returns(Promise.reject(error));

    sagaTester.dispatch(fetchLanguageTools({
      errorHandlerId: errorHandler.id,
    }));

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
