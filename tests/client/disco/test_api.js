import { arrayOf, normalize } from 'normalizr';

import { discoResult, getDiscoveryAddons } from 'disco/api';
import * as coreApi from 'core/api';

describe('disco api', () => {
  describe('getDiscoveryAddons', () => {
    it('calls the API', () => {
      const callApi = sinon.stub(coreApi, 'callApi');
      const api = {some: 'apiconfig'};
      getDiscoveryAddons({api});
      assert.ok(callApi.calledWith({
        endpoint: 'discovery',
        schema: {results: arrayOf(discoResult)},
        state: api,
      }));
    });
  });

  describe('discoResult', () => {
    it("uses the addon's guid as an id", () => {
      const normalized = normalize({addon: {guid: '{foo}'}}, discoResult);
      assert.deepEqual(
        normalized,
        {
          entities: {
            addons: {'{foo}': {guid: '{foo}'}},
            discoResults: {'{foo}': {addon: '{foo}'}},
          },
          result: '{foo}',
        },
        sinon.format(normalized.entities));
    });
  });
});
