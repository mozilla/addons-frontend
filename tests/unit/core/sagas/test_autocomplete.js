import SagaTester from 'redux-saga-tester';

import autocompleteReducer, {
  autocompleteStart,
  AUTOCOMPLETE_LOADED,
} from 'core/reducers/autocomplete';
import { CLEAR_ERROR } from 'core/constants';
import * as api from 'core/api';
import apiReducer from 'core/reducers/api';
import authReducer from 'core/reducers/authentication';
import autocompleteSaga from 'core/sagas/autocomplete';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import { createStubErrorHandler } from 'tests/unit/helpers';


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
      reducers: {
        api: apiReducer,
        auth: authReducer,
        autocomplete: autocompleteReducer,
      },
    });
    sagaTester.start(autocompleteSaga);
  });

  function _autocompleteStart(params) {
    sagaTester.dispatch(autocompleteStart({
      errorHandlerId: 'create-stub-error-handler-id',
      ...params,
    }));
  }

  it('calls the API for suggestions', async () => {
    const results = sinon.stub();
    const filters = { query: 'test' };

    mockApi
      .expects('autocomplete')
      .once()
      .returns(Promise.resolve({ results }));

    _autocompleteStart({ filters });

    // The saga should respond by dispatching the autocomplete loaded action.
    await sagaTester.waitFor(AUTOCOMPLETE_LOADED);
    mockApi.verify();
  });

  it('clears the error handler', async () => {
    _autocompleteStart({ filters: { query: 'foo' } });

    await sagaTester.waitFor(CLEAR_ERROR);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('autocomplete')
      .returns(Promise.reject(error));

    _autocompleteStart({ filters: {} });

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
