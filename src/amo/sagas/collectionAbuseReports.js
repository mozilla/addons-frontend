/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import {
  SEND_COLLECTION_ABUSE_REPORT,
  loadCollectionAbuseReport,
  abortCollectionAbuseReport,
} from 'amo/reducers/collectionAbuseReports';
import { reportCollection as reportCollectionApi } from 'amo/api/abuse';
import log from 'amo/logger';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { SendCollectionAbuseReportAction } from 'amo/reducers/collectionAbuseReports';
import type { ReportCollectionParams } from 'amo/api/abuse';
import type { Saga } from 'amo/types/sagas';

export function* reportCollection({
  payload: {
    auth,
    errorHandlerId,
    message,
    reason,
    reporterEmail,
    reporterName,
    collectionId,
    illegalCategory,
    illegalSubcategory,
  },
}: SendCollectionAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: ReportCollectionParams = {
      api: state.api,
      auth,
      message,
      reason: reason || null,
      reporterName: reporterName || null,
      reporterEmail: reporterEmail || null,
      collectionId,
      illegalCategory: illegalCategory || null,
      illegalSubcategory: illegalSubcategory || null,
    };
    const response = yield call(reportCollectionApi, params);

    yield put(
      loadCollectionAbuseReport({ collectionId: response.collection.id }),
    );
  } catch (error) {
    log.warn(`Reporting collection for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));

    yield put(abortCollectionAbuseReport({ collectionId }));
  }
}

export default function* collectionAbcollectioneportsSaga(): Saga {
  yield takeLatest(SEND_COLLECTION_ABUSE_REPORT, reportCollection);
}
