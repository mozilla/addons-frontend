import * as api from 'amo/api';
import { getHomeShelves } from 'amo/api/homeShelves';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls the homepage shelves API', async () => {
    const mockApi = sinon.mock(api);
    const apiState = dispatchClientMetadata().store.getState().api;

    mockApi
      .expects('callApi')
      .withArgs({
        endpoint: 'shelves',
        apiState,
      })
      .once()
      .returns(createApiResponse());

    await getHomeShelves({ api: apiState });
    mockApi.verify();
  });
});
