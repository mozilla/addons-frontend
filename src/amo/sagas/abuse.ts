import { call, put, select, takeLatest } from 'redux-saga/effects';

import { reportAbuse } from 'amo/addonManager';
import { reportAddon as reportAddonApi } from 'amo/api/abuse';
import log from 'amo/logger';
import { INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX, SEND_ADDON_ABUSE_REPORT, finishAddonAbuseReportViaFirefox, loadAddonAbuseReport } from 'amo/reducers/abuse';
import { createErrorHandler, getState } from 'amo/sagas/utils';
import type { ReportAddonParams } from 'amo/api/abuse';
import type { InitiateAddonAbuseReportViaFirefoxAction, SendAddonAbuseReportAction } from 'amo/reducers/abuse';
import type { Saga } from 'amo/types/sagas';

export function* reportAddon({
  payload: {
    addonSlug,
    errorHandlerId,
    message,
  },
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
export function* reportAddonViaFirefox({
  payload: {
    addon,
  },
}: InitiateAddonAbuseReportViaFirefoxAction): Saga {
  try {
    const abuseReported = yield reportAbuse(addon.guid);

    if (abuseReported) {
      yield put(loadAddonAbuseReport({
        addon: {
          guid: addon.guid,
          id: addon.id,
          slug: addon.slug,
        },
        message: null,
        reporter: null,
      }));
    }
  } catch (error) {
    log.warn(`Reporting add-on for abuse via firefox failed: ${error}`);
  }

  yield put(finishAddonAbuseReportViaFirefox());
}
export default function* abuseSaga(): Saga {
  yield takeLatest(INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX, reportAddonViaFirefox);
  yield takeLatest(SEND_ADDON_ABUSE_REPORT, reportAddon);
}