import { getTagResultsPathname } from 'amo/utils/tags';

describe(__filename, () => {
  describe('getTagResultsPathname', () => {
    it('returns the expected pathname', () => {
      const tag = 'some-tag';
      expect(getTagResultsPathname({
        tag,
      })).toEqual(`/tag/${tag}/`);
    });
  });
});