import * as api from 'core/api';
import { reportAddon } from 'core/api/abuse';
import {
  dispatchClientMetadata,
  fakeAddon,
} from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  createFakeAddonAbuseReport,
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
});
