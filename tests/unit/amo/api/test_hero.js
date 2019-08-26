import * as api from 'core/api';
import { getHeroShelves } from 'amo/api/hero';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls the hero API', async () => {
    const mockApi = sinon.mock(api);
    const apiState = dispatchClientMetadata().store.getState().api;

    mockApi
      .expects('callApi')
      .withArgs({
        auth: true,
        endpoint: 'hero',
        apiState,
      })
      .once()
      .returns(createApiResponse());

    await getHeroShelves({ api: apiState });
    mockApi.verify();
  });
});
