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
        params: {lang: 'en-US'},
        state: api,
      }));
    });
  });

  describe('discoResult', () => {
    it("uses the addon's slug as an id", () => {
      const normalized = normalize({addon: {slug: 'foo'}}, discoResult);
      assert.deepEqual(
        normalized,
        {
          entities: {
            addons: {foo: {slug: 'foo'}},
            discoResults: {foo: {addon: 'foo'}},
          },
          result: 'foo',
        },
        sinon.format(normalized.entities));
    });
  });
});
