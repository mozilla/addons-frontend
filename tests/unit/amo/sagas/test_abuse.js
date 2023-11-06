import SagaTester from 'redux-saga-tester';

import * as addonManager from 'amo/addonManager';
import * as api from 'amo/api/abuse';
import abuseReducer, {
  finishAddonAbuseReportViaFirefox,
  initiateAddonAbuseReportViaFirefox,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'amo/reducers/abuse';
import apiReducer from 'amo/reducers/api';
import { clearError, setError } from 'amo/reducers/errors';
import abuseSaga from 'amo/sagas/abuse';
import {
  createFakeAddonAbuseReport,
  createStubErrorHandler,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockAddonManager;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockAddonManager = sinon.mock(addonManager);
    mockApi = sinon.mock(api);
    const initialState = dispatchSignInActions().state;
    sagaTester = new SagaTester({
      initialState,
      reducers: {
        abuse: abuseReducer,
        api: apiReducer,
      },
    });
    sagaTester.start(abuseSaga);
  });

  describe('sendAddonAbuseReport', () => {
    function _sendAddonAbuseReport(params) {
      sagaTester.dispatch(
        sendAddonAbuseReport({
          addonId: fakeAddon.slug,
          errorHandlerId: errorHandler.id,
          message: 'Testing',
          ...params,
        }),
      );
    }

    it('calls the API for abuse', async () => {
      const addon = { ...fakeAddon, slug: 'fancy' };
      const message = 'I would prefer the add-on be green';
      const response = createFakeAddonAbuseReport({ addon, message });

      mockApi.expects('reportAddon').once().returns(Promise.resolve(response));

      _sendAddonAbuseReport({ addonId: addon.slug, message });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: response.addon,
        message: response.message,
        reporter: response.reporter,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockApi.verify();

      const loadAction = sagaTester.getCalledActions()[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('clears the error handler', async () => {
      _sendAddonAbuseReport();

      await sagaTester.waitFor(clearError.type);
      expect(sagaTester.getCalledActions()[1]).toEqual(
        errorHandler.createClearingAction(),
      );
    });

    it('dispatches an error', async () => {
      const error = new Error('some API error maybe');
      mockApi.expects('reportAddon').returns(Promise.reject(error));

      _sendAddonAbuseReport();

      const errorAction = errorHandler.createErrorAction(error);
      await sagaTester.waitFor(errorAction.type);
      expect(sagaTester.getCalledActions()[2]).toEqual(errorAction);
    });

    it('throws an error if multiple reports are submitted for the same add-on', async () => {
      _sendAddonAbuseReport({
        addonId: 'some-addon',
        message: 'This add-on is malwaré!',
      });

      // Report the same add-on again; this will cause the reducer to throw
      // an error and the saga should dispatch an error.
      _sendAddonAbuseReport({
        addonId: 'some-addon',
        message: 'Duplicate!',
      });

      await sagaTester.waitFor(setError.type);
      expect(sagaTester.getCalledActions()[1]).toEqual(
        errorHandler.createClearingAction(),
      );
    });
  });

  describe('initiateAddonAbuseReportViaFirefox', () => {
    function _initiateAddonAbuseReportViaFirefox(params) {
      sagaTester.dispatch(
        initiateAddonAbuseReportViaFirefox({
          addon: fakeAddon,
          ...params,
        }),
      );
    }

    it('calls reportAbuse Firefox API', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      mockAddonManager
        .expects('reportAbuse')
        .withArgs(addon.guid)
        .resolves(false);

      _initiateAddonAbuseReportViaFirefox({ addon });

      await sagaTester.waitFor(finishAddonAbuseReportViaFirefox().type);
      mockAddonManager.verify();
    });

    it('dispatches loadAddonAbuseReport after a successful report', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      mockAddonManager.expects('reportAbuse').resolves(true);

      _initiateAddonAbuseReportViaFirefox({ addon });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: null,
        reporter: null,
        reporter_name: null,
        reporter_email: null,
        reason: null,
        location: null,
        addon_version: null,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('dispatches finishAddonAbuseReportViaFirefox after a successful report', async () => {
      mockAddonManager.expects('reportAbuse').resolves(true);

      _initiateAddonAbuseReportViaFirefox();

      const expectedAction = finishAddonAbuseReportViaFirefox();
      const finishAction = await sagaTester.waitFor(expectedAction.type);
      expect(finishAction).toEqual(expectedAction);
    });

    it('does not dispatch loadAddonAbuseReport after a cancelled report', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      mockAddonManager.expects('reportAbuse').resolves(false);

      _initiateAddonAbuseReportViaFirefox({ addon });

      await sagaTester.waitFor(finishAddonAbuseReportViaFirefox().type);

      const unexpectedAction = loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: 'Abuse report via Firefox',
        reporter: null,
      });
      expect(sagaTester.numCalled(unexpectedAction.type)).toEqual(0);
    });

    it('dispatches finishAddonAbuseReportViaFirefox on error', async () => {
      const error = new Error('An error from reportAbuse');
      mockAddonManager.expects('reportAbuse').rejects(error);

      _initiateAddonAbuseReportViaFirefox();

      const expectedAction = finishAddonAbuseReportViaFirefox();
      const finishAction = await sagaTester.waitFor(expectedAction.type);
      expect(finishAction).toEqual(expectedAction);
    });
  });
});
