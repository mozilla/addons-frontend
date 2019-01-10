import { getDiscoveryAddons } from 'disco/api';
import createStore from 'disco/store';
import * as coreApi from 'core/api';
import { dispatchClientMetadata, getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  let apiState;
  let callApiMock;
  let fakeConfig;

  beforeEach(() => {
    callApiMock = sinon.stub(coreApi, 'callApi');
    fakeConfig = getFakeConfig({
      discoParamsToUse: ['taarId', 'platform'],
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

    it("passes through taarId as telemetry-client-id to the API when it's available", () => {
      const taarId = '11111111111';

      getDiscoveryAddons({
        api: apiState,
        taarParams: {
          taarId,
          platform: 'Darwin',
        },
        _config: fakeConfig,
      });

      sinon.assert.calledWith(callApiMock, {
        endpoint: 'discovery',
        params: {
          platform: 'Darwin',
          'telemetry-client-id': taarId,
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
