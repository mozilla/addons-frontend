import deepEqual from 'deep-eql';

import * as api from 'core/api';
import {
  currentUserAccount,
  deleteUserAccount,
  deleteUserPicture,
  updateUserAccount,
  updateUserNotifications,
  userAccount,
  userNotifications,
} from 'amo/api/users';
import { getCurrentUser } from 'amo/reducers/users';
import {
  createApiResponse,
  createUserAccountResponse,
  createUserNotificationsResponse,
  dispatchSignInActions,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  const mockResponse = (userParams = {}) =>
    createApiResponse({
      jsonData: createUserAccountResponse(userParams),
    });

  describe('currentUserAccount', () => {
    it('fetches the current user profile', async () => {
      const state = dispatchClientMetadata().store.getState();

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/profile',
          apiState: state.api,
        })
        .returns(mockResponse());

      await currentUserAccount({ api: state.api });
      mockApi.verify();
    });
  });

  describe('updateUserAccount', () => {
    const getParams = (params = {}) => {
      const { state } = dispatchSignInActions();
      const userId = getCurrentUser(state.users).id;

      return { api: state.api, userId, ...params };
    };

    it('updates a user profile and returns the new profile', async () => {
      const editableFields = {
        biography: 'I am a cool tester.',
        display_name: 'Super Krupa',
        homepage: 'http://qa-is-awesome.net',
        location: 'The Moon!',
        occupation: 'QA Master',
        username: 'krupa123',
      };
      const params = getParams(editableFields);

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: editableFields,
          endpoint: `accounts/account/${params.userId}`,
          method: 'PATCH',
          apiState: params.api,
        })
        .returns(mockResponse(editableFields));

      await updateUserAccount(params);
      mockApi.verify();
    });

    it('sends a FormData body when a picture file is supplied', async () => {
      const editableFields = {
        biography: 'I am a cool tester.',
      };
      const picture = new File([], 'image.png');
      const params = getParams({ picture, ...editableFields });

      const expectedBody = new FormData();
      expectedBody.set('biography', editableFields.biography);
      expectedBody.set('picture_upload', picture);

      mockApi
        .expects('callApi')
        .withArgs(
          sinon.match(({ body }) => {
            return deepEqual(
              Array.from(body.entries()),
              Array.from(expectedBody.entries()),
            );
          }),
        )
        .returns(mockResponse());

      await updateUserAccount(params);
      mockApi.verify();
    });

    it('converts null values to empty strings when sending FormData body', async () => {
      const editableFields = {
        biography: null,
        location: 'some location',
      };
      const picture = new File([], 'image.png');
      const params = getParams({ picture, ...editableFields });

      const expectedBody = new FormData();
      expectedBody.set('biography', '');
      expectedBody.set('location', editableFields.location);
      expectedBody.set('picture_upload', picture);

      mockApi
        .expects('callApi')
        .withArgs(
          sinon.match(({ body }) => {
            return deepEqual(
              Array.from(body.entries()),
              Array.from(expectedBody.entries()),
            );
          }),
        )
        .returns(mockResponse());

      await updateUserAccount(params);
      mockApi.verify();
    });
  });

  describe('userAccount', () => {
    it('fetches a user profile based on user ID', async () => {
      const { state } = dispatchSignInActions();
      const params = { api: state.api, userId: 123 };

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}`,
          apiState: params.api,
        })
        .returns(mockResponse());

      await userAccount(params);
      mockApi.verify();
    });
  });

  describe('userNotifications', () => {
    it('fetches user notifications based on user ID', async () => {
      const { state } = dispatchSignInActions();
      const params = { api: state.api, userId: 123 };

      const notificationsResponse = createApiResponse({
        jsonData: createUserNotificationsResponse(),
      });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}/notifications`,
          apiState: params.api,
        })
        .returns(notificationsResponse);

      await userNotifications(params);
      mockApi.verify();
    });
  });

  describe('deleteUserPicture', () => {
    it('deletes a user profile picture for a given user', async () => {
      const { state } = dispatchSignInActions();
      const userId = getCurrentUser(state.users).id;
      const params = { api: state.api, userId };

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}/picture`,
          method: 'DELETE',
          apiState: params.api,
        })
        .returns(createApiResponse());

      await deleteUserPicture(params);
      mockApi.verify();
    });
  });

  describe('deleteUserAccount', () => {
    it('deletes a user profile', async () => {
      const { state } = dispatchSignInActions();
      const userId = getCurrentUser(state.users).id;
      const params = { api: state.api, userId };

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          credentials: true,
          endpoint: `accounts/account/${params.userId}`,
          method: 'DELETE',
          apiState: params.api,
        })
        .returns(createApiResponse());

      await deleteUserAccount(params);
      mockApi.verify();
    });
  });

  describe('updateUserNotifications', () => {
    it('updates the user notifications of a given user', async () => {
      const { state } = dispatchSignInActions();
      const userId = getCurrentUser(state.users).id;

      const notifications = { reply: true };
      const params = { api: state.api, notifications, userId };

      const notificationsResponse = createApiResponse({
        jsonData: createUserNotificationsResponse(),
      });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          body: params.notifications,
          endpoint: `accounts/account/${params.userId}/notifications`,
          method: 'POST',
          apiState: params.api,
        })
        .returns(notificationsResponse);

      await updateUserNotifications(params);
      mockApi.verify();
    });
  });
});
