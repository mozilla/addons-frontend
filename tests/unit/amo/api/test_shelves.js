import * as api from 'amo/api';
import { getSponsoredShelf } from 'amo/api/shelves';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls the sponsored API', async () => {
    const mockApi = sinon.mock(api);
    const apiState = dispatchClientMetadata().store.getState().api;

    mockApi
      .expects('callApi')
      .withArgs({
        endpoint: 'shelves/sponsored/',
        apiState,
      })
      .once()
      .returns(createApiResponse());

    await getSponsoredShelf({ api: apiState });
    mockApi.verify();
  });
});
