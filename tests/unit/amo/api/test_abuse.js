import * as api from 'amo/api';
import { reportAddon, reportUser } from 'amo/api/abuse';
import {
  createApiResponse,
  createFakeAddonAbuseReport,
  createFakeUserAbuseReport,
  createUserAccountResponse,
  dispatchClientMetadata,
  fakeAddon,
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

    it('calls the report add-on abuse API', async () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';
      const reason = 'does_not_work';
      const reporterName = 'Foxy';
      const reporterEmail = 'fox@moz.co';
      const addonId = 'cool-addon';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          body: {
            addon: addonId,
            message,
            reason,
            reporter_email: reporterEmail,
            reporter_name: reporterName,
          },
          apiState,
        })
        .once()
        .returns(
          mockResponse({
            addon: { ...fakeAddon, slug: 'cool-addon' },
            message,
          }),
        );

      await reportAddon({
        addonId,
        api: apiState,
        message,
        reason,
        reporterEmail,
        reporterName,
      });

      mockApi.verify();
    });
  });

  describe('reportUser', () => {
    function mockResponse({ message, user }) {
      return createApiResponse({
        jsonData: createFakeUserAbuseReport({ message, user }),
      });
    }

    it('calls the report add-on abuse API', async () => {
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
          apiState,
        })
        .once()
        .returns(mockResponse({ message, user }));

      await reportUser({
        api: apiState,
        message,
        userId: user.id,
      });

      mockApi.verify();
    });
  });
});
