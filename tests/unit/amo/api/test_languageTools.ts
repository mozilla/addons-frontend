import * as api from 'amo/api';
import { languageTools } from 'amo/api/languageTools';
import { CLIENT_APP_ANDROID } from 'amo/constants';
import { createApiResponse, createFakeLanguageTool, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;
  beforeEach(() => {
    mockApi = sinon.mock(api);
  });
  describe('languageTools API', () => {
    function mockResponse() {
      return createApiResponse({
        jsonData: {
          results: [createFakeLanguageTool()],
        },
      });
    }

    it('calls the language tools API', async () => {
      const apiState = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      }).store.getState().api;
      mockApi.expects('callApi').withArgs({
        auth: true,
        endpoint: 'addons/language-tools',
        method: 'GET',
        params: {
          app: CLIENT_APP_ANDROID,
        },
        apiState,
      }).once().returns(mockResponse());
      const languageToolsResponse = await languageTools({
        api: apiState,
      });
      const jsonResponse = await languageToolsResponse.json();
      expect(jsonResponse).toEqual({
        results: [createFakeLanguageTool()],
      });
      mockApi.verify();
    });
  });
});