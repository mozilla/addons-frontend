import SagaTester from 'redux-saga-tester';

import * as searchApi from 'core/api/search';
import guideReducer, {
  fetchGuideAddons,
  loadGuideAddons,
} from 'amo/reducers/guide';
import guideSaga from 'amo/sagas/guide';
import apiReducer from 'core/reducers/api';
import {
  dispatchClientMetadata,
  createStubErrorHandler,
  fakeGuide,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const guid = 'support@lastpass.com,{b76ed4e7-12a6-4f25-a27b-fc3f93289008}';

  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(searchApi);
    const initialState = dispatchClientMetadata().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        api: apiReducer,
        guide: guideReducer,
      },
    });
    sagaTester.start(guideSaga);
  });

  describe('fetchGuideAddons', () => {
    function _fetchGuideAddons(params) {
      sagaTester.dispatch(
        fetchGuideAddons({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
    }

    it("calls the API to fetch a guide's addons", async () => {
      const state = sagaTester.getState();
      const guideAddons = { results: [fakeAddon, fakeAddon] };

      mockApi
        .expects('search')
        .withArgs({
          api: state.api,
          filters: {
            guid,
          },
        })
        .once()
        .resolves(guideAddons);

      _fetchGuideAddons({ guid });

      const { results } = guideAddons;

      const expectedAction = loadGuideAddons({ addons: results });

      const loadAction = await sagaTester.waitFor(expectedAction.type);
      expect(loadAction).toEqual(expectedAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchGuideAddons({ guid });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error');

      mockApi
        .expects('search')
        .once()
        .rejects(error);

      _fetchGuideAddons({ guid });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
