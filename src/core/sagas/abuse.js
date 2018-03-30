// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import { reportAddon as reportAddonApi } from 'core/api/abuse';
import log from 'core/logger';
import {
  SEND_ADDON_ABUSE_REPORT,
  loadAddonAbuseReport,
} from 'core/reducers/abuse';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* reportAddon({
  payload: {
    addonSlug,
    errorHandlerId,
    message,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const response = yield call(reportAddonApi, {
      addonSlug,
      api: state.api,
      message,
    });

    yield put(loadAddonAbuseReport({
      addon: response.addon,
      message: response.message,
      reporter: response.reporter,
    }));
  } catch (error) {
    log.warn(`Reporting add-on for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export default function* abuseSaga() {
  yield takeLatest(SEND_ADDON_ABUSE_REPORT, reportAddon);
}
