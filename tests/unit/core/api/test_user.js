import * as api from 'core/api';
import { userProfile } from 'core/api/user';
import {
  createApiResponse,
  createUserProfileResponse,
} from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('userProfile', () => {
    const mockResponse = () => createApiResponse({
      jsonData: createUserProfileResponse(),
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

      return userProfile({ api: state.api })
        .then(() => mockApi.verify());
    });

    it('throws an error if api state is missing', () => {
      expect(() => {
        userProfile({});
      }).toThrowError(/api state is required/);
    });
  });
});
