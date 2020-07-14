/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  SEND_USER_ABUSE_REPORT,
  abortUserAbuseReport,
  loadUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import { reportUser as reportUserApi } from 'core/api/abuse';
import log from 'core/logger';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { SendUserAbuseReportAction } from 'amo/reducers/userAbuseReports';
import type { ReportUserParams } from 'core/api/abuse';
import type { Saga } from 'core/types/sagas';

export function* reportUser({
  payload: { errorHandlerId, message, userId },
}: SendUserAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: ReportUserParams = { api: state.api, message, userId };
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
