import SagaTester from 'redux-saga-tester';

import addonsReducer, { loadAddonResults } from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import * as api from 'disco/api';
import discoResultsReducer, {
  createExternalAddonMap,
  getDiscoResults,
  loadDiscoResults,
} from 'disco/reducers/discoResults';
import discoSaga from 'disco/sagas/disco';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import {
  createDiscoResult,
  createFetchDiscoveryResult,
  fakeDiscoAddon,
} from 'tests/unit/disco/helpers';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('fetchDiscoveryAddons', () => {
    let apiState;
    let errorHandler;
    let mockApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = createStubErrorHandler();
      mockApi = sinon.mock(api);

      const { state } = dispatchSignInActions();
      apiState = state.api;
      sagaTester = new SagaTester({
        initialState: state,
        reducers: {
          addons: addonsReducer,
          api: apiReducer,
          discoResults: discoResultsReducer,
        },
      });

      sagaTester.start(discoSaga);
    });

    function _getDiscoResults(overrides = {}) {
      sagaTester.dispatch(
        getDiscoResults({
          errorHandlerId: errorHandler.id,
          taarParams: { platform: 'Darwin' },
          ...overrides,
        }),
      );
    }

    it('fetches discovery addons from the API', async () => {
      const result1 = createDiscoResult({
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: '@guid1',
          slug: 'discovery-addon-1',
        },
      });
      const result2 = createDiscoResult({
        heading: 'Discovery Addon 2',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: '@guid2',
          slug: 'discovery-addon-2',
        },
      });

      const addonResponse = createFetchDiscoveryResult([result1, result2]);

      mockApi
        .expects('getDiscoveryAddons')
        .withArgs({
          api: apiState,
          taarParams: { platform: 'Darwin' },
        })
        .returns(Promise.resolve(addonResponse));

      const { results } = addonResponse;
      const expectedLoadAction = loadDiscoResults({ results });

      _getDiscoResults();

      const action = await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      expect(action).toEqual(expectedLoadAction);

      const calledActions = sagaTester.getCalledActions();

      const addons = createExternalAddonMap({ results });
      expect(calledActions[1]).toEqual(loadAddonResults({ addons }));
    });

    it('includes a telemetry client ID in the API request', async () => {
      const telemetryClientId = 'client-id';
      const result = createDiscoResult({
        heading: 'Discovery Addon',
        description: 'informative text',
      });

      const addonResponse = createFetchDiscoveryResult([result]);

      mockApi
        .expects('getDiscoveryAddons')
        .withArgs({
          api: apiState,
          taarParams: {
            platform: 'Darwin',
            'telemetry-client-id': telemetryClientId,
          },
        })
        .returns(Promise.resolve(addonResponse));

      const { results } = addonResponse;
      const expectedLoadAction = loadDiscoResults({ results });

      _getDiscoResults({
        taarParams: {
          platform: 'Darwin',
          'telemetry-client-id': telemetryClientId,
        },
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('getDiscoveryAddons').returns(Promise.reject(error));

      _getDiscoResults();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);

      const calledActions = sagaTester.getCalledActions();
      expect(calledActions[1]).toEqual(errorAction);
    });
  });
});
