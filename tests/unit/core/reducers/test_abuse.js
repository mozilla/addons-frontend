import abuseReducer, {
  SEND_ADDON_ABUSE_REPORT,
  initialState,
  loadAddonAbuseReport,
  sendAddonAbuseReport,
} from 'core/reducers/abuse';
import { fakeAddon } from 'tests/unit/amo/helpers';
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

    describe('sendAddonAbuseReport', () => {
      it('dispatches a sendAddonAbuseReport', () => {
        const addonSlug = 'slugs-are-gross';
        const errorHandler = createStubErrorHandler('or-are-they');
        const message = 'They really are';

        const action = sendAddonAbuseReport({
          addonSlug,
          errorHandler,
          message,
        });

        expect(action.type).toEqual(SEND_ADDON_ABUSE_REPORT);
        expect(action.payload).toEqual({
          addonSlug,
          errorHandlerId: errorHandler.id,
          message,
        });
      });

      it('requires an addonSlug', () => {
        expect(() => {
          sendAddonAbuseReport({
            errorHandler: createStubErrorHandler('or-are-they'),
            message: 'hello!',
          });
        }).toThrow('addonSlug is required');
      });

      it('requires an errorHandler', () => {
        expect(() => {
          sendAddonAbuseReport({
            addonSlug: 'funk-music',
            message: 'hello!',
          });
        }).toThrow('errorHandler is required');
      });

      it('requires a message', () => {
        expect(() => {
          sendAddonAbuseReport({
            addonSlug: 'i-am-sparticus',
            errorHandler: createStubErrorHandler('or-are-they'),
          });
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
