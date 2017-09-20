import * as api from 'core/api';
import { reportAddon } from 'core/api/abuse';
import {
  dispatchClientMetadata,
  dispatchSignInActions,
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
    function _reportAddon(extraArguments = {}) {
      return reportAddon({
        ...extraArguments,
      });
    }

    function mockResponse({ addon, message }) {
      return createApiResponse({
        jsonData: createFakeAddonAbuseReport({ addon, message }),
      });
    }

    it('should allow anonymous users to report an add-on', () => {
      const apiState = dispatchClientMetadata().store.getState().api;
      const message = 'I do not like this!';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: false,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          params: { addon: 'cool-addon', message },
          state: apiState,
        })
        .once()
        .returns(mockResponse({
          addon: { ...fakeAddon, slug: 'cool-addon' },
          message,
        }));
      return _reportAddon({
        addonSlug: 'cool-addon',
        api: apiState,
        message,
      })
        .then(() => {
          mockApi.verify();
        });
    });

    it('should allow signed-in users to report an add-on', () => {
      const apiState = dispatchSignInActions().store.getState().api;
      const message = 'I bet everybody here is fake happy too.';

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'abuse/report/addon',
          method: 'POST',
          params: { addon: 'auth-addon', message },
          state: apiState,
        })
        .once()
        .returns(mockResponse({
          addon: { ...fakeAddon, slug: 'auth-addon' },
          message,
        }));
      return _reportAddon({
        addonSlug: 'auth-addon',
        api: apiState,
        auth: true,
        message,
      })
        .then(() => {
          mockApi.verify();
        });
    });
  });
});
