import SagaTester from 'redux-saga-tester';

import * as versionsApi from 'amo/api/versions';
import versionsReducer, {
  fetchVersions,
  loadVersions,
} from 'amo/reducers/versions';
import versionsSaga from 'amo/sagas/versions';
import apiReducer from 'core/reducers/api';
import { createStubErrorHandler } from 'tests/unit/helpers';
import { dispatchClientMetadata, fakeVersion } from 'tests/unit/amo/helpers';

describe(__filename, () => {
  const page = '2';
  const slug = 'some-slug';

  let clientData;
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(versionsApi);
    clientData = dispatchClientMetadata();
    sagaTester = new SagaTester({
      initialState: clientData.state,
      reducers: {
        api: apiReducer,
        versions: versionsReducer,
      },
    });
    sagaTester.start(versionsSaga);
  });

  describe('fetchVersions', () => {
    function _fetchVersions(params) {
      sagaTester.dispatch(
        fetchVersions({
          errorHandlerId: errorHandler.id,
          ...params,
        }),
      );
    }

    it('calls the API to fetch versions', async () => {
      const state = sagaTester.getState();

      const versions = { results: [fakeVersion] };

      mockApi
        .expects('getVersions')
        .withArgs({
          api: state.api,
          page,
          slug,
        })
        .once()
        .resolves(versions);

      _fetchVersions({ page, slug });

      const expectedAction = loadVersions({ slug, versions });

      const loadAction = await sagaTester.waitFor(expectedAction.type);
      expect(loadAction).toEqual(expectedAction);
      mockApi.verify();
    });

    it('clears the error handler', async () => {
      _fetchVersions({ page, slug });

      const expectedAction = errorHandler.createClearingAction();

      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');

      mockApi
        .expects('getVersions')
        .once()
        .rejects(error);

      _fetchVersions({ page, slug });

      const expectedAction = errorHandler.createErrorAction(error);
      const action = await sagaTester.waitFor(expectedAction.type);
      expect(action).toEqual(expectedAction);
    });
  });
});
