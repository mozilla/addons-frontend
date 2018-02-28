/* @flow */
import type { UserType } from 'amo/reducers/users';

export const HIDE_USER_ABUSE_REPORT_UI = 'HIDE_USER_ABUSE_REPORT_UI';
export const LOAD_USER_ABUSE_REPORT = 'LOAD_USER_ABUSE_REPORT';
export const SEND_USER_ABUSE_REPORT = 'SEND_USER_ABUSE_REPORT';
export const SHOW_USER_ABUSE_REPORT_UI = 'SHOW_USER_ABUSE_REPORT_UI';


type HideUserAbuseReportUIType = {|
  user: UserType,
|};

export function hideUserAbuseReportUI(
  { user }: HideUserAbuseReportUIType = {}
) {
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: HIDE_USER_ABUSE_REPORT_UI,
    payload: { user },
  };
}

type LoadUserAbuseReportType = {|
  message: string,
  reporter: Object | null,
  user: {|
    id: number,
    name: string,
    url: string,
    username: string,
  |},
|};

export function loadUserAbuseReport(
  { message, reporter, user }: LoadUserAbuseReportType = {}
) {
  if (!message) {
    throw new Error('message is required');
  }
  if (reporter === undefined) {
    throw new Error('reporter cannot be undefined');
  }
  if (!user) {
    throw new Error('user is required');
  }

  return {
    type: LOAD_USER_ABUSE_REPORT,
    payload: { message, reporter, user },
  };
}

type SendUserAbuseReportAction = {|
  errorHandlerId: string,
  message: string,
  user: UserType | null,
|};

export function sendUserAbuseReport(
  { errorHandlerId, message, user }: SendUserAbuseReportAction = {}
) {
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

type ShowUserAbuseReportUIType = {|
  user?: UserType,
|};

export function showUserAbuseReportUI(
  { user }: ShowUserAbuseReportUIType = {}
) {
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
  reporter: Object | null,
  uiVisible?: boolean,
|}

export type UserAbuseReportsState = {|
  byUserId: {
    [userId: number]: UserAbuseReportState,
  },
|};

export default function userAbuseReportReducer(
  state: UserAbuseReportsState = initialState,
  action: Object
) {
  switch (action.type) {
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
      const { message, reporter, user } = action.payload;
      return {
        ...state,
        byUserId: {
          ...state.byUserId,
          [user.id]: {
            message,
            reporter,
            user,
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
