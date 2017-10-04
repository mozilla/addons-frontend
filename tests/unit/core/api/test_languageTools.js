import * as api from 'core/api';
import { languageTools } from 'core/api/languageTools';
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

    it('calls the language tools API', () => {
      const apiState = dispatchClientMetadata().store.getState().api;

      mockApi
        .expects('callApi')
        .withArgs({
          endpoint: 'addons/language-tools',
          method: 'GET',
          params: { app: apiState.clientApp },
          state: apiState,
        })
        .once()
        .returns(mockResponse([createFakeLanguageAddon()]));
      return languageTools({ api: apiState })
        .then(() => {
          mockApi.verify();
        });
    });
  });
});
