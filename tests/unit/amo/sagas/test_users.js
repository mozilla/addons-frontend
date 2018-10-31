import SagaTester from 'redux-saga-tester';

import usersSaga from 'amo/sagas/users';
import usersReducer, {
  deleteUserAccount,
  deleteUserPicture,
  updateUserAccount,
  fetchUserAccount,
  fetchUserNotifications,
  finishUpdateUserAccount,
  loadCurrentUserAccount,
  loadUserAccount,
  loadUserNotifications,
  unloadUserAccount,
} from 'amo/reducers/users';
import * as api from 'amo/api/users';
import { setAuthToken } from 'core/actions';
import apiReducer from 'core/reducers/api';
import {
  createApiResponse,
  createStubErrorHandler,
  createUserAccountResponse,
  createUserNotificationsResponse,
  dispatchClientMetadata,
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

  describe('fetchUserAccount', () => {
    it('calls the API to fetch user', async () => {
      const user = createUserAccountResponse();

      mockApi
        .expects('userAccount')
        .once()
        .returns(Promise.resolve(user));

      sagaTester.dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          userId: 123,
        }),
      );

      const expectedCalledAction = loadUserAccount({ user });

      await sagaTester.waitFor(expectedCalledAction.type);
      mockApi.verify();

      const calledAction = sagaTester.getCalledActions()[2];
      expect(calledAction).toEqual(expectedCalledAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('a bad API error');
      mockApi.expects('userAccount').returns(Promise.reject(error));

      sagaTester.dispatch(
        fetchUserAccount({
          errorHandlerId: errorHandler.id,
          userId: 123,
        }),
      );

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });

  describe('updateUserAccount', () => {
    it('calls the API to update a user after updateUserAccount()', async () => {
      const user = createUserAccountResponse({ id: 5001 });
      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };

      mockApi
        .expects('updateUserAccount')
        .once()
        .returns(Promise.resolve({ ...user, ...userFields }));

      sagaTester.dispatch(
        updateUserAccount({
          errorHandlerId: errorHandler.id,
          notifications: {},
          picture: null,
          userFields,
          userId: user.id,
        }),
      );

      const expectedCalledAction = loadUserAccount({
        user: { ...user, ...userFields },
      });

      const expectedErrorClearingAction = errorHandler.createClearingAction();
      const errorClearingAction = await sagaTester.waitFor(
        expectedErrorClearingAction.type,
      );
      expect(errorClearingAction).toEqual(expectedErrorClearingAction);

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      mockApi.verify();
      expect(calledAction).toEqual(expectedCalledAction);

      // Make sure the finish action is also called.
      const finishAction = finishUpdateUserAccount();

      const calledFinishAction = await sagaTester.waitFor(finishAction.type);
      expect(calledFinishAction.payload).toEqual({});
    });

    it('can receive a picture file and picture data in payload', async () => {
      const state = sagaTester.getState();
      const user = createUserAccountResponse({ id: 5001 });

      const picture = new File([], 'some-image.png');
      const pictureData = 'image';

      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };

      mockApi
        .expects('updateUserAccount')
        .withArgs({
          api: state.api,
          userId: user.id,
          picture,
          ...userFields,
        })
        .once()
        .returns(Promise.resolve({ ...user, ...userFields }));

      sagaTester.dispatch(
        updateUserAccount({
          errorHandlerId: errorHandler.id,
          notifications: {},
          picture,
          pictureData,
          userFields,
          userId: user.id,
        }),
      );

      const expectedCalledAction = loadUserAccount({
        user: {
          ...user,
          ...userFields,
          picture_url: pictureData,
        },
      });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      mockApi.verify();
      expect(calledAction).toEqual(expectedCalledAction);
    });

    it('can receive a non-empty notifications object (dict) in payload', async () => {
      const state = sagaTester.getState();

      const userId = 5001;
      const user = createUserAccountResponse({ id: userId, username: 'babar' });

      const notifications = {
        reply: false,
      };
      const allNotifications = createUserNotificationsResponse();
      allNotifications[0].enabled = notifications.reply;

      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };

      mockApi
        .expects('updateUserAccount')
        .withArgs({
          api: state.api,
          picture: null,
          userId: user.id,
          ...userFields,
        })
        .once()
        .returns(Promise.resolve({ ...user, ...userFields }));

      mockApi
        .expects('updateUserNotifications')
        .withArgs({
          api: state.api,
          notifications,
          userId: user.id,
        })
        .once()
        .returns(Promise.resolve(allNotifications));

      sagaTester.dispatch(
        updateUserAccount({
          errorHandlerId: errorHandler.id,
          notifications,
          picture: null,
          userFields,
          userId: user.id,
        }),
      );

      const expectedCalledAction = loadUserNotifications({
        notifications: allNotifications,
        userId,
      });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      expect(calledAction).toEqual(expectedCalledAction);
      mockApi.verify();
    });

    it('cancels the update and dispatches an error when fails', async () => {
      const user = createUserAccountResponse({ id: 5001 });
      const userFields = {
        biography: 'I fell into a burning ring of fire.',
        location: 'Folsom Prison',
      };
      const error = new Error('a bad API error');

      mockApi.expects('updateUserAccount').returns(Promise.reject(error));

      sagaTester.dispatch(
        updateUserAccount({
          errorHandlerId: errorHandler.id,
          notifications: {},
          picture: null,
          userFields,
          userId: user.id,
        }),
      );

      const finishAction = finishUpdateUserAccount();

      const calledFinishAction = await sagaTester.waitFor(finishAction.type);
      expect(calledFinishAction.payload).toEqual({});

      const errorAction = errorHandler.createErrorAction(error);
      const calledAction = await sagaTester.waitFor(errorAction.type);
      expect(calledAction).toEqual(errorAction);
    });

    // See: https://github.com/mozilla/addons-frontend/issues/5219
    it('overrides the "announcements" notification if updated', async () => {
      const ANNOUNCEMENTS_NOTIFICATION = 'announcements';

      const state = sagaTester.getState();

      const userId = 5001;
      const user = createUserAccountResponse({ id: userId, username: 'babar' });

      // Set the "announcements" notification to false by default.
      const currentNotifications = createUserNotificationsResponse().map(
        (notification) => {
          if (notification.name !== ANNOUNCEMENTS_NOTIFICATION) {
            return notification;
          }

          return {
            ...notification,
            enabled: false,
          };
        },
      );

      const updatedNotifications = {
        [ANNOUNCEMENTS_NOTIFICATION]: false,
      };

      mockApi
        .expects('updateUserAccount')
        .withArgs({
          api: state.api,
          picture: null,
          userId: user.id,
        })
        .once()
        .returns(Promise.resolve(user));

      mockApi
        .expects('updateUserNotifications')
        .withArgs({
          api: state.api,
          notifications: updatedNotifications,
          userId: user.id,
        })
        .once()
        // The API returns the currentNotifications because the Basket
        // synchronization takes time.
        .returns(Promise.resolve(currentNotifications));

      sagaTester.dispatch(
        updateUserAccount({
          errorHandlerId: errorHandler.id,
          notifications: updatedNotifications,
          picture: null,
          userFields: {},
          userId: user.id,
        }),
      );

      const newNotifications = currentNotifications.map((notification) => {
        if (notification.name !== ANNOUNCEMENTS_NOTIFICATION) {
          return notification;
        }

        return {
          ...notification,
          enabled: updatedNotifications[ANNOUNCEMENTS_NOTIFICATION],
        };
      });

      const expectedCalledAction = loadUserNotifications({
        notifications: newNotifications,
        userId,
      });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      expect(calledAction).toEqual(expectedCalledAction);
      mockApi.verify();
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

      sagaTester.dispatch(
        deleteUserPicture({
          errorHandlerId: errorHandler.id,
          userId: user.id,
        }),
      );

      const expectedCalledAction = loadUserAccount({ user });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      expect(calledAction).toEqual(expectedCalledAction);
      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('a bad API error');
      mockApi.expects('deleteUserPicture').returns(Promise.reject(error));

      sagaTester.dispatch(
        deleteUserPicture({
          errorHandlerId: errorHandler.id,
          userId: 123,
        }),
      );

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });

  describe('fetchUserNotifications', () => {
    it('calls the API to fetch the notifications of a user', async () => {
      const userId = 'tofumatt';

      const user = createUserAccountResponse({ id: userId });
      sagaTester.dispatch(loadCurrentUserAccount({ user }));

      const notifications = createUserNotificationsResponse();

      mockApi
        .expects('userNotifications')
        .once()
        .returns(Promise.resolve(notifications));

      sagaTester.dispatch(
        fetchUserNotifications({
          errorHandlerId: errorHandler.id,
          userId,
        }),
      );

      const expectedCalledAction = loadUserNotifications({
        notifications,
        userId,
      });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      expect(calledAction).toEqual(expectedCalledAction);
      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('a bad API error');
      mockApi.expects('userNotifications').returns(Promise.reject(error));

      sagaTester.dispatch(
        fetchUserNotifications({
          errorHandlerId: errorHandler.id,
          userId: 123,
        }),
      );

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });

  describe('deleteUserAccount', () => {
    it('calls the API to delete a profile', async () => {
      const state = sagaTester.getState();
      const userId = 123;

      mockApi
        .expects('deleteUserAccount')
        .once()
        .withArgs({
          api: state.api,
          userId,
        })
        .returns(createApiResponse());

      sagaTester.dispatch(
        deleteUserAccount({
          errorHandlerId: errorHandler.id,
          userId,
        }),
      );

      const expectedCalledAction = unloadUserAccount({ userId });

      const calledAction = await sagaTester.waitFor(expectedCalledAction.type);

      expect(calledAction).toEqual(expectedCalledAction);
      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('a bad API error');
      mockApi.expects('deleteUserAccount').returns(Promise.reject(error));

      sagaTester.dispatch(
        deleteUserAccount({
          errorHandlerId: errorHandler.id,
          userId: 123,
        }),
      );

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });
  });
});
