import { getVersions } from 'amo/api/versions';
import * as api from 'core/api';
import { createApiResponse } from 'tests/unit/helpers';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  describe('getVersions', () => {
    it('calls the version list API', async () => {
      const apiState = dispatchSignInActions().state.api;
      const mockApi = sinon.mock(api);
      const slug = 'some-slug';
      const params = {
        page: '123',
      };

      mockApi
        .expects('callApi')
        .withArgs({
          apiState,
          auth: true,
          endpoint: `addons/addon/${slug}/versions/`,
          params,
        })
        .once()
        .resolves(createApiResponse());

      await getVersions({ api: apiState, slug, ...params });
      mockApi.verify();
    });
  });
});
