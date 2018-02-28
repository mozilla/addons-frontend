import userAbuseReportsReducer, {
  SEND_USER_ABUSE_REPORT,
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

      it('requires a user param', () => {
        expect(() => {
          showUserAbuseReportUI();
        }).toThrow('user is required');
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

      it('requires an errorHandlerId', () => {
        expect(() => {
          const partialParams = defaultParams();
          delete partialParams.errorHandlerId;

          sendUserAbuseReport(partialParams);
        }).toThrow('errorHandlerId is required');
      });

      it('requires a message', () => {
        expect(() => {
          const partialParams = defaultParams();
          delete partialParams.message;

          sendUserAbuseReport(partialParams);
        }).toThrow('message is required');
      });

      it('requires a user', () => {
        expect(() => {
          const partialParams = defaultParams();
          delete partialParams.user;

          sendUserAbuseReport(partialParams);
        }).toThrow('user is required');
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
        const state = userAbuseReportsReducer(
          initialState, loadUserAbuseReport(abuseReportResponse()));

        expect(state.byUserId[12].message).toEqual('I am Groot!');
      });

      it('requires a message', () => {
        expect(() => {
          const partialParams = abuseReportResponse();
          delete partialParams.message;

          loadUserAbuseReport(partialParams);
        }).toThrow('message is required');
      });

      it('requires a defined reporter', () => {
        expect(() => {
          const partialParams = abuseReportResponse();
          delete partialParams.reporter;

          loadUserAbuseReport(partialParams);
        }).toThrow('reporter cannot be undefined');
      });

      it('reporter can be `null`', () => {
        expect(() => {
          const paramsWithNull = abuseReportResponse({ reporter: null });

          loadUserAbuseReport(paramsWithNull);
        }).not.toThrow('reporter cannot be undefined');
      });

      it('requires a user', () => {
        expect(() => {
          const partialParams = abuseReportResponse();
          delete partialParams.user;

          loadUserAbuseReport(partialParams);
        }).toThrow('user is required');
      });
    });
  });
});
