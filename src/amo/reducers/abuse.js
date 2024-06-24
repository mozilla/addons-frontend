/* @flow */
import invariant from 'invariant';

import type { AbuseReporter, ReportAddonResponse } from 'amo/api/abuse';

export const ABORT_ABUSE_REPORT: 'ABORT_ABUSE_REPORT' = 'ABORT_ABUSE_REPORT';
export const LOAD_ADDON_ABUSE_REPORT: 'LOAD_ADDON_ABUSE_REPORT' =
  'LOAD_ADDON_ABUSE_REPORT';
export const SEND_ADDON_ABUSE_REPORT: 'SEND_ADDON_ABUSE_REPORT' =
  'SEND_ADDON_ABUSE_REPORT';

type AbortAbuseReportParams = {|
  addonId: string,
|};

type AbortAbuseReportAction = {|
  type: typeof ABORT_ABUSE_REPORT,
  payload: AbortAbuseReportParams,
|};

export function abortAbuseReport({
  addonId,
}: AbortAbuseReportParams): AbortAbuseReportAction {
  invariant(addonId, 'addonId is required');

  return {
    type: ABORT_ABUSE_REPORT,
    payload: { addonId },
  };
}

export type AddonAbuseState = {|
  buttonEnabled?: boolean,
  message: string | null,
  reporter: AbuseReporter | null,
|};

export type AbuseState = {|
  byGUID: {
    [addonId: string]: AddonAbuseState,
  },
  loading: boolean,
|};

export const initialState: AbuseState = {
  byGUID: {},
  loading: false,
};

type LoadAddonAbuseReportAction = {|
  type: typeof LOAD_ADDON_ABUSE_REPORT,
  payload: ReportAddonResponse,
|};

export function loadAddonAbuseReport({
  addon,
  reporter_email,
  reporter_name,
  message,
  reason,
  reporter,
  location,
  addon_version,
}: ReportAddonResponse): LoadAddonAbuseReportAction {
  invariant(addon, 'addon is required');
  invariant(typeof message !== 'undefined', 'message must be defined');
  invariant(typeof reporter !== 'undefined', 'reporter must be defined');

  return {
    type: LOAD_ADDON_ABUSE_REPORT,
    payload: {
      addon,
      reporter_email,
      reporter_name,
      message,
      reason,
      reporter,
      location,
      addon_version,
    },
  };
}

type SendAddonAbuseReportParams = {|
  addonId: string,
  errorHandlerId: string,
  reporterEmail: string | null,
  reporterName: string | null,
  message: string | null,
  reason: string | null,
  location: string | null,
  addonVersion: string | null,
  illegalCategory: string | null,
  illegalSubcategory: string | null,
  auth: boolean,
|};

export type SendAddonAbuseReportAction = {|
  type: typeof SEND_ADDON_ABUSE_REPORT,
  payload: SendAddonAbuseReportParams,
|};

export function sendAddonAbuseReport({
  addonId,
  errorHandlerId,
  reporterEmail = null,
  reporterName = null,
  message = null,
  reason = null,
  location = null,
  addonVersion = null,
  illegalCategory = null,
  illegalSubcategory = null,
  auth,
}: SendAddonAbuseReportParams): SendAddonAbuseReportAction {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');

  return {
    type: SEND_ADDON_ABUSE_REPORT,
    payload: {
      addonId,
      errorHandlerId,
      reporterEmail,
      reporterName,
      message,
      reason,
      location,
      addonVersion,
      illegalCategory,
      illegalSubcategory,
      auth,
    },
  };
}

type Action = LoadAddonAbuseReportAction | SendAddonAbuseReportAction;

export default function abuseReducer(
  // eslint-disable-next-line default-param-last
  state: AbuseState = initialState,
  action: Action,
): AbuseState {
  switch (action.type) {
    case ABORT_ABUSE_REPORT: {
      return {
        ...state,
        loading: false,
      };
    }
    case LOAD_ADDON_ABUSE_REPORT: {
      const { addon, message, reporter } = action.payload;
      return {
        ...state,
        byGUID: {
          ...state.byGUID,
          [addon.guid]: { message, reporter },
        },
        loading: false,
      };
    }
    case SEND_ADDON_ABUSE_REPORT:
      return { ...state, loading: true };
    default:
      return state;
  }
}
