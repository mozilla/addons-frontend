/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  SEND_USER_ABUSE_REPORT,
  abortUserAbuseReport,
  loadUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import { reportUser as reportUserApi } from 'amo/api/abuse';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { SendUserAbuseReportAction } from 'amo/reducers/userAbuseReports';
import type { ReportUserParams } from 'amo/api/abuse';
import type { Saga } from 'amo/types/sagas';

export function* reportUser({
  payload: {
    auth,
    errorHandlerId,
    message,
    reason,
    reporterEmail,
    reporterName,
    userId,
    illegalCategory,
    illegalSubcategory,
  },
}: SendUserAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: ReportUserParams = {
      api: state.api,
      auth,
      message,
      reason: reason || null,
      reporterName: reporterName || null,
      reporterEmail: reporterEmail || null,
      userId,
      illegalCategory: illegalCategory || null,
      illegalSubcategory: illegalSubcategory || null,
    };
    const response = yield call(reportUserApi, params);

    yield put(
      loadUserAbuseReport({
        message: response.message,
        reporter: response.reporter,
        userId,
      }),
    );
  } catch (error) {
    log.warn(`Reporting user for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));

    yield put(abortUserAbuseReport({ userId }));
  }
}

export default function* userAbuseReportsSaga(): Saga {
  yield takeLatest(SEND_USER_ABUSE_REPORT, reportUser);
}
