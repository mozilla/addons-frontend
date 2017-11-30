import * as api from 'core/api';
import { userAccount } from 'amo/api/users';
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

  describe('userAccount', () => {
    const mockResponse = () => createApiResponse({
      jsonData: createUserAccountResponse(),
    });

    it('fetches the current user profile', () => {
      const state = dispatchClientMetadata().store.getState();
      const username = 'tofumatt';

      mockApi.expects('callApi')
        .withArgs({
          auth: true,
          endpoint: `accounts/account/${username}`,
          state: state.api,
        })
        .returns(mockResponse());

      return userAccount({ api: state.api, username })
        .then(() => mockApi.verify());
    });

    it('throws an error if api state is missing', () => {
      expect(() => {
        userAccount({ username: 'sweet-little-duck' });
      }).toThrowError(/api state is required/);
    });

    it('throws an error if username is missing', () => {
      expect(() => {
        userAccount({ api: dispatchClientMetadata().store.getState().api });
      }).toThrowError(/username is required/);
    });
  });
});
