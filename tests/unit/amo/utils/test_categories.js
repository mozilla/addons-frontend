import { ADDON_TYPE_EXTENSION } from 'amo/constants';
import { visibleAddonType } from 'amo/utils';
import { getCategoryResultsPathname } from 'amo/utils/categories';

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
});
