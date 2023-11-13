import SagaTester from 'redux-saga-tester';

import * as api from 'amo/api/abuse';
import { clearError } from 'amo/reducers/errors';
import collectionAbuseReportsReducer, {
  abortCollectionAbuseReport,
  loadCollectionAbuseReport,
  sendCollectionAbuseReport,
} from 'amo/reducers/collectionAbuseReports';
import apiReducer from 'amo/reducers/api';
import collectionAbuseReportsSaga from 'amo/sagas/collectionAbuseReports';
import {
  createFakeCollectionAbuseReport,
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
        collectionAbuseReports: collectionAbuseReportsReducer,
      },
    });
    sagaTester.start(collectionAbuseReportsSaga);
  });

  function _sendCollectionAbuseReport(params) {
    sagaTester.dispatch(
      sendCollectionAbuseReport({
        errorHandlerId: errorHandler.id,
        collectionId: 999999,
        message: 'abuse report body',
        ...params,
      }),
    );
  }

  it('calls the API for abuse', async () => {
    const collectionId = 123;
    const message = 'this is not a great collection';
    const response = createFakeCollectionAbuseReport({ collectionId, message });

    mockApi
      .expects('reportCollection')
      .once()
      .returns(Promise.resolve(response));

    _sendCollectionAbuseReport({ message, collectionId });

    const expectedLoadAction = loadCollectionAbuseReport({
      message: response.message,
      reporter: response.reporter,
      collectionId,
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('calls the API for abuse with a reason', async () => {
    const collectionId = 123;
    const reason = 'other';
    const response = createFakeCollectionAbuseReport({ collectionId, reason });

    mockApi
      .expects('reportCollection')
      .once()
      .returns(Promise.resolve(response));

    _sendCollectionAbuseReport({ collectionId, reason });

    const expectedLoadAction = loadCollectionAbuseReport({ collectionId });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _sendCollectionAbuseReport();

    const calledAction = await sagaTester.waitFor(clearError.type);
    expect(calledAction).toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('reportCollection').returns(Promise.reject(error));

    _sendCollectionAbuseReport();

    const errorAction = errorHandler.createErrorAction(error);
    const calledAction = await sagaTester.waitFor(errorAction.type);
    expect(calledAction).toEqual(errorAction);
  });

  it('resets the state when an error occurs', async () => {
    const collectionId = 123;
    const error = new Error('some API error maybe');
    mockApi.expects('reportCollection').returns(Promise.reject(error));

    _sendCollectionAbuseReport({ collectionId });

    const abortAction = abortCollectionAbuseReport({ collectionId });
    const calledAction = await sagaTester.waitFor(abortAction.type);
    expect(calledAction).toEqual(abortAction);
  });
});
