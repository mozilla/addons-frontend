import {
  ADDON_TYPE_EXTENSION,
  SEARCH_SORT_POPULAR,
  SEARCH_SORT_RECOMMENDED,
} from 'amo/constants';
import { getCategoryResultsQuery } from 'amo/utils/categories';

describe(__filename, () => {
  describe('getCategoryResultsQuery', () => {
    it('returns a query with the expected category, type and sort', () => {
      const addonType = ADDON_TYPE_EXTENSION;
      const slug = 'some-slug';

      const query = getCategoryResultsQuery({ addonType, slug });
      expect(query.category).toEqual(slug);
      expect(query.type).toEqual(addonType);
      expect(query.sort).toEqual(
        `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
      );
    });
  });
});
