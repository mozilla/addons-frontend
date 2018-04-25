import * as api from 'core/api';
import {
  currentUserAccount,
  editUserAccount,
  userAccount,
} from 'amo/api/users';
import { getCurrentUser } from 'amo/reducers/users';
import {
  createApiResponse,
  createUserAccountResponse,
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

  describe('currentUserAccount', () => {
    const mockResponse = () => createApiResponse({
      jsonData: createUserAccountResponse(),
    });

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
    const mockResponse = (newParams) => createApiResponse({
      jsonData: createUserAccountResponse(newParams),
    });

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
  });

  describe('userAccount', () => {
    const mockResponse = () => createApiResponse({
      jsonData: createUserAccountResponse(),
    });

    const getParams = (params = {}) => {
      const state = dispatchClientMetadata().store.getState();
      const username = 'tofumatt';

      return { api: state.api, username, ...params };
    };

    it('fetches a user profile based on username', async () => {
      const params = getParams();

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
});
