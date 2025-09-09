import { oneLine } from 'common-tags';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  APPVERSION_FOR_ANDROID,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'amo/constants';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersForClientApp,
  fixFiltersFromLocation,
  generateThresholdParams,
  paramsToFilter,
} from 'amo/searchUtils';
import {
  dispatchClientMetadata,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  describe('addVersionCompatibilityToFilters', () => {
    it('returns unmodified filters if not Firefox', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.chrome41,
      });

      const newFilters = addVersionCompatibilityToFilters({
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({ query: 'foo' });
    });

    it('returns unmodified filters if Firefox for iOS (even if 57+)', () => {
      // HACK: This is not a real UA string; this version doesn't exist (yet).
      // But it's useful to test theoretical future versions.
      const fakeFirefoxForIOSUserAgent = oneLine`Mozilla/5.0 (iPad; CPU
        iPhone OS 20_1 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko)
        FxiOS/60.0 Mobile/12F69 Safari/600.1.4`;
      const { state } = dispatchClientMetadata({
        userAgent: fakeFirefoxForIOSUserAgent,
      });

      const newFilters = addVersionCompatibilityToFilters({
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({ query: 'foo' });
    });

    it('returns unmodified filters if Firefox for iOS', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.ios.firefox1iPad,
      });

      const newFilters = addVersionCompatibilityToFilters({
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({ query: 'foo' });
    });

    it('adds compatibleWithVersion if Firefox', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.firefox57,
      });

      const newFilters = addVersionCompatibilityToFilters({
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({
        compatibleWithVersion: '57.1',
        query: 'foo',
      });
    });

    it('requires filters', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.firefox57,
      });

      expect(() => {
        addVersionCompatibilityToFilters({
          userAgentInfo: state.api.userAgentInfo,
        });
      }).toThrow('filters are required');
    });

    it('requires userAgentInfo', () => {
      expect(() => {
        addVersionCompatibilityToFilters({ filters: {} });
      }).toThrow('userAgentInfo is required');
    });

    describe('when clientApp is CLIENT_APP_ANDROID', () => {
      it('does not set promoted and does not override compatibleWithVersion when browser is Firefox for Android', () => {
        const { state } = dispatchClientMetadata({
          userAgent: userAgentsByPlatform.android.firefox136,
        });

        const newFilters = addVersionCompatibilityToFilters({
          filters: { clientApp: CLIENT_APP_ANDROID, query: 'foo' },
          userAgentInfo: state.api.userAgentInfo,
        });

        expect(newFilters).toEqual({
          addonType: ADDON_TYPE_EXTENSION,
          clientApp: CLIENT_APP_ANDROID,
          compatibleWithVersion: '136.0',
          query: 'foo',
        });
      });

      it.each([
        // This works because it is Firefox Desktop.
        userAgentsByPlatform.windows.firefox115,
        userAgentsByPlatform.mac.chrome41,
      ])(
        'does not set promoted but overrides compatibleWithVersion when browser is not Firefox for Android - userAgent: %s',
        (userAgent) => {
          const { state } = dispatchClientMetadata({ userAgent });

          const newFilters = addVersionCompatibilityToFilters({
            filters: { clientApp: CLIENT_APP_ANDROID, query: 'foo' },
            userAgentInfo: state.api.userAgentInfo,
          });

          expect(newFilters).toEqual({
            addonType: ADDON_TYPE_EXTENSION,
            clientApp: CLIENT_APP_ANDROID,
            compatibleWithVersion: APPVERSION_FOR_ANDROID,
            query: 'foo',
          });
        },
      );
    });
  });

  describe('convertFiltersToQueryParams', () => {
    it('converts filters', () => {
      const queryParams = convertFiltersToQueryParams({
        addonType: ADDON_TYPE_STATIC_THEME,
        compatibleWithVersion: '57.0',
        page: '4',
        query: 'Cool things',
        author: 'johndoe',
        tag: 'firefox57',
      });

      expect(queryParams).toEqual({
        appversion: '57.0',
        page: '4',
        q: 'Cool things',
        type: ADDON_TYPE_STATIC_THEME,
        author: 'johndoe',
        tag: 'firefox57',
      });
    });
  });

  describe('convertQueryParamsToFilters', () => {
    it('converts query params', () => {
      const filters = convertQueryParamsToFilters({
        appversion: '57.0',
        page: '4',
        q: 'Cool things',
        type: ADDON_TYPE_STATIC_THEME,
        tag: 'firefox57',
      });

      expect(filters).toEqual({
        addonType: ADDON_TYPE_STATIC_THEME,
        compatibleWithVersion: '57.0',
        page: '4',
        query: 'Cool things',
        tag: 'firefox57',
      });
    });

    it('uses the first instance of multiple query params', () => {
      const filters = convertQueryParamsToFilters({
        appversion: ['57.0', '58.0'],
        page: ['4', '5', '6'],
      });

      expect(filters).toEqual({
        compatibleWithVersion: '57.0',
        page: '4',
      });
    });
  });

  describe('fixFiltersForClientApp', () => {
    it('adds a clientApp filter if one does not exist', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({ clientApp });
      const filters = {};

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.clientApp).toEqual(clientApp);
    });

    it('does not modify the other filters', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const category = 'some-category';
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({ clientApp });

      const filters = { addonType, category };

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.addonType).toEqual(addonType);
      expect(newFilters.category).toEqual(category);
      expect(newFilters.clientApp).toEqual(clientApp);
    });

    it('does not override a clientApp filter', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({
        clientApp: CLIENT_APP_ANDROID,
      });

      const filters = { clientApp };

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.clientApp).toEqual(clientApp);
    });
  });

  describe('fixFiltersFromLocation', () => {
    it('removes clientApp and lang from filters', () => {
      const page = '123';
      const filters = { clientApp: CLIENT_APP_ANDROID, lang: 'fr', page };

      expect(fixFiltersFromLocation(filters)).toEqual({ page });
    });
  });

  describe('generateThresholdParams', () => {
    it('generates all the required threshold parameters for a given param', () => {
      const generated = generateThresholdParams('foo');

      expect(generated).toEqual({
        foo__gt: 'foo__gt',
        foo__lt: 'foo__lt',
        foo__gte: 'foo__gte',
        foo__lte: 'foo__lte',
        foo: 'foo',
      });
    });
  });

  describe('paramsToFilter', () => {
    it('generates all the required threshold parameters for ratings and users', () => {
      expect(paramsToFilter).toMatchObject({ created__gte: 'created__gte' });
      expect(paramsToFilter).toMatchObject({ ratings__gt: 'ratings__gt' });
      expect(paramsToFilter).toMatchObject({ updated__lt: 'updated__lt' });
      expect(paramsToFilter).toMatchObject({ users__lte: 'users__lte' });
      expect(paramsToFilter).toMatchObject({ users: 'users' });
    });
  });
});
