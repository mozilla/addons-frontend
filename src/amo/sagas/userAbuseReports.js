// Disabled because of
// https://github.com/benmosher/eslint-plugin-import/issues/793
/* eslint-disable import/order */
import { call, put, select, takeLatest } from 'redux-saga/effects';
/* eslint-enable import/order */

import {
  SEND_USER_ABUSE_REPORT,
  abortUserAbuseReport,
  loadUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import { reportUser as reportUserApi } from 'core/api/abuse';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';


export function* reportUser({
  // TODO: Use a type for this.
  payload: {
    errorHandlerId,
    message,
    userId,
  },
}) {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const response = yield call(reportUserApi, {
      api: state.api,
      message,
      userId,
    });

    yield put(loadUserAbuseReport({
      message: response.message,
      reporter: response.reporter,
      userId,
    }));
  } catch (error) {
    log.warn(`Reporting user for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));

    yield put(abortUserAbuseReport({ userId }));
  }
}

export default function* userAbuseReportsSaga() {
  yield takeLatest(SEND_USER_ABUSE_REPORT, reportUser);
}
