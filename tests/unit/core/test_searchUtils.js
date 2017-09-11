import { ADDON_TYPE_THEME } from 'core/constants';
import {
  convertFiltersToQueryParams,
  convertQueryParamsToFilters,
} from 'core/searchUtils';


describe(__filename, () => {
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
});
