import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/site';
import apiReducer from 'core/reducers/api';
import siteReducer, {
  fetchSiteStatus,
  loadSiteStatus,
} from 'core/reducers/site';
import siteSaga from 'core/sagas/site';
import { dispatchClientMetadata } from 'tests/unit/helpers';

describe(__filename, () => {
  let mockApi;
  let sagaTester;
  let rootTask;

  beforeEach(() => {
    mockApi = sinon.mock(api);
    const initialState = dispatchClientMetadata().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        api: apiReducer,
        site: siteReducer,
      },
    });
    rootTask = sagaTester.start(siteSaga);
  });

  describe('fetchSiteStatus', () => {
    it('calls the API', async () => {
      const readOnly = true;
      const notice = 'some notice';
      const siteStatus = { read_only: readOnly, notice };

      mockApi
        .expects('getSiteStatus')
        .once()
        .returns(Promise.resolve(siteStatus));

      sagaTester.dispatch(fetchSiteStatus());

      const expectedAction = loadSiteStatus({ readOnly, notice });
      const secondCalledAction = await sagaTester.waitFor(expectedAction.type);
      expect(secondCalledAction).toEqual(expectedAction);

      mockApi.verify();
    });

    it('allows exceptions to be thrown', () => {
      const expectedError = new Error('this error should be thrown');
      mockApi.expects('getSiteStatus').returns(Promise.reject(expectedError));

      sagaTester.dispatch(fetchSiteStatus());

      return rootTask.done
        .then(() => {
          throw new Error('unexpected success');
        })
        .catch((error) => {
          mockApi.verify();
          expect(error).toBe(expectedError);
        });
    });
  });
});
