import SagaTester from 'redux-saga-tester';

import autocompleteReducer, {
  autocompleteCancel,
  autocompleteStart,
  autocompleteLoad,
} from 'amo/reducers/autocomplete';
import * as api from 'amo/api';
import apiReducer from 'amo/reducers/api';
import { clearError } from 'amo/reducers/errors';
import autocompleteSaga from 'amo/sagas/autocomplete';
import {
  createFakeAutocompleteResult,
  createStubErrorHandler,
  dispatchSignInActions,
} from 'tests/unit/helpers';

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
        autocomplete: autocompleteReducer,
      },
    });
    sagaTester.start(autocompleteSaga);
  });

  function _autocompleteStart(params) {
    sagaTester.dispatch(
      autocompleteStart({
        errorHandlerId: 'create-stub-error-handler-id',
        ...params,
      }),
    );
  }

  it('calls the API for suggestions', async () => {
    const results = [createFakeAutocompleteResult()];
    const filters = { query: 'test' };

    mockApi
      .expects('autocomplete')
      .once()
      .returns(Promise.resolve({ results }));

    _autocompleteStart({ filters });

    const expectedLoadAction = autocompleteLoad({ results });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _autocompleteStart({ filters: { query: 'foo' } });

    await sagaTester.waitFor(clearError.type);
    expect(sagaTester.getCalledActions()[1]).toEqual(
      errorHandler.createClearingAction(),
    );
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('autocomplete').returns(Promise.reject(error));

    _autocompleteStart({ filters: {} });

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });

  it('cancels the fetch saga when receiving AUTOCOMPLETE_CANCELLED', async () => {
    mockApi
      .expects('autocomplete')
      .once()
      // Add a delay to the API call so that it slows down the fetch saga,
      // allowing the `autocompleteCancel()` to be handled. The delay does not
      // really matter since cancellation is expected as soon as
      // AUTOCOMPLETE_CANCELLED is fired.
      // eslint-disable-next-line no-promise-executor-return
      .returns(new Promise((resolve) => setTimeout(resolve, 500)));

    _autocompleteStart({ filters: {} });
    sagaTester.dispatch(autocompleteCancel());

    const expectedCancelAction = autocompleteCancel();

    await sagaTester.waitFor(expectedCancelAction.type);
    mockApi.verify();

    const cancelAction = sagaTester.getCalledActions()[2];
    expect(cancelAction).toEqual(expectedCancelAction);
  });

  it('can call the API for suggestions even after a cancellation', async () => {
    const results = [createFakeAutocompleteResult()];
    const filters = { query: 'test' };

    const autocompleteApi = mockApi.expects('autocomplete').twice();

    // This configures the API for the first autocomplete start.
    autocompleteApi
      .onCall(0)
      // Add a delay to the API call so that it slows down the fetch saga,
      // allowing the `autocompleteCancel()` to be handled. The delay does not
      // really matter since cancellation is expected as soon as
      // AUTOCOMPLETE_CANCELLED is fired.
      // eslint-disable-next-line no-promise-executor-return
      .returns(new Promise((resolve) => setTimeout(resolve, 500)));

    // This configures the API for the second autocomplete start.
    autocompleteApi.onCall(1).returns(Promise.resolve({ results }));

    // We start autocompletion, but then cancel it.
    _autocompleteStart({ filters });
    sagaTester.dispatch(autocompleteCancel());

    const expectedCancelAction = autocompleteCancel();
    await sagaTester.waitFor(expectedCancelAction.type);
    const cancelAction = sagaTester.getCalledActions()[2];
    expect(cancelAction).toEqual(expectedCancelAction);

    sagaTester.reset(true);

    // We start autocompletion and let it finish.
    _autocompleteStart({ filters });

    const expectedLoadAction = autocompleteLoad({ results });
    await sagaTester.waitFor(expectedLoadAction.type);
    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);

    mockApi.verify();
  });
});
