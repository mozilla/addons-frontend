import { normalize } from 'normalizr';

import { discoResult, getDiscoveryAddons } from 'disco/api';
import createStore from 'disco/store';
import * as coreApi from 'core/api';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let apiState;
  let callApiMock;

  beforeEach(() => {
    callApiMock = sinon.stub(coreApi, 'callApi');
    const store = createStore().store;
    apiState = dispatchClientMetadata({ store }).state.api;
  });

  describe('getDiscoveryAddons', () => {
    it('calls the API', () => {
      getDiscoveryAddons({ api: apiState });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: { 'telemetry-client-id': undefined },
        schema: { results: [discoResult] },
        state: apiState,
      });
    });

    it('calls the API with a telemetry client ID', () => {
      const telemetryClientId = 'client-id';
      getDiscoveryAddons({ api: apiState, telemetryClientId });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: { 'telemetry-client-id': telemetryClientId },
        schema: { results: [discoResult] },
        state: apiState,
      });
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
