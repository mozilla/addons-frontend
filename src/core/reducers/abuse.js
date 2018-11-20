/* @flow */
import invariant from 'invariant';

import type { AddonType } from 'core/types/addons';
import type { AbuseReporter } from 'core/api/abuse';

export const DISABLE_ADDON_ABUSE_BUTTON_UI: 'DISABLE_ADDON_ABUSE_BUTTON_UI' =
  'DISABLE_ADDON_ABUSE_BUTTON_UI';
export const ENABLE_ADDON_ABUSE_BUTTON_UI: 'ENABLE_ADDON_ABUSE_BUTTON_UI' =
  'ENABLE_ADDON_ABUSE_BUTTON_UI';
export const HIDE_ADDON_ABUSE_REPORT_UI: 'HIDE_ADDON_ABUSE_REPORT_UI' =
  'HIDE_ADDON_ABUSE_REPORT_UI';
export const LOAD_ADDON_ABUSE_REPORT: 'LOAD_ADDON_ABUSE_REPORT' =
  'LOAD_ADDON_ABUSE_REPORT';
export const SEND_ADDON_ABUSE_REPORT: 'SEND_ADDON_ABUSE_REPORT' =
  'SEND_ADDON_ABUSE_REPORT';
export const SHOW_ADDON_ABUSE_REPORT_UI: 'SHOW_ADDON_ABUSE_REPORT_UI' =
  'SHOW_ADDON_ABUSE_REPORT_UI';

export type AddonAbuseState = {|
  buttonEnabled?: boolean,
  message: string,
  reporter: AbuseReporter | null,
  uiVisible?: boolean,
|};

export type AbuseState = {|
  bySlug: {
    [addonSlug: string]: AddonAbuseState,
  },
  loading: boolean,
|};

export const initialState: AbuseState = {
  bySlug: {},
  loading: false,
};

type DisableAbuseButtonUIParams = {| addon: AddonType |};

type DisableAbuseButtonUIAction = {|
  type: typeof DISABLE_ADDON_ABUSE_BUTTON_UI,
  payload: DisableAbuseButtonUIParams,
|};

export function disableAbuseButtonUI({
  addon,
}: DisableAbuseButtonUIParams): DisableAbuseButtonUIAction {
  invariant(addon, 'addon is required');

  return {
    type: DISABLE_ADDON_ABUSE_BUTTON_UI,
    payload: { addon },
  };
}

type EnableAbuseButtonUIParams = {| addon: AddonType |};

type EnableAbuseButtonUIAction = {|
  type: typeof ENABLE_ADDON_ABUSE_BUTTON_UI,
  payload: EnableAbuseButtonUIParams,
|};

export function enableAbuseButtonUI({
  addon,
}: EnableAbuseButtonUIParams): EnableAbuseButtonUIAction {
  invariant(addon, 'addon is required');

  return {
    type: ENABLE_ADDON_ABUSE_BUTTON_UI,
    payload: { addon },
  };
}

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

type LoadAddonAbuseReportParams = {|
  addon: {|
    guid: string,
    id: number,
    slug: string,
  |},
  message: string,
  reporter: AbuseReporter | null,
|};

type LoadAddonAbuseReportAction = {|
  type: typeof LOAD_ADDON_ABUSE_REPORT,
  payload: LoadAddonAbuseReportParams,
|};

export function loadAddonAbuseReport({
  addon,
  message,
  reporter,
}: LoadAddonAbuseReportParams): LoadAddonAbuseReportAction {
  invariant(addon, 'addon is required');
  invariant(message, 'message is required');
  invariant(typeof reporter !== 'undefined', 'reporter must be defined');

  return {
    type: LOAD_ADDON_ABUSE_REPORT,
    payload: { addon, message, reporter },
  };
}

type SendAddonAbuseReportParams = {|
  addonSlug: string,
  errorHandlerId: string,
  message: string,
|};

export type SendAddonAbuseReportAction = {|
  type: typeof SEND_ADDON_ABUSE_REPORT,
  payload: SendAddonAbuseReportParams,
|};

export function sendAddonAbuseReport({
  addonSlug,
  errorHandlerId,
  message,
}: SendAddonAbuseReportParams): SendAddonAbuseReportAction {
  invariant(addonSlug, 'addonSlug is required');
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(message, 'message is required');

  return {
    type: SEND_ADDON_ABUSE_REPORT,
    payload: { addonSlug, errorHandlerId, message },
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

type Action =
  | DisableAbuseButtonUIAction
  | EnableAbuseButtonUIAction
  | HideAddonAbuseReportUIAction
  | LoadAddonAbuseReportAction
  | SendAddonAbuseReportAction
  | ShowAddonAbuseReportUIAction;

export default function abuseReducer(
  state: AbuseState = initialState,
  action: Action,
) {
  switch (action.type) {
    case DISABLE_ADDON_ABUSE_BUTTON_UI: {
      const { addon } = action.payload;

      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { ...state.bySlug[addon.slug], buttonEnabled: false },
        },
      };
    }
    case ENABLE_ADDON_ABUSE_BUTTON_UI: {
      const { addon } = action.payload;

      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { ...state.bySlug[addon.slug], buttonEnabled: true },
        },
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
    default:
      return state;
  }
}
