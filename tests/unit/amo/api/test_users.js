import * as api from 'core/api';
import { currentUserAccount, userAccount } from 'amo/api/users';
import {
  createApiResponse,
  createUserAccountResponse,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('currentUserAccount', () => {
    const mockResponse = () => createApiResponse({
      jsonData: createUserAccountResponse(),
    });

    it('fetches the current user profile', () => {
      const state = dispatchClientMetadata().store.getState();

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'accounts/profile',
          state: state.api,
        })
        .returns(mockResponse());

      return currentUserAccount({ api: state.api })
        .then(() => {
          mockApi.verify();
        });
    });

    it('throws an error if api state is missing', () => {
      expect(() => {
        currentUserAccount({});
      }).toThrowError(/api state is required/);
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

    it('fetches a user profile based on username', () => {
      const params = getParams();

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${params.username}`,
          state: params.api,
        })
        .returns(mockResponse());

      return userAccount(params)
        .then(() => {
          mockApi.verify();
        });
    });

    it('throws an error if api state is missing', () => {
      const params = getParams();
      delete params.api;

      expect(() => {
        userAccount(params);
      }).toThrowError(/api state is required/);
    });

    it('throws an error if username is missing', () => {
      const params = getParams();
      delete params.username;

      expect(() => {
        userAccount(params);
      }).toThrowError(/username is required/);
    });
  });
});
