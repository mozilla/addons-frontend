import SagaTester from 'redux-saga-tester';

import * as api from 'amo/api/abuse';
import { clearError } from 'amo/reducers/errors';
import userAbuseReportsReducer, {
  abortUserAbuseReport,
  loadUserAbuseReport,
  sendUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import apiReducer from 'amo/reducers/api';
import userAbuseReportsSaga from 'amo/sagas/userAbuseReports';
import {
  createFakeUserAbuseReport,
  createStubErrorHandler,
  createUserAccountResponse,
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
        userAbuseReports: userAbuseReportsReducer,
      },
    });
    sagaTester.start(userAbuseReportsSaga);
  });

  function _sendUserAbuseReport(params) {
    sagaTester.dispatch(
      sendUserAbuseReport({
        errorHandlerId: errorHandler.id,
        message: 'Testing',
        userId: createUserAccountResponse().id,
        ...params,
      }),
    );
  }

  it('calls the API for abuse', async () => {
    const userId = createUserAccountResponse({ id: 50 }).id;
    const message = 'I would prefer the user be XUL';
    const response = createFakeUserAbuseReport({ message, userId });

    mockApi.expects('reportUser').once().returns(Promise.resolve(response));

    _sendUserAbuseReport({ message, userId });

    const expectedLoadAction = loadUserAbuseReport({
      message: response.message,
      reporter: response.reporter,
      userId,
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('calls the API for abuse with a reason', async () => {
    const userId = createUserAccountResponse({ id: 50 }).id;
    const reason = 'other';
    const response = createFakeUserAbuseReport({ userId, message: '' });

    mockApi.expects('reportUser').once().returns(Promise.resolve(response));

    _sendUserAbuseReport({ userId, reason });

    const expectedLoadAction = loadUserAbuseReport({
      reporter: response.reporter,
      userId,
      message: '',
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('handles an empty reporter', async () => {
    const userId = createUserAccountResponse({ id: 50 }).id;
    const message = 'I have no reporter';
    const response = createFakeUserAbuseReport({
      message,
      reporter: null,
      userId,
    });

    mockApi.expects('reportUser').once().returns(Promise.resolve(response));

    _sendUserAbuseReport({ message, userId });

    const expectedLoadAction = loadUserAbuseReport({
      message: response.message,
      reporter: response.reporter,
      userId,
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _sendUserAbuseReport();

    const calledAction = await sagaTester.waitFor(clearError.type);
    expect(calledAction).toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi.expects('reportUser').returns(Promise.reject(error));

    _sendUserAbuseReport();

    const errorAction = errorHandler.createErrorAction(error);
    const calledAction = await sagaTester.waitFor(errorAction.type);
    expect(calledAction).toEqual(errorAction);
  });

  it('resets the state when an error occurs', async () => {
    const userId = createUserAccountResponse({ id: 501 }).id;
    const error = new Error('some API error maybe');
    mockApi.expects('reportUser').returns(Promise.reject(error));

    _sendUserAbuseReport({ userId });

    const abortAction = abortUserAbuseReport({ userId });
    const calledAction = await sagaTester.waitFor(abortAction.type);
    expect(calledAction).toEqual(abortAction);
  });
});
