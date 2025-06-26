import { getPromotedBadgesLinkUrl, getPromotedProps } from 'amo/utils/promoted';
import { RECOMMENDED, LINE } from 'amo/constants';

describe(__filename, () => {
  describe('getPromotedBadgesLinkUrl', () => {
    it('returns the correct url', () => {
      const url = getPromotedBadgesLinkUrl({
        utm_content: 'test-content',
      });
      expect(url).toBe(
        'https://support.mozilla.org/kb/add-on-badges?utm_content=test-content&utm_medium=referral&utm_source=addons.mozilla.org',
      );
    });
  });

  describe('getPromotedProps', () => {
    const i18n = {
      gettext: (text) => text,
    };

    it('returns props for RECOMMENDED', () => {
      const props = getPromotedProps(i18n, RECOMMENDED);
      expect(props).toEqual({
        category: RECOMMENDED,
        linkUrl: expect.stringContaining('promoted-addon-badge'),
        label: 'Recommended',
        linkTitle:
          'Firefox only recommends add-ons that meet our standards for security and performance.',
        alt: 'Recommended',
      });
    });

    it('returns props for LINE', () => {
      const props = getPromotedProps(i18n, LINE);
      expect(props).toEqual({
        category: LINE,
        linkUrl: expect.stringContaining('promoted-addon-badge'),
        label: 'By Firefox',
        linkTitle:
          'Official add-on built by Mozilla Firefox. Meets security and performance standards.',
        alt: 'By Firefox',
      });
    });

    it('throws an error for an invalid category', () => {
      expect(() => getPromotedProps(i18n, 'invalid')).toThrow(
        'Invalid promoted badge category: invalid',
      );
    });
  });
});
