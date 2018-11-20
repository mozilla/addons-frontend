import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLocalizedTextWithLinkParts', () => {
    it('returns a descriptive object', () => {
      const parts = getLocalizedTextWithLinkParts({
        i18n: fakeI18n(),
        text: 'Explore more %(linkStart)s stuff %(linkEnd)s here.',
      });

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });

    it('lets you pass in different linkStart and linkEnd values', () => {
      const parts = getLocalizedTextWithLinkParts({
        i18n: fakeI18n(),
        text: 'Explore more %(wrapperStart)s cool stuff %(wrapperEnd)s here.',
        linkStart: 'wrapperStart',
        linkEnd: 'wrapperEnd',
      });

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' cool stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });
  });
});
