import SagaTester from 'redux-saga-tester';

import * as api from 'amo/api/languageTools';
import languageToolsReducer, {
  fetchLanguageTools,
  loadLanguageTools,
} from 'amo/reducers/languageTools';
import apiReducer from 'amo/reducers/api';
import languageToolsSaga from 'amo/sagas/languageTools';
import {
  createFakeLanguageTool,
  createStubErrorHandler,
  dispatchClientMetadata,
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
        languageTools: languageToolsReducer,
      },
    });
    sagaTester.start(languageToolsSaga);
  });

  it('calls the API for language tools', async () => {
    const response = { results: [createFakeLanguageTool()] };

    mockApi
      .expects('languageTools')
      .once()
      .withArgs({ api: sagaTester.getState().api })
      .returns(Promise.resolve(response));

    sagaTester.dispatch(
      fetchLanguageTools({
        errorHandlerId: errorHandler.id,
      }),
    );

    const expectedLoadAction = loadLanguageTools({
      languageTools: response.results,
    });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    const clearingAction = errorHandler.createClearingAction();

    sagaTester.dispatch(
      fetchLanguageTools({
        errorHandlerId: errorHandler.id,
      }),
    );

    await sagaTester.waitFor(clearingAction.type);
    expect(sagaTester.getCalledActions()[1]).toEqual(clearingAction);
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('languageTools').returns(Promise.reject(error));

    sagaTester.dispatch(
      fetchLanguageTools({
        errorHandlerId: errorHandler.id,
      }),
    );

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
