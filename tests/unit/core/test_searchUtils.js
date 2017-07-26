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
        page: 4,
        query: 'Cool things',
      });

      expect(queryParams).toEqual({
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
      });
    });
  });

  describe('convertQueryParamsToFilters', () => {
    it('converts query params', () => {
      const filters = convertQueryParamsToFilters({
        page: 4,
        q: 'Cool things',
        type: ADDON_TYPE_THEME,
      });

      expect(filters).toEqual({
        addonType: ADDON_TYPE_THEME,
        page: 4,
        query: 'Cool things',
      });
    });
  });
});
