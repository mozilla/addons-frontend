/* @flow */
import invariant from 'invariant';

import type { AbuseReporter } from 'amo/api/abuse';

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
  userId: number,
|};

type AbortUserAbuseReportAction = {|
  type: typeof ABORT_USER_ABUSE_REPORT,
  payload: AbortUserAbuseReportParams,
|};

export function abortUserAbuseReport({
  userId,
}: AbortUserAbuseReportParams = {}): AbortUserAbuseReportAction {
  invariant(userId, 'userId is required');

  return {
    type: ABORT_USER_ABUSE_REPORT,
    payload: { userId },
  };
}

type HideUserAbuseReportUIParams = {|
  userId: number,
|};

type HideUserAbuseReportUIAction = {|
  type: typeof HIDE_USER_ABUSE_REPORT_UI,
  payload: HideUserAbuseReportUIParams,
|};

export function hideUserAbuseReportUI({
  userId,
}: HideUserAbuseReportUIParams = {}): HideUserAbuseReportUIAction {
  invariant(userId, 'userId is required');

  return {
    type: HIDE_USER_ABUSE_REPORT_UI,
    payload: { userId },
  };
}

type LoadUserAbuseReportParams = {|
  message: string,
  reporter: AbuseReporter,
  userId: number,
|};

type LoadUserAbuseReportAction = {|
  type: typeof LOAD_USER_ABUSE_REPORT,
  payload: {|
    message: string,
    reportedByUserId: number | null,
    userId: number,
  |},
|};

export function loadUserAbuseReport({
  message,
  reporter,
  userId,
}: LoadUserAbuseReportParams = {}): LoadUserAbuseReportAction {
  invariant(message, 'message is required');
  invariant(reporter !== undefined, 'reporter cannot be undefined');
  invariant(userId, 'userId is required');

  const reportedByUserId = reporter ? reporter.id : null;

  return {
    type: LOAD_USER_ABUSE_REPORT,
    payload: { message, reportedByUserId, userId },
  };
}

export type SendUserAbuseReportParams = {|
  errorHandlerId: string,
  message: string,
  userId: number,
|};

export type SendUserAbuseReportAction = {|
  type: typeof SEND_USER_ABUSE_REPORT,
  payload: SendUserAbuseReportParams,
|};

export function sendUserAbuseReport({
  errorHandlerId,
  message,
  userId,
}: SendUserAbuseReportParams = {}): SendUserAbuseReportAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(message, 'message is required');
  invariant(userId, 'userId is required');

  return {
    type: SEND_USER_ABUSE_REPORT,
    payload: { errorHandlerId, message, userId },
  };
}

type ShowUserAbuseReportUIParams = {|
  userId: number,
|};

type ShowUserAbuseReportUIActions = {|
  type: typeof SHOW_USER_ABUSE_REPORT_UI,
  payload: ShowUserAbuseReportUIParams,
|};

export function showUserAbuseReportUI({
  userId,
}: ShowUserAbuseReportUIParams = {}): ShowUserAbuseReportUIActions {
  invariant(userId, 'userId is required');

  return {
    type: SHOW_USER_ABUSE_REPORT_UI,
    payload: { userId },
  };
}

export type UserAbuseReportState = {|
  hasSubmitted?: boolean,
  isSubmitting: boolean,
  message?: string,
  reportedByUserId: number | null,
  uiVisible?: boolean,
|};

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

export const initialState: UserAbuseReportsState = {
  byUserId: {},
};

export default function userAbuseReportReducer(
  state: UserAbuseReportsState = initialState,
  action: UserAbuseReportActionType,
): UserAbuseReportsState {
  switch (action.type) {
    case ABORT_USER_ABUSE_REPORT: {
      const { userId } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: {
            ...state.byUserId[userId],
            hasSubmitted: false,
            isSubmitting: false,
            uiVisible: false,
          },
        },
      };
    }
    case HIDE_USER_ABUSE_REPORT_UI: {
      const { userId } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: { ...state.byUserId[userId], uiVisible: false },
        },
      };
    }
    case LOAD_USER_ABUSE_REPORT: {
      const { message, reportedByUserId, userId } = action.payload;
      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: {
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
      const { userId } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: { ...state.byUserId[userId], isSubmitting: true },
        },
      };
    }
    case SHOW_USER_ABUSE_REPORT_UI: {
      const { userId } = action.payload;

      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [userId]: { ...state.byUserId[userId], uiVisible: true },
        },
      };
    }
    default:
      return state;
  }
}
