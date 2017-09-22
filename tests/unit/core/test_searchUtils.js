import { oneLine } from 'common-tags';

import { ADDON_TYPE_THEME } from 'core/constants';
import {
  addVersionCompatibilityToFilters,
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  convertOSToFilterValue,
} from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { userAgents, userAgentsByPlatform } from 'tests/unit/helpers';


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
  });

  describe('convertFiltersToQueryParams', () => {
    it('converts filters', () => {
      const queryParams = convertFiltersToQueryParams({
        addonType: ADDON_TYPE_THEME,
        compatibleWithVersion: '57.0',
        page: 4,
        query: 'Cool things',
        author: 'johndoe',
      });

      expect(queryParams).toEqual({
        appversion: '57.0',
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
        author: 'johndoe',
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
      });

      expect(filters).toEqual({
        addonType: ADDON_TYPE_THEME,
        compatibleWithVersion: '57.0',
        page: 4,
        query: 'Cool things',
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
});
