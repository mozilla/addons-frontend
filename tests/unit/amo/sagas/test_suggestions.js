import config from 'config';
import SagaTester from 'redux-saga-tester';

import * as collectionsApi from 'amo/api/collections';
import suggestionsReducer, {
  abortFetchSuggestions,
  fetchSuggestions,
  loadSuggestions,
} from 'amo/reducers/suggestions';
import suggestionsSaga, {
  getCollectionSlugForCategory,
} from 'amo/sagas/suggestions';
import apiReducer from 'amo/reducers/api';
import {
  createFakeCollectionAddon,
  createFakeCollectionAddonsListResponse,
  createStubErrorHandler,
  dispatchClientMetadata,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    const clientData = dispatchClientMetadata();
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(collectionsApi);
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        suggestions: suggestionsReducer,
      },
    });
    sagaTester.start(suggestionsSaga);
  });

  const slug = 'some-slug';

  function _fetchSuggestions() {
    sagaTester.dispatch(
      fetchSuggestions({
        errorHandlerId: errorHandler.id,
        slug,
      }),
    );
  }

  it('calls the API to fetch suggestions', async () => {
    const state = sagaTester.getState();

    const addons = [createFakeCollectionAddon(), createFakeCollectionAddon()];
    const response = createFakeCollectionAddonsListResponse({
      count: addons.length,
      addons,
    });

    mockApi
      .expects('getCollectionAddons')
      .withArgs({
        api: state.api,
        slug: getCollectionSlugForCategory(slug),
        userId: config.get('mozillaUserId'),
      })
      .once()
      .returns(Promise.resolve(response));

    _fetchSuggestions();

    const expectedLoadAction = loadSuggestions({
      addons: response.results,
      slug,
    });

    const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
    expect(loadAction).toEqual(expectedLoadAction);
    mockApi.verify();
  });

  it('clears the error handler', async () => {
    _fetchSuggestions();

    const expectedAction = errorHandler.createClearingAction();

    const action = await sagaTester.waitFor(expectedAction.type);
    expect(action).toEqual(expectedAction);
  });

  it('dispatches an error and aborts the fetching', async () => {
    const error = new Error('some API error maybe');

    mockApi
      .expects('getCollectionAddons')
      .once()
      .returns(Promise.reject(error));

    _fetchSuggestions();

    const expectedAction = errorHandler.createErrorAction(error);
    const action = await sagaTester.waitFor(expectedAction.type);
    expect(expectedAction).toEqual(action);
    expect(sagaTester.getCalledActions()[3]).toEqual(
      abortFetchSuggestions({ slug }),
    );
  });
});
