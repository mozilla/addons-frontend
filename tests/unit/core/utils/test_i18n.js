import { getLocalizedTextWithLinkParts } from 'core/utils/i18n';
import { fakeI18n } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLocalizedTextWithLinkParts', () => {
    const _getLocalizedTextWithLinkParts = ({
      i18n = fakeI18n(),
      text = 'Explore more %(linkStart)s stuff %(linkEnd)s here.',
      linkStart = 'linkStart',
      linkEnd = 'linkEnd',
      otherVars,
    } = {}) => {
      return getLocalizedTextWithLinkParts({
        i18n,
        text: fakeI18n().gettext(text),
        linkStart,
        linkEnd,
        otherVars,
      });
    };

    it('returns a descriptive object', () => {
      const parts = _getLocalizedTextWithLinkParts();

      expect(parts).toHaveProperty('beforeLinkText');
      expect(parts.beforeLinkText).toEqual('Explore more ');

      expect(parts).toHaveProperty('innerLinkText');
      expect(parts.innerLinkText).toEqual(' stuff ');

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(' here.');
    });

    it('lets you pass in different linkStart and linkEnd values', () => {
      const parts = _getLocalizedTextWithLinkParts({
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

    it('lets you pass in additional variables', () => {
      const anotherVar = 'another value';
      const parts = _getLocalizedTextWithLinkParts({
        text: 'Explore more %(linkStart)s stuff %(linkEnd)s %(anotherVar)s.',
        otherVars: {
          anotherVar,
        },
      });

      expect(parts).toHaveProperty('afterLinkText');
      expect(parts.afterLinkText).toEqual(` ${anotherVar}.`);
    });

    it('throws an error if linkStart and/or linkEnd values are missing from text', () => {
      expect(() => {
        _getLocalizedTextWithLinkParts({
          text: 'Just some text.',
        });
      }).toThrow(/linkStart and linkEnd values cannot be missing from text/);
    });
  });
});
