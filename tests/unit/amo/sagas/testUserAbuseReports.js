import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/abuse';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import userAbuseReportsReducer, {
  abortUserAbuseReport,
  loadUserAbuseReport,
  sendUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import apiReducer from 'core/reducers/api';
import userAbuseReportsSaga from 'amo/sagas/userAbuseReports';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import {
  createFakeUserAbuseReport,
  createStubErrorHandler,
  createUserAccountResponse,
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
    sagaTester.dispatch(sendUserAbuseReport({
      errorHandlerId: errorHandler.id,
      message: 'Testing',
      user: createUserAccountResponse(),
      ...params,
    }));
  }

  it('calls the API for abuse', async () => {
    const user = createUserAccountResponse({ id: 50 });
    const message = 'I would prefer the user be XUL';
    const response = createFakeUserAbuseReport({ message, user });

    mockApi
      .expects('reportUser')
      .once()
      .returns(Promise.resolve(response));

    _sendUserAbuseReport({ message, user });

    const expectedLoadAction = loadUserAbuseReport({
      message: response.message,
      reporter: response.reporter,
      user,
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('handles an empty reporter', async () => {
    const user = createUserAccountResponse({ id: 50 });
    const message = 'I have no reporter';
    const response = createFakeUserAbuseReport({
      message,
      reporter: null,
      user,
    });

    mockApi
      .expects('reportUser')
      .once()
      .returns(Promise.resolve(response));

    _sendUserAbuseReport({ message, user });

    const expectedLoadAction = loadUserAbuseReport({
      message: response.message,
      reporter: response.reporter,
      user,
    });

    const calledAction = await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    expect(calledAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _sendUserAbuseReport();

    const calledAction = await sagaTester.waitFor(CLEAR_ERROR);
    expect(calledAction).toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('reportUser')
      .returns(Promise.reject(error));

    _sendUserAbuseReport();

    const errorAction = errorHandler.createErrorAction(error);
    const calledAction = await sagaTester.waitFor(errorAction.type);
    expect(calledAction).toEqual(errorAction);
  });

  it('resets the state when an error occurs', async () => {
    const user = createUserAccountResponse({ id: 501 });
    const error = new Error('some API error maybe');
    mockApi
      .expects('reportUser')
      .returns(Promise.reject(error));

    _sendUserAbuseReport({ user });

    const abortAction = abortUserAbuseReport({ user });
    const calledAction = await sagaTester.waitFor(abortAction.type);
    expect(calledAction).toEqual(abortAction);
  });

  it('throws an error if multiple reports are submitted for the same user', async () => {
    const user = createUserAccountResponse({ id: 50 });

    _sendUserAbuseReport({
      message: 'This user is uncool!',
      user,
    });

    // Report the same add-on again; this will cause the reducer to throw
    // an error and the saga should dispatch an error.
    _sendUserAbuseReport({
      message: 'Duplicate!',
      user,
    });

    await sagaTester.waitFor(SET_ERROR);
    const calledAction = await sagaTester.waitFor(CLEAR_ERROR);
    expect(calledAction).toEqual(errorHandler.createClearingAction());
  });
});
