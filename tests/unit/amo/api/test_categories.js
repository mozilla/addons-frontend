import * as api from 'amo/api';
import { getCategories } from 'amo/api/categories';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getCategories', () => {
    it('calls the categories API', async () => {
      const { api: apiState } = dispatchClientMetadata().state;
      const mockApi = sinon.mock(api);

      mockApi
        .expects('callApi')
        .withArgs({
          apiState,
          endpoint: `addons/categories`,
        })
        .resolves(createApiResponse());

      await getCategories({ api: apiState });
      mockApi.verify();
    });
  });
});
