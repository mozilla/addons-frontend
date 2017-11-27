import SagaTester from 'redux-saga-tester';

import addonsReducer, { loadAddons } from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import * as api from 'disco/api';
import { getDiscoResults, loadDiscoResults } from 'disco/actions';
import discoResultsReducer from 'disco/reducers/discoResults';
import discoSaga from 'disco/sagas/disco';
import { dispatchSignInActions } from 'tests/unit/amo/helpers';
import {
  createFetchDiscoveryResult, fakeDiscoAddon,
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
      sagaTester.dispatch(getDiscoResults({
        errorHandlerId: errorHandler.id,
        platform: 'Darwin',
        ...overrides,
      }));
    }

    it('fetches discovery addons from the API', async () => {
      const addon1 = {
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: '@guid1',
          slug: 'discovery-addon-1',
        },
      };
      const addon2 = {
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeDiscoAddon,
          guid: '@guid2',
          slug: 'discovery-addon-2',
        },
      };
      const addonResponse = createFetchDiscoveryResult([addon1, addon2]);
      mockApi
        .expects('getDiscoveryAddons')
        .withArgs({
          api: apiState,
          platform: 'Darwin',
          telemetryClientId: undefined,
        })
        .returns(Promise.resolve(addonResponse));

      const { entities, result } = addonResponse;
      const expectedLoadAction = loadDiscoResults({ entities, result });

      _getDiscoResults();

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();

      expect(calledActions[1]).toEqual(loadAddons(entities));
      expect(calledActions[2]).toEqual(expectedLoadAction);
    });

    it('includes a telemetry client ID in the API request', async () => {
      const telemetryClientId = 'client-id';
      const addon = {
        heading: 'Discovery Addon',
        description: 'informative text',
        addon: { ...fakeDiscoAddon },
      };
      const addonResponse = createFetchDiscoveryResult([addon]);

      mockApi
        .expects('getDiscoveryAddons')
        .withArgs({
          api: apiState,
          platform: 'Darwin',
          telemetryClientId,
        })
        .returns(Promise.resolve(addonResponse));

      const { entities, result } = addonResponse;
      const expectedLoadAction = loadDiscoResults({ entities, result });

      _getDiscoResults({ telemetryClientId });

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
