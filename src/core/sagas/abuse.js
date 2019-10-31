/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { reportAbuse } from 'core/addonManager';
import { reportAddon as reportAddonApi } from 'core/api/abuse';
import log from 'core/logger';
import {
  INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
  SEND_ADDON_ABUSE_REPORT,
  finishAddonAbuseReportViaFirefox,
  loadAddonAbuseReport,
} from 'core/reducers/abuse';
import { createErrorHandler, getState } from 'core/sagas/utils';
import type { ReportAddonParams } from 'core/api/abuse';
import type {
  InitiateAddonAbuseReportViaFirefoxAction,
  SendAddonAbuseReportAction,
} from 'core/reducers/abuse';
import type { Saga } from 'core/types/sagas';

export function* reportAddon({
  payload: { addonSlug, errorHandlerId, message },
}: SendAddonAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: ReportAddonParams = {
      addonSlug,
      api: state.api,
      message,
    };
    const response = yield call(reportAddonApi, params);

    yield put(
      loadAddonAbuseReport({
        addon: response.addon,
        message: response.message,
        reporter: response.reporter,
      }),
    );
  } catch (error) {
    log.warn(`Reporting add-on for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));
  }
}

export function* reportAddonViaFirefox({
  payload: { addon },
}: InitiateAddonAbuseReportViaFirefoxAction): Saga {
  const abuseReported = yield reportAbuse(addon.guid);
  if (abuseReported) {
    yield put(
      loadAddonAbuseReport({
        addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
        message: 'Abuse report via Firefox',
        reporter: null,
      }),
    );
  } else {
    yield put(finishAddonAbuseReportViaFirefox());
  }
}

export default function* abuseSaga(): Saga {
  yield takeLatest(
    INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
    reportAddonViaFirefox,
  );
  yield takeLatest(SEND_ADDON_ABUSE_REPORT, reportAddon);
}
