import * as api from 'amo/api';
import { getSiteStatus } from 'amo/api/site';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getSiteStatus', () => {
    it('calls the site endpoint', async () => {
      const {
        api: apiState,
      } = dispatchClientMetadata().state;
      const mockApi = sinon.mock(api);
      mockApi.expects('callApi').withArgs({
        apiState,
        endpoint: `site`,
      }).resolves(createApiResponse());
      await getSiteStatus({
        api: apiState,
      });
      mockApi.verify();
    });
  });
});