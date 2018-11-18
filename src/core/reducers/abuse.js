/* @flow */
import invariant from 'invariant';

import type { AddonType } from 'core/types/addons';
import type { AbuseReporter } from 'core/api/abuse';

export const DISABLE_ADDON_ABUSE_BUTTON_UI = 'DISABLE_ADDON_ABUSE_BUTTON_UI';
export const ENABLE_ADDON_ABUSE_BUTTON_UI = 'ENABLE_ADDON_ABUSE_BUTTON_UI';
export const HIDE_ADDON_ABUSE_REPORT_UI = 'HIDE_ADDON_ABUSE_REPORT_UI';
export const LOAD_ADDON_ABUSE_REPORT: 'LOAD_ADDON_ABUSE_REPORT' =
  'LOAD_ADDON_ABUSE_REPORT';
export const SEND_ADDON_ABUSE_REPORT: 'SEND_ADDON_ABUSE_REPORT' =
  'SEND_ADDON_ABUSE_REPORT';
export const SHOW_ADDON_ABUSE_REPORT_UI = 'SHOW_ADDON_ABUSE_REPORT_UI';

type DisableAddonAbuseButtonUIType = {| addon: AddonType |};

export function disableAbuseButtonUI({
  addon,
}: DisableAddonAbuseButtonUIType = {}) {
  if (!addon) {
    throw new Error('addon is required');
  }

  return {
    type: DISABLE_ADDON_ABUSE_BUTTON_UI,
    payload: { addon },
  };
}

type EnableAddonAbuseButtonUIType = { addon: AddonType };

export function enableAbuseButtonUI({
  addon,
}: EnableAddonAbuseButtonUIType = {}) {
  if (!addon) {
    throw new Error('addon is required');
  }

  return {
    type: ENABLE_ADDON_ABUSE_BUTTON_UI,
    payload: { addon },
  };
}

type HideAddonAbuseReportUIType = { addon: AddonType };

export function hideAddonAbuseReportUI({
  addon,
}: HideAddonAbuseReportUIType = {}) {
  if (!addon) {
    throw new Error('addon is required');
  }

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
  if (!addon) {
    throw new Error('addon is required');
  }
  if (!message) {
    throw new Error('message is required');
  }
  if (reporter === undefined) {
    throw new Error('reporter cannot be undefined');
  }

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

type ShowAddonAbuseReportUIType = { addon: AddonType };

export function showAddonAbuseReportUI({
  addon,
}: ShowAddonAbuseReportUIType = {}) {
  if (!addon) {
    throw new Error('addon is required');
  }

  return {
    type: SHOW_ADDON_ABUSE_REPORT_UI,
    payload: { addon },
  };
}

export const initialState = {
  bySlug: {},
  loading: false,
};

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

type Action = Object | SendAddonAbuseReportAction | LoadAddonAbuseReportAction;

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
