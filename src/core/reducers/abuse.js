/* @flow */
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
  errorHandlerId: string,
  message: string,
|};

export function sendAddonAbuseReport(
  { addonSlug, errorHandlerId, message }: SendAddonAbuseReportAction
) {
  if (!addonSlug) {
    throw new Error('addonSlug is required');
  }
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!message) {
    throw new Error('message is required');
  }

  return {
    type: SEND_ADDON_ABUSE_REPORT,
    payload: { addonSlug, errorHandlerId, message },
  };
}

export const initialState = {
  bySlug: {},
};

type ReducerState = {|
  bySlug: {
    [addonSlug: string]: {| message: string, reporter: string |},
  },
|};

export default function abuseReducer(
  state: ReducerState = initialState,
  action: Object
) {
  switch (action.type) {
    case LOAD_ADDON_ABUSE_REPORT: {
      const { addon, message, reporter } = action.payload;
      return {
        ...state,
        bySlug: {
          ...state.bySlug,
          [addon.slug]: { message, reporter },
        },
      };
    }
    default:
      return state;
  }
}
