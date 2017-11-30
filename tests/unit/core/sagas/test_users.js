import SagaTester from 'redux-saga-tester';

import usersSaga from 'amo/sagas/users';
import usersReducer, {
  fetchUserAccount,
  loadUserAccount,
} from 'amo/reducers/users';
import * as api from 'amo/api/users';
import apiReducer from 'core/reducers/api';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
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
    const initialState = dispatchClientMetadata().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        api: apiReducer,
        users: usersReducer,
      },
    });
    sagaTester.start(usersSaga);
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
