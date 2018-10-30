import SagaTester from 'redux-saga-tester';

import {
  fetchGuidesAddons,
  updateGuideAddonsLoadedStatus,
} from 'amo/reducers/guides';
import * as searchApi from 'core/api/search';
import addonsReducer, { loadAddonResults } from 'core/reducers/addons';
import guidesSaga from 'amo/sagas/guides';
import apiReducer from 'core/reducers/api';
import {
  dispatchClientMetadata,
  createStubErrorHandler,
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
        guides: addonsReducer,
      },
    });
    sagaTester.start(guidesSaga);
  });

  describe('fetchGuidesAddons', () => {
    function _fetchGuidesAddons(params) {
      sagaTester.dispatch(
        fetchGuidesAddons({
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

      _fetchGuidesAddons({ guid });

      const { results } = guideAddons;

      const expectedAction = loadAddonResults({ addons: results });
      const loadAction = await sagaTester.waitFor(expectedAction.type);
      expect(loadAction).toEqual(expectedAction);
      mockApi.verify();
    });

    it('dispatches the update loading flag status action', async () => {
      _fetchGuidesAddons({ guid });

      const expectedUpdateAction = updateGuideAddonsLoadedStatus({
        loading: false,
      });
      const updateAction = await sagaTester.waitFor(expectedUpdateAction.type);
      expect(updateAction).toEqual(expectedUpdateAction);
    });

    it('clears the error handler', async () => {
      _fetchGuidesAddons({ guid });

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

      _fetchGuidesAddons({ guid });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
