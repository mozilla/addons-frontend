import { getFeatured, loadFeatured } from 'amo/actions/featured';
import { ADDON_TYPE_EXTENSION, ADDON_TYPE_THEME } from 'core/constants';
import { createStubErrorHandler } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('amo/actions/featured/getFeatured', () => {
    function getActionArgs(args = {}) {
      const errorHandler = createStubErrorHandler();
      return {
        addonType: ADDON_TYPE_EXTENSION,
        errorHandlerId: errorHandler.id,
        ...args,
      };
    }

    it('sets the filters', () => {
      const action = getFeatured(
        getActionArgs({
          errorHandlerId: 'some-id',
          addonType: ADDON_TYPE_THEME,
        }),
      );
      expect(action.payload).toEqual({
        addonType: ADDON_TYPE_THEME,
        errorHandlerId: 'some-id',
      });
    });

    it('throws if no addonType is set', () => {
      const args = getActionArgs();
      delete args.addonType;
      expect(() => getFeatured(args)).toThrowError('addonType must be set');
    });

    it('throws if no errorHandler is set', () => {
      const args = getActionArgs();
      delete args.errorHandlerId;
      expect(() => getFeatured(args)).toThrowError(
        'errorHandlerId must be set',
      );
    });
  });

  describe('amo/actions/featured/loadFeatured', () => {
    const response = {
      entities: sinon.stub(),
      result: sinon.stub(),
    };
    const action = loadFeatured({ addonType: 'theme', ...response });

    it('sets the payload', () => {
      expect(action.payload).toEqual({ addonType: 'theme', ...response });
    });
  });
});
