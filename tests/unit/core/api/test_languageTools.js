import * as api from 'core/api';
import { languageTools } from 'core/api/languageTools';
import { CLIENT_APP_ANDROID } from 'core/constants';
import {
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';
import {
  createApiResponse,
  createFakeLanguageAddon,
} from 'tests/unit/helpers';


describe(__filename, () => {
  let mockApi;

  beforeEach(() => {
    mockApi = sinon.mock(api);
  });

  describe('languageTools API', () => {
    function mockResponse() {
      return createApiResponse({
        jsonData: { results: [createFakeLanguageAddon()] },
      });
    }

    it('calls the language tools API', async () => {
      const apiState = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      }).store.getState().api;

      mockApi
        .expects('callApi')
        .withArgs({
          auth: true,
          endpoint: 'addons/language-tools',
          method: 'GET',
          params: { app: CLIENT_APP_ANDROID },
          state: apiState,
        })
        .once()
        .returns(mockResponse());

      const languageToolsResponse = await languageTools({ api: apiState });
      const jsonResponse = await languageToolsResponse.json();

      expect(jsonResponse).toEqual({ results: [createFakeLanguageAddon()] });

      mockApi.verify();
    });
  });
});
