import SagaTester from 'redux-saga-tester';
import { END } from 'redux-saga';

import * as api from 'amo/api/site';
import apiReducer from 'amo/reducers/api';
import siteReducer, { fetchSiteStatus, loadSiteStatus } from 'amo/reducers/site';
import siteSaga from 'amo/sagas/site';
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
      const siteStatus = {
        read_only: readOnly,
        notice,
      };
      mockApi.expects('getSiteStatus').once().returns(Promise.resolve(siteStatus));
      sagaTester.dispatch(fetchSiteStatus());
      const expectedAction = loadSiteStatus({
        readOnly,
        notice,
      });
      const secondCalledAction = await sagaTester.waitFor(expectedAction.type);
      expect(secondCalledAction).toEqual(expectedAction);
      mockApi.verify();
    });
    it('ignores exceptions', () => {
      const apiError = new Error('this error should be ignored');
      mockApi.expects('getSiteStatus').returns(Promise.reject(apiError));
      sagaTester.dispatch(fetchSiteStatus());
      sagaTester.dispatch(END); // stop the saga.

      return rootTask.done.then(() => {
        mockApi.verify();
      });
    });
  });
});