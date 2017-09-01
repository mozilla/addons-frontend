import { normalize } from 'normalizr';

import { discoResult, getDiscoveryAddons } from 'disco/api';
import * as coreApi from 'core/api';

describe('disco api', () => {
  describe('getDiscoveryAddons', () => {
    it('calls the API', () => {
      const callApi = sinon.stub(coreApi, 'callApi');
      const api = { some: 'apiconfig' };
      getDiscoveryAddons({ api });
      expect(
        callApi.calledWith({
          endpoint: 'discovery',
          schema: { results: [discoResult] },
          state: api,
        })
      ).toBeTruthy();
    });
  });

  describe('discoResult', () => {
    it("uses the addon's guid as an id", () => {
      const normalized = normalize({ addon: { guid: '{foo}' } }, discoResult);
      expect(normalized).toEqual({
        entities: {
          addons: { '{foo}': { guid: '{foo}' } },
          discoResults: { '{foo}': { addon: '{foo}' } },
        },
        result: '{foo}',
      });
    });
  });
});
