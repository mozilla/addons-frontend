/* @flow */
import type { UserType } from 'amo/reducers/users';

export const ABORT_USER_ABUSE_REPORT: 'ABORT_USER_ABUSE_REPORT' =
  'ABORT_USER_ABUSE_REPORT';
export const HIDE_USER_ABUSE_REPORT_UI: 'HIDE_USER_ABUSE_REPORT_UI' =
  'HIDE_USER_ABUSE_REPORT_UI';
export const LOAD_USER_ABUSE_REPORT: 'LOAD_USER_ABUSE_REPORT' =
  'LOAD_USER_ABUSE_REPORT';
export const SEND_USER_ABUSE_REPORT: 'SEND_USER_ABUSE_REPORT' =
  'SEND_USER_ABUSE_REPORT';
export const SHOW_USER_ABUSE_REPORT_UI: 'SHOW_USER_ABUSE_REPORT_UI' =
  'SHOW_USER_ABUSE_REPORT_UI';


type AbortUserAbuseReportParams = {|
  user: UserType,
|};

type AbortUserAbuseReportAction = {|
  type: typeof ABORT_USER_ABUSE_REPORT,
  payload: AbortUserAbuseReportParams,
|};

export function abortUserAbuseReport(
  { user }: AbortUserAbuseReportParams = {}
): AbortUserAbuseReportAction {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: ABORT_USER_ABUSE_REPORT,
    payload: { user },
  };
}

type HideUserAbuseReportUIParams = {|
  user: UserType,
|};

type HideUserAbuseReportUIAction = {|
  type: typeof HIDE_USER_ABUSE_REPORT_UI,
  payload: HideUserAbuseReportUIParams,
|};

export function hideUserAbuseReportUI(
  { user }: HideUserAbuseReportUIParams = {}
): HideUserAbuseReportUIAction {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: HIDE_USER_ABUSE_REPORT_UI,
    payload: { user },
  };
}

type LoadUserAbuseReportParams = {|
  message: string,
  reporter: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |} | null,
  user: UserType,
|};

type LoadUserAbuseReportAction = {|
  type: typeof LOAD_USER_ABUSE_REPORT,
  payload: {|
    message: string,
    reportedByUserId: number | null,
    user: UserType,
  |},
|};

export function loadUserAbuseReport(
  { message, reporter, user }: LoadUserAbuseReportParams = {}
): LoadUserAbuseReportAction {
  if (!message) {
    throw new Error('message is required');
  }
  if (reporter === undefined) {
    throw new Error('reporter cannot be undefined');
  }
  if (!user) {
    throw new Error('user is required');
  }

  const reportedByUserId = reporter ? reporter.id : null;

  return {
    type: LOAD_USER_ABUSE_REPORT,
    payload: { message, reportedByUserId, user },
  };
}

type SendUserAbuseReportParams = {|
  errorHandlerId: string,
  message: string,
  user: UserType,
|};

type SendUserAbuseReportAction = {|
  type: typeof SEND_USER_ABUSE_REPORT,
  payload: SendUserAbuseReportParams,
|};

export function sendUserAbuseReport(
  { errorHandlerId, message, user }: SendUserAbuseReportParams = {}
): SendUserAbuseReportAction {
  if (!errorHandlerId) {
    throw new Error('errorHandlerId is required');
  }
  if (!message) {
    throw new Error('message is required');
  }
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: SEND_USER_ABUSE_REPORT,
    payload: { errorHandlerId, message, user },
  };
}

type ShowUserAbuseReportUIParams = {|
  user: UserType,
|};

type ShowUserAbuseReportUIActions = {|
  type: typeof SHOW_USER_ABUSE_REPORT_UI,
  payload: ShowUserAbuseReportUIParams,
|};

export function showUserAbuseReportUI(
  { user }: ShowUserAbuseReportUIParams = {}
): ShowUserAbuseReportUIActions {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: SHOW_USER_ABUSE_REPORT_UI,
    payload: { user },
  };
}

export const initialState = {
  byUserId: {},
};

export type UserAbuseReportState = {|
  hasSubmitted?: bool,
  isSubmitting: bool,
  message?: string,
  reportedByUserId: number | null,
  uiVisible?: boolean,
|}

export type UserAbuseReportsState = {|
  byUserId: {
    [userId: number]: UserAbuseReportState,
  },
|};

export type UserAbuseReportActionType =
  | AbortUserAbuseReportAction
  | HideUserAbuseReportUIAction
  | SendUserAbuseReportAction
  | ShowUserAbuseReportUIActions
  | LoadUserAbuseReportAction;

export default function userAbuseReportReducer(
  state: UserAbuseReportsState = initialState,
  action: UserAbuseReportActionType,
) {
  switch (action.type) {
    case ABORT_USER_ABUSE_REPORT: {
      const { user } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: {
            ...state.byUserId[user.id],
            hasSubmitted: false,
            isSubmitting: false,
            uiVisible: false,
          },
        },
      };
    }
    case HIDE_USER_ABUSE_REPORT_UI: {
      const { user } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: { ...state.byUserId[user.id], uiVisible: false },
        },
      };
    }
    case LOAD_USER_ABUSE_REPORT: {
      const { message, reportedByUserId, user } = action.payload;
      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: {
            message,
            reportedByUserId,
            hasSubmitted: true,
            isSubmitting: false,
            uiVisible: false,
          },
        },
      };
    }
    case SEND_USER_ABUSE_REPORT: {
      const { user } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: { ...state.byUserId[user.id], isSubmitting: true },
        },
      };
    }
    case SHOW_USER_ABUSE_REPORT_UI: {
      const { user } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: { ...state.byUserId[user.id], uiVisible: true },
        },
      };
    }
    default:
      return state;
  }
}
