/* @flow */
import invariant from 'invariant';

import type { AddonType } from 'amo/types/addons';
import type { AbuseReporter, ReportAddonResponse } from 'amo/api/abuse';

export const ABORT_ABUSE_REPORT: 'ABORT_ABUSE_REPORT' = 'ABORT_ABUSE_REPORT';
export const HIDE_ADDON_ABUSE_REPORT_UI: 'HIDE_ADDON_ABUSE_REPORT_UI' =
  'HIDE_ADDON_ABUSE_REPORT_UI';
export const LOAD_ADDON_ABUSE_REPORT: 'LOAD_ADDON_ABUSE_REPORT' =
  'LOAD_ADDON_ABUSE_REPORT';
export const SEND_ADDON_ABUSE_REPORT: 'SEND_ADDON_ABUSE_REPORT' =
  'SEND_ADDON_ABUSE_REPORT';
export const SHOW_ADDON_ABUSE_REPORT_UI: 'SHOW_ADDON_ABUSE_REPORT_UI' =
  'SHOW_ADDON_ABUSE_REPORT_UI';
export const INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX: 'INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX' =
  'INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX';
export const FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX: 'FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX' =
  'FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX';

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
  uiVisible?: boolean,
|};

export type AbuseState = {|
  bySlug: {
    [addonId: string]: AddonAbuseState,
  },
  loading: boolean,
|};

export const initialState: AbuseState = {
  bySlug: {},
  loading: false,
};

type HideAddonAbuseReportUIParams = {| addon: AddonType |};

type HideAddonAbuseReportUIAction = {|
  type: typeof HIDE_ADDON_ABUSE_REPORT_UI,
  payload: HideAddonAbuseReportUIParams,
|};

export function hideAddonAbuseReportUI({
  addon,
}: HideAddonAbuseReportUIParams): HideAddonAbuseReportUIAction {
  invariant(addon, 'addon is required');

  return {
    type: HIDE_ADDON_ABUSE_REPORT_UI,
    payload: { addon },
  };
}

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
  reporterEmail?: string | null,
  reporterName?: string | null,
  message: string,
  reason?: string | null,
  location?: string | null,
  addonVersion?: string | null,
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
  message,
  reason = null,
  location = null,
  addonVersion = null,
}: SendAddonAbuseReportParams): SendAddonAbuseReportAction {
  invariant(addonId, 'addonId is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(message, 'message is required');

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
    },
  };
}

type ShowAddonAbuseReportUIParams = {| addon: AddonType |};

type ShowAddonAbuseReportUIAction = {|
  type: typeof SHOW_ADDON_ABUSE_REPORT_UI,
  payload: ShowAddonAbuseReportUIParams,
|};

export function showAddonAbuseReportUI({
  addon,
}: ShowAddonAbuseReportUIParams): ShowAddonAbuseReportUIAction {
  invariant(addon, 'addon is required');

  return {
    type: SHOW_ADDON_ABUSE_REPORT_UI,
    payload: { addon },
  };
}

type InitiateAddonAbuseReportViaFirefoxParams = {| addon: AddonType |};

export type InitiateAddonAbuseReportViaFirefoxAction = {|
  type: typeof INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
  payload: InitiateAddonAbuseReportViaFirefoxParams,
|};

export function initiateAddonAbuseReportViaFirefox({
  addon,
}: InitiateAddonAbuseReportViaFirefoxParams): InitiateAddonAbuseReportViaFirefoxAction {
  invariant(addon, 'addon is required');

  return {
    type: INITIATE_ADDON_ABUSE_REPORT_VIA_FIREFOX,
    payload: { addon },
  };
}

export type FinishAddonAbuseReportViaFirefoxAction = {|
  type: typeof FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX,
|};

export function finishAddonAbuseReportViaFirefox(): FinishAddonAbuseReportViaFirefoxAction {
  return {
    type: FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX,
  };
}

type Action =
  | FinishAddonAbuseReportViaFirefoxAction
  | HideAddonAbuseReportUIAction
  | InitiateAddonAbuseReportViaFirefoxAction
  | LoadAddonAbuseReportAction
  | SendAddonAbuseReportAction
  | ShowAddonAbuseReportUIAction;

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
    case HIDE_ADDON_ABUSE_REPORT_UI: {
      const { addon } = action.payload;

      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { ...state.bySlug[addon.slug], uiVisible: false },
        },
      };
    }
    case LOAD_ADDON_ABUSE_REPORT: {
      const { addon, message, reporter } = action.payload;
      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { message, reporter, uiVisible: false },
        },
        loading: false,
      };
    }
    case SEND_ADDON_ABUSE_REPORT:
      return { ...state, loading: true };
    case SHOW_ADDON_ABUSE_REPORT_UI: {
      const { addon } = action.payload;

      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { ...state.bySlug[addon.slug], uiVisible: true },
        },
      };
    }
    case FINISH_ADDON_ABUSE_REPORT_VIA_FIREFOX:
      return { ...state, loading: false };
    default:
      return state;
  }
}
