import { ADDON_TYPE_THEME } from 'core/constants';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
  convertOperatingSystemToFilterName,
} from 'core/searchUtils';
import { dispatchClientMetadata } from 'tests/unit/amo/helpers';
import { userAgents } from 'tests/unit/helpers';


describe(__filename, () => {
  describe('convertFiltersToQueryParams', () => {
    it('converts filters', () => {
      const queryParams = convertFiltersToQueryParams({
        addonType: ADDON_TYPE_THEME,
        compatibleWithVersion: '57.0',
        page: 4,
        query: 'Cool things',
      });

      expect(queryParams).toEqual({
        appversion: '57.0',
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
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

  describe('convertOperatingSystemToFilterName', () => {
    function getOSNameFromUserAgent(userAgent) {
      const { store } = dispatchClientMetadata({ userAgent });
      return store.getState().api.userAgentInfo.os.name;
    }

    it('converts Windows to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[1]);
      const filterName = convertOperatingSystemToFilterName(osName);

      expect(filterName).toEqual('windows');
    });

    it('converts Mac to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[2]);
      const filterName = convertOperatingSystemToFilterName(osName);

      expect(filterName).toEqual('mac');
    });

    it('converts Linux to filter', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefox[0]);
      const filterName = convertOperatingSystemToFilterName(osName);

      expect(filterName).toEqual('linux');
    });

    it('converts Android to nothing (we use clientApp for Android)', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefoxAndroid[0]);
      const filterName = convertOperatingSystemToFilterName(osName);

      expect(filterName).toEqual('');
    });

    it('converts an unexpected value to nothing', () => {
      const osName = getOSNameFromUserAgent(userAgents.firefoxOS[0]);
      const filterName = convertOperatingSystemToFilterName(osName);

      expect(filterName).toEqual('');
    });
  });
});
