/* @flow */
import { call, put, select, takeLatest } from 'redux-saga/effects';

import { reportAbuse } from 'amo/addonManager';
import { reportAddon as reportAddonApi } from 'amo/api/abuse';
import log from 'amo/logger';
import {
  INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
  SEND_ADDON_ABUSE_REPORT,
  abortAbuseReport,
  finishAddonAbuseReportViaFirefox,
  loadAddonAbuseReport,
} from 'amo/reducers/abuse';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { ReportAddonParams } from 'amo/api/abuse';
import type {
  InitiateAddonAbuseReportViaFirefoxAction,
  SendAddonAbuseReportAction,
} from 'amo/reducers/abuse';
import type { Saga } from 'amo/types/sagas';

export function* reportAddon({
  payload: {
    addonId,
    errorHandlerId,
    reporterEmail,
    reporterName,
    message,
    reason,
    location,
  },
}: SendAddonAbuseReportAction): Saga {
  const errorHandler = createErrorHandler(errorHandlerId);

  yield put(errorHandler.createClearingAction());

  try {
    const state = yield select(getState);

    const params: ReportAddonParams = {
      addonId,
      api: state.api,
      reporterName: reporterName || null,
      reporterEmail: reporterEmail || null,
      message,
      reason: reason || null,
      location: location || null,
    };
    const response = yield call(reportAddonApi, params);

    yield put(
      loadAddonAbuseReport({
        addon: response.addon,
        reporterName: response.reporter_name,
        reporterEmail: response.reporter_email,
        message: response.message,
        reason: response.reason,
        reporter: response.reporter,
        location: response.location,
      }),
    );
  } catch (error) {
    log.warn(`Reporting add-on for abuse failed: ${error}`);
    yield put(errorHandler.createErrorAction(error));

    yield put(abortAbuseReport({ addonId }));
  }
}

export function* reportAddonViaFirefox({
  payload: { addon },
}: InitiateAddonAbuseReportViaFirefoxAction): Saga {
  try {
    const abuseReported = yield reportAbuse(addon.guid);
    if (abuseReported) {
      yield put(
        loadAddonAbuseReport({
          addon: { guid: addon.guid, id: addon.id, slug: addon.slug },
          message: null,
          reporter: null,
          reporterEmail: null,
          reporterName: null,
          reason: null,
          location: null,
        }),
      );
    }
  } catch (error) {
    log.warn(`Reporting add-on for abuse via firefox failed: ${error}`);
  }
  yield put(finishAddonAbuseReportViaFirefox());
}

export default function* abuseSaga(): Saga {
  yield takeLatest(
    INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
    reportAddonViaFirefox,
  );
  yield takeLatest(SEND_ADDON_ABUSE_REPORT, reportAddon);
}
