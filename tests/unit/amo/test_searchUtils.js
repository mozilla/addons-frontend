import { oneLine } from 'common-tags';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_STATIC_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
  RECOMMENDED,
} from 'amo/constants';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  fixFiltersForClientApp,
  fixFiltersFromLocation,
} from 'amo/searchUtils';
import {
  dispatchClientMetadata,
  getFakeConfig,
  userAgentsByPlatform,
} from 'tests/unit/helpers';

describe(__filename, () => {
  const fakeConfig = getFakeConfig({
    restrictSearchResultsToAppVersion: true,
  });

  describe('addVersionCompatibilityToFilters', () => {
    it('returns unmodified filters if not Firefox', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.chrome41,
      });

      const newFilters = addVersionCompatibilityToFilters({
        config: fakeConfig,
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
        userAgent: userAgentsByPlatform.linux.firefox10,
      });

      const newFilters = addVersionCompatibilityToFilters({
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({ query: 'foo' });
    });

    it('adds compatibleWithVersion if Firefox 57+', () => {
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.firefox57,
      });

      const newFilters = addVersionCompatibilityToFilters({
        config: fakeConfig,
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({
        compatibleWithVersion: '57.1',
        query: 'foo',
      });
    });

    it('does not add compatibleWithVersion when config is disabled', () => {
      const fakeConfigWithVersionFalse = getFakeConfig({
        restrictSearchResultsToAppVersion: false,
      });
      const { state } = dispatchClientMetadata({
        userAgent: userAgentsByPlatform.mac.firefox57,
      });

      const newFilters = addVersionCompatibilityToFilters({
        config: fakeConfigWithVersionFalse,
        filters: { query: 'foo' },
        userAgentInfo: state.api.userAgentInfo,
      });

      expect(newFilters).toEqual({ query: 'foo' });
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

    it('adds a promoted=recommended filter on Android', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const { state } = dispatchClientMetadata({ clientApp });

      const filters = {};

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.clientApp).toEqual(clientApp);
      expect(newFilters.promoted).toEqual(RECOMMENDED);
    });

    it('does not add a promoted=recommended filter on Desktop', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({ clientApp });

      const filters = {};

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.promoted).toEqual(undefined);
    });

    it('adds a addonType=extension filter on Android', () => {
      const clientApp = CLIENT_APP_ANDROID;
      const { state } = dispatchClientMetadata({ clientApp });

      const filters = {};

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.clientApp).toEqual(clientApp);
      expect(newFilters.addonType).toEqual(ADDON_TYPE_EXTENSION);
    });

    it('does not add a addonType=extension filter on Desktop', () => {
      const clientApp = CLIENT_APP_FIREFOX;
      const { state } = dispatchClientMetadata({ clientApp });

      const filters = {};

      const newFilters = fixFiltersForClientApp({ api: state.api, filters });
      expect(newFilters.addonType).toEqual(undefined);
    });
  });

  describe('fixFiltersFromLocation', () => {
    it('removes clientApp and lang from filters', () => {
      const page = '123';
      const filters = { clientApp: CLIENT_APP_ANDROID, lang: 'fr', page };

      expect(fixFiltersFromLocation(filters)).toEqual({ page });
    });
  });
});
