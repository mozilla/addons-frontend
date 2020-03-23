import SagaTester from 'redux-saga-tester';

import { fetchGuidesAddons } from 'amo/reducers/guides';
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
  let errorHandler;
  let guids = [];
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(searchApi);
    guids = ['support@lastpass.com', '{b76ed4e7-12a6-4f25-a27b-fc3f93289008}'];

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
          slug: 'some-slug',
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
    }

    it("calls the API to fetch a guide's addons", async () => {
      const state = sagaTester.getState();
      const addons = [fakeAddon, fakeAddon];
      const guideAddons = { results: addons };

      mockApi
        .expects('search')
        .withArgs({
          api: state.api,
          filters: {
            guid: guids.join(','),
          },
        })
        .once()
        .resolves({ results: addons });

      _fetchGuidesAddons({ guids });

      const { results } = guideAddons;

      const expectedAction = loadAddonResults({ addons: results });
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchGuidesAddons({ guids });

      const expectedAction = errorHandler.createClearingAction();
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error');

      mockApi.expects('search').once().rejects(error);

      _fetchGuidesAddons({ guids });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
