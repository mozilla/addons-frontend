import { getLanding, loadLanding } from 'amo/actions/landing';
import { ADDON_TYPE_THEME } from 'core/constants';

describe(__filename, () => {
  describe('LANDING_GET', () => {
    const getActionParams = () => ({
      addonType: ADDON_TYPE_THEME,
      errorHandlerId: 'some-error-handler',
    });
    const action = getLanding(getActionParams());

    it('sets the type', () => {
      expect(action.type).toEqual('LANDING_GET');
    });

    it('sets the filters', () => {
      expect(action.payload).toEqual({
        addonType: ADDON_TYPE_THEME,
        category: null,
        errorHandlerId: 'some-error-handler',
      });
    });

    it('throws if no addonType is set', () => {
      const params = getActionParams();
      delete params.addonType;
      expect(() => getLanding(params)).toThrowError('addonType must be set');
    });

    it('throws if no errorHandlerId is set', () => {
      const params = getActionParams();
      delete params.errorHandlerId;
      expect(() => getLanding(params)).toThrowError(
        'errorHandlerId must be set',
      );
    });

    it('optionally takes a category', () => {
      const actionWithCategorySet = getLanding({
        ...getActionParams(),
        category: 'some-category',
      });

      expect(actionWithCategorySet.payload).toEqual({
        addonType: ADDON_TYPE_THEME,
        category: 'some-category',
        errorHandlerId: 'some-error-handler',
      });
    });
  });

  describe('LANDING_LOADED', () => {
    function defaultParams() {
      return {
        addonType: ADDON_TYPE_THEME,
        featured: { count: 0, results: [] },
        highlyRated: { count: 0, results: [] },
        trending: { count: 0, results: [] },
      };
    }

    it('sets the type', () => {
      expect(loadLanding(defaultParams()).type).toEqual('LANDING_LOADED');
    });

    it('sets the payload', () => {
      const action = loadLanding(defaultParams());
      const expectedPayload = defaultParams();
      expect(action.payload).toEqual(expectedPayload);
    });

    it('throws an error if addonType is empty', () => {
      const params = defaultParams();
      delete params.addonType;
      expect(() => loadLanding(params)).toThrow(
        /addonType parameter cannot be empty/,
      );
    });

    it('throws an error if featured is empty', () => {
      const params = defaultParams();
      delete params.featured;
      expect(() => loadLanding(params)).toThrow(
        /featured parameter cannot be empty/,
      );
    });

    it('throws an error if highlyRated is empty', () => {
      const params = defaultParams();
      delete params.highlyRated;
      expect(() => loadLanding(params)).toThrow(
        /highlyRated parameter cannot be empty/,
      );
    });

    it('throws an error if trending is empty', () => {
      const params = defaultParams();
      delete params.trending;
      expect(() => loadLanding(params)).toThrow(
        /trending parameter cannot be empty/,
      );
    });
  });
});
