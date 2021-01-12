import * as api from 'amo/api';
import { getRecommendations } from 'amo/api/recommendations';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls the recommendations API', async () => {
    const mockApi = sinon.mock(api);
    const apiState = dispatchClientMetadata().store.getState().api;

    const params = {
      guid: 'addon-guid',
      recommended: true,
    };

    mockApi
      .expects('callApi')
      .withArgs({
        auth: true,
        endpoint: 'addons/recommendations/',
        params,
        apiState,
      })
      .once()
      .returns(createApiResponse());

    await getRecommendations({
      api: apiState,
      ...params,
    });
    mockApi.verify();
  });
});
