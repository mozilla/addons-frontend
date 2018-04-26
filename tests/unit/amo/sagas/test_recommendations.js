import SagaTester from 'redux-saga-tester';

import * as recommendationsApi from 'amo/api/recommendations';
import recommendationsReducer, {
  abortFetchRecommendations,
  fetchRecommendations,
  loadRecommendations,
} from 'amo/reducers/recommendations';
import recommendationsSaga from 'amo/sagas/recommendations';
import apiReducer from 'core/reducers/api';
import { createStubErrorHandler } from 'tests/unit/helpers';
import {
  fakeAddon,
  dispatchClientMetadata,
} from 'tests/unit/amo/helpers';


describe(__filename, () => {
  let clientData;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(recommendationsApi);
    clientData = dispatchClientMetadata();
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        recommendations: recommendationsReducer,
      },
    });
    sagaTester.start(recommendationsSaga);
  });

  const guid = 'some-guid';
  const recommended = true;

  function _fetchRecommendations(params) {
    sagaTester.dispatch(fetchRecommendations({
      errorHandlerId: errorHandler.id,
      ...params,
    }));
  }

  it('calls the API to fetch recommendations', async () => {
    const state = sagaTester.getState();

    const recommendations = {
      outcome: 'recommended_fallback',
      fallback_reason: 'timeout',
      results: [fakeAddon, fakeAddon],
    };

    mockApi
      .expects('getRecommendations')
      .withArgs({
        api: state.api,
        guid,
        recommended,
      })
      .once()
      .returns(Promise.resolve(recommendations));

    _fetchRecommendations({ guid, recommended });

    const expectedLoadAction = loadRecommendations({
      addons: recommendations.results,
      fallbackReason: recommendations.fallback_reason,
      guid,
      outcome: recommendations.outcome,
    });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    expect(loadAction).toEqual(expectedLoadAction);
    mockApi.verify();
  });

  it('clears the error handler', async () => {
    _fetchRecommendations({ guid, recommended });

    const expectedAction = errorHandler.createClearingAction();

    const action = await sagaTester.waitFor(expectedAction.type);
    expect(action).toEqual(expectedAction);
  });

  it('dispatches an error and aborts the fetching', async () => {
    const error = new Error('some API error maybe');

    mockApi
      .expects('getRecommendations')
      .once()
      .returns(Promise.reject(error));

    _fetchRecommendations({ guid, recommended });

    const expectedAction = errorHandler.createErrorAction(error);
    const action = await sagaTester.waitFor(expectedAction.type);
    expect(expectedAction).toEqual(action);
    expect(sagaTester.getCalledActions()[3]).toEqual(abortFetchRecommendations({ guid }));
  });
});
