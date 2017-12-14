import SagaTester from 'redux-saga-tester';

import usersSaga from 'amo/sagas/users';
import usersReducer, {
  fetchUserAccount,
  loadCurrentUserAccount,
  loadUserAccount,
} from 'amo/reducers/users';
import * as api from 'amo/api/users';
import { setAuthToken } from 'core/actions';
import apiReducer from 'core/reducers/api';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createStubErrorHandler,
  createUserAccountResponse,
  userAuthToken,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;
  let rootTask;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(api);
    const initialState = dispatchClientMetadata().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        api: apiReducer,
        users: usersReducer,
      },
    });
    rootTask = sagaTester.start(usersSaga);
  });

  it('calls the API to fetch user profile after setAuthToken()', async () => {
    const user = createUserAccountResponse();

    mockApi
      .expects('currentUserAccount')
      .once()
      .returns(Promise.resolve(user));

    sagaTester.dispatch(setAuthToken(userAuthToken()));

    const expectedCalledAction = loadCurrentUserAccount({ user });

    await sagaTester.waitFor(expectedCalledAction.type);
    mockApi.verify();

    const calledAction = sagaTester.getCalledActions()[1];
    expect(calledAction).toEqual(expectedCalledAction);
  });

  it('allows exceptions to be thrown', () => {
    const expectedError = new Error('some API error maybe');
    mockApi
      .expects('currentUserAccount')
      .returns(Promise.reject(expectedError));

    sagaTester.dispatch(setAuthToken(userAuthToken()));

    return rootTask.done
      .then(() => {
        throw new Error('unexpected success');
      })
      .catch((error) => {
        mockApi.verify();
        expect(error).toBe(expectedError);
      });
  });

  it('calls the API to fetch user after fetchUserAccount()', async () => {
    const user = createUserAccountResponse();

    mockApi
      .expects('userAccount')
      .once()
      .returns(Promise.resolve(user));

    sagaTester.dispatch(fetchUserAccount({
      errorHandlerId: errorHandler.id,
      username: 'tofumatt',
    }));

    const expectedCalledAction = loadUserAccount({ user });

    await sagaTester.waitFor(expectedCalledAction.type);
    mockApi.verify();

    const calledAction = sagaTester.getCalledActions()[2];
    expect(calledAction).toEqual(expectedCalledAction);
  });

  it('dispatches an error', async () => {
    const error = new Error('a bad API error');
    mockApi
      .expects('userAccount')
      .returns(Promise.reject(error));

    sagaTester.dispatch(fetchUserAccount({
      errorHandlerId: errorHandler.id,
      username: 'tofumatt',
    }));

    const errorAction = errorHandler.createErrorAction(error);
    await sagaTester.waitFor(errorAction.type);
    expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
  });
});
