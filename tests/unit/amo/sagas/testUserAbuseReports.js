import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/abuse';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import userAbuseReportsReducer, {
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
      user: response.user,
    });

    await sagaTester.waitFor(expectedLoadAction.type);
    mockApi.verify();

    const loadAction = sagaTester.getCalledActions()[2];
    expect(loadAction).toEqual(expectedLoadAction);
  });

  it('clears the error handler', async () => {
    _sendUserAbuseReport();

    await sagaTester.waitFor(CLEAR_ERROR);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });

  it('dispatches an error', async () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('reportUser')
      .returns(Promise.reject(error));

    _sendUserAbuseReport();

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });

  it('throws an error if multiple reports are submitted for the same user', async () => {
    const user = createUserAccountResponse({ id: 50 });

    _sendUserAbuseReport({
      message: 'This add-on is malwaré!',
      user,
    });

    // Report the same add-on again; this will cause the reducer to throw
    // an error and the saga should dispatch an error.
    _sendUserAbuseReport({
      message: 'Duplicate!',
      user,
    });

    await sagaTester.waitFor(SET_ERROR);
    expect(sagaTester.getCalledActions()[1])
      .toEqual(errorHandler.createClearingAction());
  });
});
