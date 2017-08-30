import SagaTester from 'redux-saga-tester';

import userSaga from 'core/sagas/user';
import userReducer, { loadUserProfile } from 'core/reducers/user';
import * as api from 'core/api/user';
import apiReducer from 'core/reducers/api';
import { setAuthToken } from 'core/actions';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { createUserProfileResponse, userAuthToken } from 'tests/unit/helpers';


describe(__filename, () => {
  let mockApi;
  let sagaTester;
  let rootTask;

  beforeEach(() => {
    mockApi = sinon.mock(api);
    const initialState = dispatchClientMetadata().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        api: apiReducer,
        user: userReducer,
      },
    });
    rootTask = sagaTester.start(userSaga);
  });

  it('calls the API to fetch user profile after setAuthToken()', async () => {
    const profile = createUserProfileResponse();

    mockApi
      .expects('userProfile')
      .once()
      .returns(Promise.resolve(profile));

    sagaTester.dispatch(setAuthToken(userAuthToken()));

    const expectedCalledAction = loadUserProfile({ profile });

    await sagaTester.waitFor(expectedCalledAction.type);
    mockApi.verify();

    const calledAction = sagaTester.getCalledActions()[1];
    expect(calledAction).toEqual(expectedCalledAction);
  });

  it('lets exceptions to be thrown', () => {
    const error = new Error('some API error maybe');
    mockApi
      .expects('userProfile')
      .returns(Promise.reject(error));

    sagaTester.dispatch(setAuthToken(userAuthToken()));

    return rootTask.done
      .then(() => {
        throw new Error('unexpected success');
      })
      .catch((expectedError) => {
        mockApi.verify();
        expect(expectedError).toBe(error);
      });
  });
});
