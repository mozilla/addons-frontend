/* @flow */
import type { ErrorHandlerType } from 'core/errorHandler';


export const LOAD_ADDON_ABUSE_REPORT = 'LOAD_ADDON_ABUSE_REPORT';
export const SEND_ADDON_ABUSE_REPORT = 'SEND_ADDON_ABUSE_REPORT';

type LoadAddonAbuseReportType = {
  addon: {|
    guid: string,
    id: number,
    slug: string,
  |},
  message: string,
  reporter: Object | null,
};

export function loadAddonAbuseReport(
  { addon, message, reporter }: LoadAddonAbuseReportType
) {
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

type SendAddonAbuseReportAction = {|
  addonSlug: string,
  errorHandler: ErrorHandlerType,
  message: string,
|};

export function sendAddonAbuseReport(
  { addonSlug, errorHandler, message }: SendAddonAbuseReportAction
) {
  if (!addonSlug) {
    throw new Error('addonSlug is required');
  }
  if (!errorHandler) {
    throw new Error('errorHandler is required');
  }
  if (!message) {
    throw new Error('message is required');
  }

  return {
    type: SEND_ADDON_ABUSE_REPORT,
    payload: { addonSlug, errorHandlerId: errorHandler.id, message },
  };
}

export const initialState = {};

type ReducerState = {};

export default function abuseReducer(
  state: ReducerState = initialState,
  action: Object
) {
  switch (action.type) {
    case LOAD_ADDON_ABUSE_REPORT: {
      const { addon, message, reporter } = action.payload;
      return {
        ...state,
        [addon.slug]: { message, reporter },
      };
    }
    default:
      return state;
  }
}
