import { oneLine } from 'common-tags';

import {
  ADDON_TYPE_EXTENSION,
  ADDON_TYPE_THEME,
  CLIENT_APP_ANDROID,
  CLIENT_APP_FIREFOX,
} from 'core/constants';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  convertOSToFilterValue,
  fixFiltersForAndroidThemes,
} from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import {
  getFakeConfig,
  userAgents,
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
        addonType: ADDON_TYPE_THEME,
        compatibleWithVersion: '57.0',
        page: 4,
        query: 'Cool things',
        author: 'johndoe',
        tag: 'firefox57',
      });

      expect(queryParams).toEqual({
        appversion: '57.0',
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
        author: 'johndoe',
        tag: 'firefox57',
      });
    });
  });

  describe('convertQueryParamsToFilters', () => {
    it('converts query params', () => {
      const filters = convertQueryParamsToFilters({
        appversion: '57.0',
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
        tag: 'firefox57',
      });

      expect(filters).toEqual({
        addonType: ADDON_TYPE_THEME,
        compatibleWithVersion: '57.0',
        page: 4,
        query: 'Cool things',
        tag: 'firefox57',
      });
    });
  });

  describe('convertOSToFilterValue', () => {
    function getOSNameFromUserAgent(userAgent) {
      const { store } = dispatchClientMetadata({ userAgent });
      return store.getState().api.userAgentInfo.os.name;
    }

    it('converts Windows to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[1]);
      const osFilterValue = convertOSToFilterValue(osName);

      expect(osFilterValue).toEqual('windows');
    });

    it('converts Mac to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[2]);
      const osFilterValue = convertOSToFilterValue(osName);

      expect(osFilterValue).toEqual('mac');
    });

    it('converts Linux to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[0]);
      const osFilterValue = convertOSToFilterValue(osName);

      expect(osFilterValue).toEqual('linux');
    });

    it('converts Android to undefined (we use clientApp for Android)', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefoxAndroid[0]);
      const osFilterValue = convertOSToFilterValue(osName);

      expect(osFilterValue).toEqual(undefined);
    });

    it('converts an unexpected value to undefined', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefoxOS[0]);
      const osFilterValue = convertOSToFilterValue(osName);

      expect(osFilterValue).toEqual(undefined);
    });
  });

  describe('fixFiltersForAndroidThemes', () => {
    it('changes clientApp filter to `firefox` for Android themes', () => {
      const filters = {
        addonType: ADDON_TYPE_THEME,
        clientApp: CLIENT_APP_ANDROID,
      };

      const newFilters = fixFiltersForAndroidThemes({ filters });
      expect(newFilters).toEqual({
        ...filters,
        clientApp: CLIENT_APP_FIREFOX,
      });
    });

    it('does not change clientApp filter for Android extensions', () => {
      const filters = {
        addonType: ADDON_TYPE_EXTENSION,
        clientApp: CLIENT_APP_ANDROID,
      };

      const newFilters = fixFiltersForAndroidThemes({ filters });
      expect(newFilters).toEqual(filters);
    });

    it('does not change filters unless clientApp is `android`', () => {
      const filters = {
        addonType: ADDON_TYPE_THEME,
        clientApp: 'some-bogus-client',
      };

      const newFilters = fixFiltersForAndroidThemes({ filters });
      expect(newFilters).toEqual(filters);
    });

    it('sets clientApp to api.clientApp when clientApp is not a filter', () => {
      const { state } = dispatchClientMetadata({
        clientApp: CLIENT_APP_FIREFOX,
      });

      const filters = {
        addonType: ADDON_TYPE_THEME,
      };

      const newFilters = fixFiltersForAndroidThemes({
        api: state.api,
        filters,
      });
      expect(newFilters).toEqual({
        ...filters,
        clientApp: CLIENT_APP_FIREFOX,
      });
    });

    it('does not modify the other filters', () => {
      const filters = {
        addonType: ADDON_TYPE_THEME,
        category: 'some-category',
        clientApp: CLIENT_APP_FIREFOX,
        page: 123,
      };

      const newFilters = fixFiltersForAndroidThemes({ filters });
      expect(newFilters).toEqual(filters);
    });
  });
});
