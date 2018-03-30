import abuseReducer, {
  SEND_ADDON_ABUSE_REPORT,
  disableAbuseButtonUI,
  enableAbuseButtonUI,
  hideAddonAbuseReportUI,
  initialState,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
  showAddonAbuseReportUI,
} from 'core/reducers/abuse';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import { createFakeAddonAbuseReport } from 'tests/unit/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = abuseReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual(initialState);
    });

    it('allows abuse reports for multiple add-ons', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(loadAddonAbuseReport(createFakeAddonAbuseReport({
        addon: { ...fakeAddon, slug: 'some-addon' },
        message: 'This add-on is malwaré.',
        reporter: null,
      })));
      store.dispatch(loadAddonAbuseReport(createFakeAddonAbuseReport({
        addon: { ...fakeAddon, slug: 'another-addon' },
        message: 'The add-on is boring',
        reporter: null,
      })));

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

    describe('disableAbuseButtonUI', () => {
      it('sets the buttonEnabled state to false', () => {
        const state = abuseReducer(
          initialState, disableAbuseButtonUI({ addon: fakeAddon }));

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { buttonEnabled: false },
          },
          loading: false,
        });
      });

      it('requires an addon param', () => {
        expect(() => {
          disableAbuseButtonUI();
        }).toThrow('addon is required');
      });
    });

    describe('enableAbuseButtonUI', () => {
      it('sets the buttonEnabled state to true', () => {
        const state = abuseReducer(
          initialState, enableAbuseButtonUI({ addon: fakeAddon }));

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { buttonEnabled: true },
          },
          loading: false,
        });
      });

      it('requires an addon param', () => {
        expect(() => {
          enableAbuseButtonUI();
        }).toThrow('addon is required');
      });
    });

    describe('hideAddonAbuseReportUI', () => {
      it('sets the uiVisible state to false', () => {
        const state = abuseReducer(
          initialState, hideAddonAbuseReportUI({ addon: fakeAddon }));

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { uiVisible: false },
          },
          loading: false,
        });
      });

      it('requires an addon param', () => {
        expect(() => {
          hideAddonAbuseReportUI();
        }).toThrow('addon is required');
      });
    });

    describe('showAddonAbuseReportUI', () => {
      it('sets the uiVisible state to true', () => {
        const state = abuseReducer(
          initialState, showAddonAbuseReportUI({ addon: fakeAddon }));

        expect(state).toEqual({
          bySlug: {
            [fakeAddon.slug]: { uiVisible: true },
          },
          loading: false,
        });
      });

      it('requires an addon param', () => {
        expect(() => {
          showAddonAbuseReportUI();
        }).toThrow('addon is required');
      });
    });

    describe('sendAddonAbuseReport', () => {
      let defaultParams;

      beforeEach(() => {
        defaultParams = {
          addonSlug: 'some-addon',
          errorHandlerId: 'some-error-handler',
          message: 'The add-on is malware',
        };
      });

      it('dispatches a sendAddonAbuseReport', () => {
        const action = sendAddonAbuseReport(defaultParams);

        expect(action.type).toEqual(SEND_ADDON_ABUSE_REPORT);
        expect(action.payload).toEqual(defaultParams);
      });

      it('requires an addonSlug', () => {
        expect(() => {
          const partialParams = { ...defaultParams };
          delete partialParams.addonSlug;

          sendAddonAbuseReport(partialParams);
        }).toThrow('addonSlug is required');
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
          initialState, loadAddonAbuseReport(response));

        expect(state.bySlug.Ego.message).toEqual('I am Groot!');
      });

      it('requires an addon', () => {
        expect(() => {
          const partialParams = { ...response };
          delete partialParams.addon;

          loadAddonAbuseReport(partialParams);
        }).toThrow('addon is required');
      });

      it('requires a message', () => {
        expect(() => {
          const partialParams = { ...response };
          delete partialParams.message;

          loadAddonAbuseReport(partialParams);
        }).toThrow('message is required');
      });

      it('requires a defined reporter', () => {
        expect(() => {
          const partialParams = { ...response };
          delete partialParams.reporter;

          loadAddonAbuseReport(partialParams);
        }).toThrow('reporter cannot be undefined');
      });

      it('reporter can be `null`', () => {
        expect(() => {
          const paramsWithNull = { ...response, reporter: null };

          loadAddonAbuseReport(paramsWithNull);
        }).not.toThrow('reporter cannot be undefined');
      });
    });
  });
});
