import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/abuse';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import abuseReducer, {
  finishAddonAbuseReportViaFirefox,
  initiateAddonAbuseReportViaFirefox,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import apiReducer from 'core/reducers/api';
import abuseSaga from 'core/sagas/abuse';
import {
  createFakeAddonAbuseReport,
  createStubErrorHandler,
  dispatchSignInActions,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  let errorHandler;
  let mockApi;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
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
          addonSlug: fakeAddon.slug,
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

      mockApi
        .expects('reportAddon')
        .once()
        .returns(Promise.resolve(response));

      _sendAddonAbuseReport({ addonSlug: addon.slug, message });

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

      await sagaTester.waitFor(CLEAR_ERROR);
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
        addonSlug: 'some-addon',
        message: 'This add-on is malwaré!',
      });

      // Report the same add-on again; this will cause the reducer to throw
      // an error and the saga should dispatch an error.
      _sendAddonAbuseReport({
        addonSlug: 'some-addon',
        message: 'Duplicate!',
      });

      await sagaTester.waitFor(SET_ERROR);
      expect(sagaTester.getCalledActions()[1]).toEqual(
        errorHandler.createClearingAction(),
      );
    });
  });

  describe('initiateAddonAbuseReportViaFirefox', () => {
    function _initiateAddonAbuseReportViaFirefox(params) {
      sagaTester.dispatch(
        initiateAddonAbuseReportViaFirefox({
          _reportAbuse: sinon.stub(),
          addon: fakeAddon,
          ...params,
        }),
      );
    }

    it('calls reportAbuse Firefox API', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      const _reportAbuse = sinon.stub().resolves(false);

      _initiateAddonAbuseReportViaFirefox({ _reportAbuse, addon });

      await sagaTester.waitFor(finishAddonAbuseReportViaFirefox().type);
      sinon.assert.calledWith(_reportAbuse, addon.guid);
    });

    it('dispatches loadAddonAbuseReport after a successful report', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      const _reportAbuse = sinon.stub().resolves(true);

      _initiateAddonAbuseReportViaFirefox({ _reportAbuse, addon });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: 'Abuse report via Firefox',
        reporter: null,
      });

      const loadAction = await sagaTester.waitFor(expectedLoadAction.type);
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('does not dispatch loadAddonAbuseReport after a cancelled report', async () => {
      const addon = { ...fakeAddon, guid: 'some-guid' };

      const _reportAbuse = sinon.stub().resolves(false);

      _initiateAddonAbuseReportViaFirefox({ _reportAbuse, addon });

      await sagaTester.waitFor(finishAddonAbuseReportViaFirefox().type);

      const unexpectedAction = loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: 'Abuse report via Firefox',
        reporter: null,
      });
      expect(sagaTester.numCalled(unexpectedAction.type)).toEqual(0);
    });
  });
});
