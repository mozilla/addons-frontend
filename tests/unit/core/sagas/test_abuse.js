import SagaTester from 'redux-saga-tester';

import * as api from 'core/api/abuse';
import { CLEAR_ERROR, SET_ERROR } from 'core/constants';
import abuseReducer, {
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import apiReducer from 'core/reducers/api';
import abuseSaga from 'core/sagas/abuse';
import { dispatchSignInActions, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeAddonAbuseReport,
  createStubErrorHandler,
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
