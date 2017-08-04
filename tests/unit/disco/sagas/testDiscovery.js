import { normalize } from 'normalizr';
import SagaTester from 'redux-saga-tester';

import { loadEntities } from 'core/actions';
import { ErrorHandler } from 'core/errorHandler';
import addonsReducer from 'core/reducers/addons';
import apiReducer from 'core/reducers/api';
import * as api from 'disco/api';
import { getDiscoResults, discoResults } from 'disco/actions';
import { DISCO_RESULTS } from 'disco/constants';
import discoResultsReducer from 'disco/reducers/discoResults';
import discoverySaga from 'disco/sagas/discovery';
import { dispatchSignInActions, fakeAddon } from 'tests/unit/amo/helpers';

export function createFetchDiscoveryResult(results) {
  // Simulate how getDiscoveryAddons() applies its schema.
  return normalize({ results }, { results: [api.discoResult] });
}

describe('disco/sagas/discovery', () => {
  describe('fetchDiscoveryAddons', () => {
    let apiState;
    let errorHandler;
    let mockApi;
    let sagaTester;

    beforeEach(() => {
      errorHandler = new ErrorHandler({
        id: 'some-error-handler',
        dispatch: sinon.stub(),
      });
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

      sagaTester.start(discoverySaga);
    });

    function _getDiscoResults(overrides = {}) {
      sagaTester.dispatch(getDiscoResults({
        errorHandlerId: errorHandler.id,
        ...overrides,
      }));
    }

    it('fetches landing page addons from the API', async () => {
      const addon1 = {
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeAddon,
          guid: '@guid1',
          slug: 'discovery-addon-1',
        },
      };
      const addon2 = {
        heading: 'Discovery Addon 1',
        description: 'informative text',
        addon: {
          ...fakeAddon,
          guid: '@guid2',
          slug: 'discovery-addon-2',
        },
      };
      const addonResponse = createFetchDiscoveryResult([addon1, addon2]);
      mockApi
        .expects('getDiscoveryAddons')
        .withArgs({ api: apiState })
        .returns(Promise.resolve(addonResponse));

      _getDiscoResults();

      await sagaTester.waitFor(DISCO_RESULTS);
      mockApi.verify();

      const calledActions = sagaTester.getCalledActions();

      const { entities, result } = addonResponse;
      expect(calledActions[1]).toEqual(loadEntities({ entities, result }));
      expect(calledActions[2]).toEqual(discoResults([
        {
          addon: addon1.addon.guid,
          description: addon1.description,
          heading: addon1.heading,
        },
        {
          addon: addon2.addon.guid,
          description: addon2.description,
          heading: addon2.heading,
        },
      ]));
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
