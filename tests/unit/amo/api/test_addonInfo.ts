import { getAddonInfo } from 'amo/api/addonInfo';
import * as api from 'amo/api';
import { createApiResponse, dispatchSignInActions } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getAddonInfo', () => {
    it('calls the eula_policy API', async () => {
      const apiState = dispatchSignInActions().state.api;
      const mockApi = sinon.mock(api);
      const slug = 'some-slug';
      mockApi.expects('callApi').withArgs({
        apiState,
        auth: true,
        endpoint: `addons/addon/${slug}/eula_policy/`,
      }).once().resolves(createApiResponse());
      await getAddonInfo({
        api: apiState,
        slug,
      });
      mockApi.verify();
    });
  });
});