import SagaTester from 'redux-saga-tester';

import * as api from 'amo/api/abuse';
import * as addonManager from 'amo/addonManager';
import abuseReducer, {
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
  let mockApi;
  let mockAddonManager;
  let sagaTester;

  beforeEach(() => {
    errorHandler = createStubErrorHandler();
    mockApi = sinon.mock(api);
    mockAddonManager = sinon.mock(addonManager);
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

    it('does not call the API when mozAddonManager.sendAbuseReport can be used', async () => {
      const addon = { ...fakeAddon, slug: 'fancy' };
      const message = 'I would prefer the add-on be green';
      mockApi.expects('reportAddon').never();
      mockAddonManager.expects('canSendAbuseReports').returns(true);
      const response = createFakeAddonAbuseReport({ addon, message });
      mockAddonManager
        .expects('sendAbuseReport')
        .withExactArgs(addon.slug, sinon.match.any, {})
        .returns(Promise.resolve(response));

      _sendAddonAbuseReport({ addonId: addon.slug, message });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: response.addon,
        message: response.message,
        reporter: response.reporter,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockAddonManager.verify();
      mockApi.verify();

      const loadAction = sagaTester.getCalledActions()[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('can call mozAddonManager.sendAbuseReport with options', async () => {
      const addon = { ...fakeAddon, slug: 'fancy' };
      const message = 'I would prefer the add-on be green';
      mockApi.expects('reportAddon').never();
      mockAddonManager.expects('canSendAbuseReports').returns(true);
      const response = createFakeAddonAbuseReport({ addon, message });
      mockAddonManager
        .expects('sendAbuseReport')
        .withExactArgs(addon.slug, sinon.match.any, {
          authorization: 'Session 123456',
        })
        .returns(Promise.resolve(response));

      _sendAddonAbuseReport({ addonId: addon.slug, message, auth: true });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: response.addon,
        message: response.message,
        reporter: response.reporter,
      });

      await sagaTester.waitFor(expectedLoadAction.type);
      mockAddonManager.verify();
      mockApi.verify();

      const loadAction = sagaTester.getCalledActions()[2];
      expect(loadAction).toEqual(expectedLoadAction);
    });

    it('kinda handles non-public add-ons', async () => {
      const addon = { ...fakeAddon };
      const response = {
        // This is how a response for a non-public add-on looks like.
        addon: {
          guid: addon.guid,
          id: null,
          slug: null,
        },
        message: '',
        reporter: null,
      };

      mockApi.expects('reportAddon').once().returns(Promise.resolve(response));

      // Send the add-on GUID.
      _sendAddonAbuseReport({ addonId: addon.guid });

      const expectedLoadAction = loadAddonAbuseReport({
        addon: {
          ...response.addon,
          guid: addon.guid,
          slug: addon.guid,
        },
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
});
