import deepEqual from 'deep-eql';

import * as api from 'core/api';
import {
  currentUserAccount,
  deleteUserPicture,
  editUserAccount,
  userAccount,
  userNotifications,
} from 'amo/api/users';
import { getCurrentUser } from 'amo/reducers/users';
import {
  createApiResponse,
  createUserAccountResponse,
  createUserNotificationsResponse,
} from 'tests/unit/helpers';
import {
  dispatchSignInActions,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  const mockResponse = (userParams = {}) => createApiResponse({
    jsonData: createUserAccountResponse(userParams),
  });

  describe('currentUserAccount', () => {
    it('fetches the current user profile', async () => {
      const state = dispatchClientMetadata().store.getState();

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/profile',
          state: state.api,
        })
        .returns(mockResponse());

      await currentUserAccount({ api: state.api });
      mockApi.verify();
    });
  });

  describe('editUserAccount', () => {
    const getParams = (params = {}) => {
      const state = dispatchSignInActions().store.getState();
      const userId = getCurrentUser(state.users).id;

      return { api: state.api, userId, ...params };
    };

    it('edits a userProfile and returns the new profile', async () => {
      const editableFields = {
        biography: 'I am a cool tester.',
        display_name: 'Super Krupa',
        homepage: 'http://qa-is-awesome.net',
        location: 'The Moon!',
        occupation: 'QA Master',
        username: 'krupa123',
      };
      const params = getParams(editableFields);

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          body: editableFields,
          endpoint: `accounts/account/${params.userId}`,
          method: 'PATCH',
          state: params.api,
        })
        .returns(mockResponse(editableFields));

      await editUserAccount(params);
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

      mockApi.expects('callApi')
        .withArgs(sinon.match(({ body }) => {
          return deepEqual(
            Array.from(body.entries()),
            Array.from(expectedBody.entries())
          );
        }))
        .returns(mockResponse());

      await editUserAccount(params);
      mockApi.verify();
    });
  });

  describe('userAccount', () => {
    it('fetches a user profile based on username', async () => {
      const state = dispatchSignInActions().store.getState();
      const username = 'tofumatt';
      const params = { api: state.api, username };

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.username}`,
          state: params.api,
        })
        .returns(mockResponse());

      await userAccount(params);
      mockApi.verify();
    });
  });

  describe('userNotifications', () => {
    it('fetches user notifications based on username', async () => {
      const state = dispatchClientMetadata().store.getState();
      const params = { api: state.api, username: 'tofumatt' };

      const notificationsResponse = createApiResponse({
        jsonData: createUserNotificationsResponse(),
      });

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.username}/notifications`,
          state: params.api,
        })
        .returns(notificationsResponse);

      await userNotifications(params);
      mockApi.verify();
    });
  });

  describe('deleteUserPicture', () => {
    it('deletes a user profile picture for a given user', async () => {
      const state = dispatchSignInActions().store.getState();
      const userId = getCurrentUser(state.users).id;
      const params = { api: state.api, userId };

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.userId}/picture`,
          method: 'DELETE',
          state: params.api,
        })
        .returns(createApiResponse());

      await deleteUserPicture(params);
      mockApi.verify();
    });
  });
});
