import {
  ADDON_TYPE_EXTENSION,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
} from 'amo/constants';
import { visibleAddonType } from 'amo/utils';
import {
  getCategoryResultsLinkTo,
  getCategoryResultsPathname,
  getCategoryResultsQuery,
} from 'amo/utils/categories';

describe(__filename, () => {
  describe('getCategoryResultsPathname', () => {
    it('returns the expected pathname', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const slug = 'some-slug';

      expect(getCategoryResultsPathname({ addonType, slug })).toEqual(
        `/${visibleAddonType(addonType)}/category/${slug}/`,
      );
    });
  });

  describe('getCategoryResultsQuery', () => {
    it('returns an object with the expected pathname and query', () => {
      expect(getCategoryResultsQuery()).toEqual({
        sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
      });
    });
  });

  describe('getCategoryResultsLinkTo', () => {
    it('returns an object with the expected pathname and query', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const slug = 'some-slug';

      const { pathname, query } = getCategoryResultsLinkTo({ addonType, slug });
      expect(pathname).toEqual(
        `/${visibleAddonType(addonType)}/category/${slug}/`,
      );
      expect(query.sort).toEqual(
        `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
      );
    });
  });
});
