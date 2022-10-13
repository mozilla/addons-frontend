import * as api from 'amo/api';
import { getBlock } from 'amo/api/blocks';
import { createApiResponse, dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  it('calls the API to retrieve a block', async () => {
    const mockApi = sinon.mock(api);
    const apiState = dispatchClientMetadata().store.getState().api;
    const guid = 'some-guid';
    mockApi.expects('callApi').withArgs({
      endpoint: `blocklist/block/${guid}/`,
      apiState,
    }).once().returns(createApiResponse());
    await getBlock({
      apiState,
      guid,
    });
    mockApi.verify();
  });
});