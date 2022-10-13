import { getVersion, getVersions } from 'amo/api/versions';
import * as api from 'amo/api';
import { createApiResponse, dispatchSignInActions } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getVersions', () => {
    it('calls the version list API to get all versions for an add-on', async () => {
      const apiState = dispatchSignInActions().state.api;
      const mockApi = sinon.mock(api);
      const slug = 'some-slug';
      const params = {
        page: '123',
      };
      mockApi.expects('callApi').withArgs({
        apiState,
        auth: true,
        endpoint: `addons/addon/${slug}/versions/`,
        params,
      }).once().resolves(createApiResponse());
      await getVersions({
        api: apiState,
        slug,
        ...params,
      });
      mockApi.verify();
    });
  });
  describe('getVersion', () => {
    it('can retrieve a single version', async () => {
      const apiState = dispatchSignInActions().state.api;
      const mockApi = sinon.mock(api);
      const slug = 'some-slug';
      const versionId = 123;
      mockApi.expects('callApi').withArgs({
        apiState,
        auth: true,
        endpoint: `addons/addon/${slug}/versions/${versionId}/`,
      }).once().resolves(createApiResponse());
      await getVersion({
        api: apiState,
        slug,
        versionId,
      });
      mockApi.verify();
    });
  });
});