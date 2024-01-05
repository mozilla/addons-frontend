import userAbuseReportsReducer, {
  SEND_USER_ABUSE_REPORT,
  abortUserAbuseReport,
  initialState,
  loadUserAbuseReport,
  sendUserAbuseReport,
} from 'amo/reducers/userAbuseReports';
import {
  createFakeUserAbuseReport,
  createUserAccountResponse,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = userAbuseReportsReducer(initialState, {
        type: 'UNRELATED_ACTION',
      });
      expect(state).toEqual(initialState);
    });

    describe('abortUserAbuseReport', () => {
      it('resets the state of this abuse report', () => {
        const userId = createUserAccountResponse({ id: 501 }).id;
        let state = userAbuseReportsReducer(
          undefined,
          sendUserAbuseReport({
            errorHandlerId: 'some-error-handler',
            message: 'foo',
            userId,
          }),
        );
        state = userAbuseReportsReducer(
          state,
          abortUserAbuseReport({ userId }),
        );

        expect(state).toMatchObject({
          byUserId: {
            [userId]: {
              hasSubmitted: false,
              isSubmitting: false,
            },
          },
        });
      });
    });

    describe('sendUserAbuseReport', () => {
      function defaultParams(params = {}) {
        return {
          errorHandlerId: 'some-error-handler',
          message: 'The add-on is malware',
          userId: createUserAccountResponse().id,
          auth: true,
          reason: null,
          reporterEmail: null,
          reporterName: null,
          ...params,
        };
      }

      it('dispatches sendUserAbuseReport', () => {
        const params = defaultParams();
        const action = sendUserAbuseReport(params);

        expect(action.type).toEqual(SEND_USER_ABUSE_REPORT);
        expect(action.payload).toEqual(params);
      });
    });

    describe('loadUserAbuseReport', () => {
      function abuseReportResponse(params = {}) {
        return createFakeUserAbuseReport({
          message: 'I am Groot!',
          user: createUserAccountResponse({ id: 12 }),
          ...params,
        });
      }

      it('saves the abuse report response to the reducer', () => {
        const abuseReport = abuseReportResponse();
        const state = userAbuseReportsReducer(
          initialState,
          loadUserAbuseReport({
            message: abuseReport.message,
            reporter: abuseReport.reporter,
            userId: abuseReport.user.id,
          }),
        );

        expect(state.byUserId[abuseReport.user.id].message).toEqual(
          'I am Groot!',
        );
      });

      it('allows abuse reports for multiple users', () => {
        const firstReport = createFakeUserAbuseReport({
          message: 'This user is mean',
          reporter: null,
          user: createUserAccountResponse({ id: 50 }),
        });
        const secondReport = createFakeUserAbuseReport({
          message: 'This user is boring',
          reporter: null,
          user: createUserAccountResponse({ id: 51 }),
        });

        let state = userAbuseReportsReducer(
          initialState,
          loadUserAbuseReport({
            message: firstReport.message,
            reporter: firstReport.reporter,
            userId: firstReport.user.id,
          }),
        );
        state = userAbuseReportsReducer(
          state,
          loadUserAbuseReport({
            message: secondReport.message,
            reporter: secondReport.reporter,
            userId: secondReport.user.id,
          }),
        );

        expect(state).toMatchObject({
          byUserId: {
            [firstReport.user.id]: { message: 'This user is mean' },
            [secondReport.user.id]: { message: 'This user is boring' },
          },
        });
      });
    });
  });
});
