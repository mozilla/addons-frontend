import userAbuseReportsReducer, {
  SEND_USER_ABUSE_REPORT,
  abortUserAbuseReport,
  hideUserAbuseReportUI,
  initialState,
  loadUserAbuseReport,
  sendUserAbuseReport,
  showUserAbuseReportUI,
} from 'amo/reducers/userAbuseReports';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  createFakeUserAbuseReport,
  createUserAccountResponse,
} from 'tests/unit/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = userAbuseReportsReducer(
        initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    describe('abortUserAbuseReport', () => {
      it('resets the state of this abuse report', () => {
        const user = createUserAccountResponse({ id: 501 });
        let state = userAbuseReportsReducer(
          initialState, showUserAbuseReportUI({ user }));
        state = userAbuseReportsReducer(state, showUserAbuseReportUI({ user }));
        state = userAbuseReportsReducer(state, sendUserAbuseReport({
          errorHandlerId: 'some-error-handler',
          message: 'foo',
          user,
        }));
        state = userAbuseReportsReducer(state, abortUserAbuseReport({ user }));

        expect(state).toMatchObject({
          byUserId: {
            [user.id]: {
              hasSubmitted: false,
              isSubmitting: false,
              uiVisible: false,
            },
          },
        });
      });
    });

    describe('hideUserAbuseReportUI', () => {
      it('sets the uiVisible state to false', () => {
        const user = createUserAccountResponse();
        const state = userAbuseReportsReducer(
          initialState, hideUserAbuseReportUI({ user }));

        expect(state).toMatchObject({
          byUserId: {
            [user.id]: { uiVisible: false },
          },
        });
      });

      it('requires a user param', () => {
        expect(() => {
          hideUserAbuseReportUI();
        }).toThrow('user is required');
      });
    });

    describe('showUserAbuseReportUI', () => {
      it('sets the uiVisible state to true', () => {
        const user = createUserAccountResponse();
        const state = userAbuseReportsReducer(
          initialState, showUserAbuseReportUI({ user }));

        expect(state).toMatchObject({
          byUserId: {
            [user.id]: { uiVisible: true },
          },
        });
      });
    });

    describe('sendUserAbuseReport', () => {
      function defaultParams(params = {}) {
        return {
          errorHandlerId: 'some-error-handler',
          message: 'The add-on is malware',
          user: createUserAccountResponse(),
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
          initialState, loadUserAbuseReport(abuseReport));

        expect(state.byUserId[abuseReport.user.id].message)
          .toEqual('I am Groot!');
      });

      it('requires a defined reporter', () => {
        expect(() => {
          const partialParams = abuseReportResponse();
          delete partialParams.reporter;

          loadUserAbuseReport(partialParams);
        }).toThrow('reporter cannot be undefined');
      });

      it('allows reporter to be `null`', () => {
        expect(() => {
          const paramsWithNull = abuseReportResponse({ reporter: null });

          loadUserAbuseReport(paramsWithNull);
        }).not.toThrow('reporter cannot be undefined');
      });

      it('allows abuse reports for multiple users', () => {
        const { store } = dispatchClientMetadata();

        store.dispatch(loadUserAbuseReport(createFakeUserAbuseReport({
          message: 'This user is mean',
          reporter: null,
          user: createUserAccountResponse({ id: 50 }),
        })));
        store.dispatch(loadUserAbuseReport(createFakeUserAbuseReport({
          message: 'This user is boring',
          reporter: null,
          user: createUserAccountResponse({ id: 51 }),
        })));

        expect(store.getState().userAbuseReports).toMatchObject({
          byUserId: {
            50: { message: 'This user is mean' },
            51: { message: 'This user is boring' },
          },
        });
      });
    });
  });
});
