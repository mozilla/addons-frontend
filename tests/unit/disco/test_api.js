import { getDiscoveryAddons } from 'disco/api';
import createStore from 'disco/store';
import * as coreApi from 'core/api';
import { getFakeConfig } from 'tests/unit/helpers';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  let apiState;
  let callApiMock;
  let fakeConfig;

  beforeEach(() => {
    callApiMock = sinon.stub(coreApi, 'callApi');
    fakeConfig = getFakeConfig({
      discoParamsToUse: ['clientId', 'platform'],
    });
    const { store } = createStore();
    apiState = dispatchClientMetadata({ store }).state.api;
  });

  describe('getDiscoveryAddons', () => {
    it('calls the API', () => {
      getDiscoveryAddons({
        api: apiState,
        taarParams: { platform: 'Windows' },
        _config: fakeConfig,
      });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: { platform: 'Windows' },
        apiState,
      });
    });

    it('calls the API with a telemetry client ID', () => {
      const telemetryClientId = 'client-id';
      getDiscoveryAddons({
        api: apiState,
        taarParams: {
          clientId: telemetryClientId,
          platform: 'Darwin',
        },
        _config: fakeConfig,
      });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: {
          platform: 'Darwin',
          'telemetry-client-id': telemetryClientId,
        },
        apiState,
      });
    });

    it('allows new TAAR params from config', () => {
      getDiscoveryAddons({
        api: apiState,
        taarParams: {
          fakeTestParam: 'foo',
          platform: 'Darwin',
        },
        _config: getFakeConfig({
          discoParamsToUse: ['fakeTestParam', 'platform'],
        }),
      });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: { fakeTestParam: 'foo', platform: 'Darwin' },
        apiState,
      });
    });

    it('ignores unknown TAAR params', () => {
      getDiscoveryAddons({
        api: apiState,
        taarParams: {
          badParam: 'foo',
          platform: 'Darwin',
        },
        _config: fakeConfig,
      });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: { platform: 'Darwin' },
        apiState,
      });
    });
  });
});
