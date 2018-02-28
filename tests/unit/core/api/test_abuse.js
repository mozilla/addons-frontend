import * as api from 'core/api';
import { reportAddon, reportUser } from 'core/api/abuse';
import {
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  createFakeAddonAbuseReport,
  createFakeUserAbuseReport,
  createUserAccountResponse,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('reportAddon', () => {
    function mockResponse({ addon, message }) {
      return createApiResponse({
        jsonData: createFakeAddonAbuseReport({ addon, message }),
      });
    }

    it('calls the report add-on abuse API', () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          body: { addon: 'cool-addon', message },
          state: apiState,
        })
        .once()
        .returns(mockResponse({
          addon: { ...fakeAddon, slug: 'cool-addon' },
          message,
        }));
      return reportAddon({
        addonSlug: 'cool-addon',
        api: apiState,
        message,
      })
        .then(() => {
          mockApi.verify();
        });
    });
  });

  describe('reportUser', () => {
    function mockResponse({ message, user }) {
      return createApiResponse({
        jsonData: createFakeUserAbuseReport({ message, user }),
      });
    }

    it('calls the report add-on abuse API', () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const user = createUserAccountResponse({ id: 5001 });

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/user',
          method: 'POST',
          body: { message, user: '5001' },
          state: apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));
      return reportUser({
        api: apiState,
        message,
        user,
      })
        .then(() => {
          mockApi.verify();
        });
    });
  });
});
