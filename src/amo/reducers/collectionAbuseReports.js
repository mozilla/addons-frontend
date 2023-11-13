/* @flow */
import invariant from 'invariant';

type CollectionAbuseReport = {|
  isSubmitting: boolean,
  hasSubmitted: boolean,
|};

export type CollectionAbuseReportsState = {|
  byCollectionId: {
    [collectionId: number]: CollectionAbuseReport,
  },
|};

export const SEND_COLLECTION_ABUSE_REPORT: 'SEND_COLLECTION_ABUSE_REPORT' =
  'SEND_COLLECTION_ABUSE_REPORT';
export const LOAD_COLLECTION_ABUSE_REPORT: 'LOAD_COLLECTION_ABUSE_REPORT' =
  'LOAD_COLLECTION_ABUSE_REPORT';
export const ABORT_COLLECTION_ABUSE_REPORT: 'ABORT_COLLECTION_ABUSE_REPORT' =
  'ABORT_COLLECTION_ABUSE_REPORT';

type SendCollectionAbuseReportParams = {|
  auth: boolean,
  errorHandlerId: string,
  message: string | null,
  collectionId: number,
  reason: string | null,
  reporterEmail: string | null,
  reporterName: string | null,
|};

export type SendCollectionAbuseReportAction = {|
  type: typeof SEND_COLLECTION_ABUSE_REPORT,
  payload: SendCollectionAbuseReportParams,
|};

export const sendCollectionAbuseReport = ({
  auth,
  errorHandlerId,
  message,
  collectionId,
  reason,
  reporterEmail,
  reporterName,
}: SendCollectionAbuseReportParams): SendCollectionAbuseReportAction => {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(collectionId, 'collectionId is required');

  return {
    type: SEND_COLLECTION_ABUSE_REPORT,
    payload: {
      auth,
      errorHandlerId,
      message,
      collectionId,
      reason,
      reporterEmail,
      reporterName,
    },
  };
};

type AbortCollectionAbuseReportParams = {|
  collectionId: number,
|};

export type AbortCollectionAbuseReportAction = {|
  type: typeof ABORT_COLLECTION_ABUSE_REPORT,
  payload: AbortCollectionAbuseReportParams,
|};

export const abortCollectionAbuseReport = ({
  collectionId,
}: AbortCollectionAbuseReportParams): AbortCollectionAbuseReportAction => {
  invariant(collectionId, 'collectionId is required');

  return {
    type: ABORT_COLLECTION_ABUSE_REPORT,
    payload: { collectionId },
  };
};

type LoadCollectionAbuseReportParams = {|
  collectionId: number,
|};

export type LoadCollectionAbuseReportAction = {|
  type: typeof LOAD_COLLECTION_ABUSE_REPORT,
  payload: LoadCollectionAbuseReportParams,
|};

export const loadCollectionAbuseReport = ({
  collectionId,
}: LoadCollectionAbuseReportParams): LoadCollectionAbuseReportAction => {
  invariant(collectionId, 'collectionId is required');

  return {
    type: LOAD_COLLECTION_ABUSE_REPORT,
    payload: { collectionId },
  };
};

const updateCollection = (
  collectionAbuseReportsState: CollectionAbuseReportsState,
  collectionId: number,
  report: CollectionAbuseReport,
): CollectionAbuseReportsState => {
  return {
    ...collectionAbuseReportsState,
    byCollectionId: {
      ...collectionAbuseReportsState.byCollectionId,
      [collectionId]: {
        ...collectionAbuseReportsState.byCollectionId[collectionId],
        ...report,
      },
    },
  };
};

export const initialState: CollectionAbuseReportsState = {
  byCollectionId: {},
};

export default function collectionAbuseReportsReducer(
  // eslint-disable-next-line default-param-last
  state: CollectionAbuseReportsState = initialState,
  action:
    | SendCollectionAbuseReportAction
    | LoadCollectionAbuseReportAction
    | AbortCollectionAbuseReportAction,
): CollectionAbuseReportsState {
  switch (action.type) {
    case SEND_COLLECTION_ABUSE_REPORT: {
      const { collectionId } = action.payload;

      return updateCollection(state, collectionId, {
        isSubmitting: true,
        hasSubmitted: false,
      });
    }
    case LOAD_COLLECTION_ABUSE_REPORT: {
      const { collectionId } = action.payload;

      return updateCollection(state, collectionId, {
        isSubmitting: false,
        hasSubmitted: true,
      });
    }
    case ABORT_COLLECTION_ABUSE_REPORT: {
      const { collectionId } = action.payload;

      return updateCollection(state, collectionId, {
        isSubmitting: false,
        hasSubmitted: false,
      });
    }
    default:
      return state;
  }
}
