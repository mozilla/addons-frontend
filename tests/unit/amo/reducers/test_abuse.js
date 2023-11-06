import abuseReducer, {
  SEND_ADDON_ABUSE_REPORT,
  finishAddonAbuseReportViaFirefox,
  hideAddonAbuseReportUI,
  initiateAddonAbuseReportViaFirefox,
  initialState,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
} from 'amo/reducers/abuse';
import {
  dispatchClientMetadata,
  createFakeAddonAbuseReport,
  fakeAddon,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = abuseReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('allows abuse reports for multiple add-ons', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(
        loadAddonAbuseReport(
          createFakeAddonAbuseReport({
            addon: { ...fakeAddon, slug: 'some-addon', guid: 'some@guid' },
            message: 'This add-on is malwaré.',
            reporter: null,
          }),
        ),
      );
      store.dispatch(
        loadAddonAbuseReport(
          createFakeAddonAbuseReport({
            addon: {
              ...fakeAddon,
              slug: 'another-addon',
              guid: 'another@guid',
            },
            message: 'The add-on is boring',
            reporter: null,
          }),
        ),
      );

      expect(store.getState().abuse).toMatchObject({
        bySlug: {
          'another-addon': {
            message: 'The add-on is boring',
          },
          'some-addon': {
            message: 'This add-on is malwaré.',
          },
        },
      });
    });

    describe('hideAddonAbuseReportUI', () => {
      it('sets the uiVisible state to false', () => {
        const state = abuseReducer(
          initialState,
          hideAddonAbuseReportUI({ addon: fakeAddon }),
        );

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { uiVisible: false },
          },
          loading: false,
        });
      });
    });

    describe('showAddonAbuseReportUI', () => {
      it('sets the uiVisible state to true', () => {
        const state = abuseReducer(
          initialState,
          showAddonAbuseReportUI({ addon: fakeAddon }),
        );

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { uiVisible: true },
          },
          loading: false,
        });
      });
    });

    describe('sendAddonAbuseReport', () => {
      let defaultParams;

      beforeEach(() => {
        defaultParams = {
          addonId: 'some-addon',
          errorHandlerId: 'some-error-handler',
          message: 'The add-on is malware',
          reason: 'malware',
          reporterName: 'Foxy',
          reporterEmail: 'made_up@email',
          location: 'both',
          addonVersion: '1.2.3',
        };
      });

      it('dispatches a sendAddonAbuseReport', () => {
        const action = sendAddonAbuseReport(defaultParams);

        expect(action.type).toEqual(SEND_ADDON_ABUSE_REPORT);
        expect(action.payload).toEqual(defaultParams);
      });

      it('requires an addonId', () => {
        expect(() => {
          const partialParams = { ...defaultParams };
          delete partialParams.addonId;

          sendAddonAbuseReport(partialParams);
        }).toThrow('addonId is required');
      });

      it('requires an errorHandlerId', () => {
        expect(() => {
          const partialParams = { ...defaultParams };
          delete partialParams.errorHandlerId;

          sendAddonAbuseReport(partialParams);
        }).toThrow('errorHandlerId is required');
      });

      it('requires a message', () => {
        expect(() => {
          const partialParams = { ...defaultParams };
          delete partialParams.message;

          sendAddonAbuseReport(partialParams);
        }).toThrow('message is required');
      });
    });

    describe('loadAddonAbuseReport', () => {
      let response;

      beforeEach(() => {
        response = createFakeAddonAbuseReport({
          addon: { ...fakeAddon, slug: 'Ego' },
          message: 'I am Groot!',
        });
      });

      it('saves the abuse report response to the reducer', () => {
        const state = abuseReducer(
          initialState,
          loadAddonAbuseReport(response),
        );

        expect(state.bySlug.Ego.message).toEqual('I am Groot!');
      });

      it('requires a defined reporter', () => {
        expect(() => {
          const partialParams = { ...response };
          delete partialParams.reporter;

          loadAddonAbuseReport(partialParams);
        }).toThrow('reporter must be defined');
      });

      it('reporter can be `null`', () => {
        expect(() => {
          const paramsWithNull = { ...response, reporter: null };

          loadAddonAbuseReport(paramsWithNull);
        }).not.toThrow();
      });
    });
  });

  describe('initiateAddonAbuseReportViaFirefox', () => {
    it('does not set the loading state to true', () => {
      // See https://github.com/mozilla/addons-frontend/issues/9086.
      const state = abuseReducer(
        initialState,
        initiateAddonAbuseReportViaFirefox({ addon: fakeAddon }),
      );

      expect(state).toEqual(initialState);
    });
  });

  describe('finishAddonAbuseReportViaFirefox', () => {
    it('sets the loading state to false', () => {
      // Set loading to true by initiating the abuse report via Firefox.
      let state = abuseReducer(
        initialState,
        initiateAddonAbuseReportViaFirefox({ addon: fakeAddon }),
      );

      state = abuseReducer(state, finishAddonAbuseReportViaFirefox());

      expect(state).toEqual({
        ...initialState,
        loading: false,
      });
    });
  });
});
