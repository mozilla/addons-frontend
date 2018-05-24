import SagaTester from 'redux-saga-tester';

import usersSaga from 'amo/sagas/users';
import usersReducer, {
  deleteUserPicture,
  editUserAccount,
  fetchUserAccount,
  finishEditUserAccount,
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

  describe('loadCurrentUserAccount', () => {
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
      const expectedError = new Error('this error should be thrown');
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
  });

  describe('loadUserAccount', () => {
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

  describe('editUserAccount', () => {
    it('calls the API to edit a user after editUserAccount()', async () => {
      const user = createUserAccountResponse({ id: 5001 });
      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };

      mockApi
        .expects('editUserAccount')
        .once()
        .returns(Promise.resolve({ ...user, ...userFields }));

      sagaTester.dispatch(editUserAccount({
        errorHandlerId: errorHandler.id,
        userFields,
        userId: user.id,
      }));

      const expectedCalledAction = loadUserAccount({
        user: { ...user, ...userFields },
      });

      const expectedErrorClearingAction = errorHandler.createClearingAction();
      const errorClearingAction = await sagaTester.waitFor(
        expectedErrorClearingAction.type);
      expect(errorClearingAction).toEqual(expectedErrorClearingAction);

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      mockApi.verify();
      expect(calledAction).toEqual(expectedCalledAction);

      // Make sure the finish action is also called.
      const finishAction = finishEditUserAccount();

      const calledFinishAction = await sagaTester.waitFor(finishAction.type);
      expect(calledFinishAction.payload).toEqual({});
    });

    it('optionally takes a picture file', async () => {
      const state = sagaTester.getState();
      const user = createUserAccountResponse({ id: 5001 });

      const picture = new File([], 'some-image.png');
      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };

      mockApi
        .expects('editUserAccount')
        .withArgs({
          api: state.api,
          userId: user.id,
          picture,
          ...userFields,
        })
        .once()
        .returns(Promise.resolve({ ...user, ...userFields }));

      sagaTester.dispatch(editUserAccount({
        errorHandlerId: errorHandler.id,
        picture,
        userFields,
        userId: user.id,
      }));

      const expectedCalledAction = loadUserAccount({
        user: { ...user, ...userFields },
      });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      mockApi.verify();
      expect(calledAction).toEqual(expectedCalledAction);
    });

    it('cancels the edit and dispatches an error when fails', async () => {
      const user = createUserAccountResponse({ id: 5001 });
      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };
      const error = new Error('a bad API error');

      mockApi
        .expects('editUserAccount')
        .returns(Promise.reject(error));

      sagaTester.dispatch(editUserAccount({
        errorHandlerId: errorHandler.id,
        userFields,
        userId: user.id,
      }));

      const finishAction = finishEditUserAccount();

      const calledFinishAction = await sagaTester.waitFor(finishAction.type);
      expect(calledFinishAction.payload).toEqual({});

      const errorAction = errorHandler.createErrorAction(error);
      const calledAction = await sagaTester.waitFor(errorAction.type);
      expect(calledAction).toEqual(errorAction);
    });
  });

  describe('deleteUserPicture', () => {
    it('calls the API to delete a profile picture', async () => {
      const state = sagaTester.getState();
      const user = createUserAccountResponse({ id: 5001 });

      mockApi
        .expects('deleteUserPicture')
        .once()
        .withArgs({
          api: state.api,
          userId: user.id,
        })
        .returns(Promise.resolve(user));

      sagaTester.dispatch(deleteUserPicture({
        errorHandlerId: errorHandler.id,
        userId: user.id,
      }));

      const expectedCalledAction = loadUserAccount({ user });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      mockApi.verify();
      expect(calledAction).toEqual(expectedCalledAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('a bad API error');

      mockApi
        .expects('deleteUserPicture')
        .returns(Promise.reject(error));

      sagaTester.dispatch(deleteUserPicture({
        errorHandlerId: errorHandler.id,
        userId: 123,
      }));

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });
});
