import abuseReducer, {
  SEND_ADDON_ABUSE_REPORT,
  initialState,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import { dispatchClientMetadata, fakeAddon } from 'tests/unit/amo/helpers';
import {
  createFakeAddonAbuseReport,
  createStubErrorHandler,
} from 'tests/unit/helpers';


describe(__filename, () => {
  describe('reducer', () => {
    it('initializes properly', () => {
      const state = abuseReducer(initialState, { type: 'UNRELATED_ACTION' });
      expect(state).toEqual({});
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
        // byAddonSlug: {
          'another-addon': {
            message: 'The add-on is boring',
          },
          'some-addon': {
            message: 'This add-on is malwaré.',
          },
        // },
      });
    });

    it('throws an error if multiple reports are submitted for the same add-on', () => {
      const { store } = dispatchClientMetadata();

      store.dispatch(loadAddonAbuseReport(createFakeAddonAbuseReport({
        addon: { ...fakeAddon, slug: 'some-addon' },
        message: 'This add-on is malwaré.',
        reporter: null,
      })));

      expect(() => {
        store.dispatch(sendAddonAbuseReport({
          addonSlug: 'some-addon',
          errorHandlerId: 'test-abuse',
          message: 'The add-on is boring',
        }));
      }).toThrow('You already reported this add-on');
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
      let addon;
      let message;
      let response;

      beforeEach(() => {
        addon = { ...fakeAddon, slug: 'Ego' };
        message = 'I am Groot!';
        response = createFakeAddonAbuseReport({ addon, message });
      });

      it('saves the abuse report response to the reducer', () => {
        const state = abuseReducer(
          initialState, loadAddonAbuseReport(response));

        expect(state[addon.slug].message).toEqual(message);
      });

      it('requires an addon', () => {
        expect(() => {
          loadAddonAbuseReport({
            message: response.message,
            reporter: response.reporter,
          });
        }).toThrow('addon is required');
      });

      it('requires a message', () => {
        expect(() => {
          loadAddonAbuseReport({
            addon: response.addon,
            reporter: response.reporter,
          });
        }).toThrow('message is required');
      });

      it('requires a defined reporter', () => {
        expect(() => {
          loadAddonAbuseReport({
            addon: response.addon,
            message: response.message,
          });
        }).toThrow('reporter cannot be undefined');
      });

      it('reporter can be `null`', () => {
        expect(() => {
          loadAddonAbuseReport({
            addon: response.addon,
            message: response.message,
            reporter: null,
          });
        }).not.toThrow('reporter cannot be undefined');
      });
    });
  });
});
