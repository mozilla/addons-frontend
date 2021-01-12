import { selectLocalizedContent } from 'amo/reducers/utils';

describe(__filename, () => {
  describe('selectLocalizedContent', () => {
    it('returns null if field is falsey', () => {
      expect(selectLocalizedContent(null, 'en-US')).toEqual(null);
    });

    it('returns a translation if found', () => {
      const expected = 'expected string';
      const unexpected = 'unexpected string';
      const lang = 'en-US';

      expect(
        selectLocalizedContent({ [lang]: expected, fr: unexpected }, lang),
      ).toEqual(expected);
    });

    it('returns a translation from the default lang if not found', () => {
      const expected = 'expected string';
      const defaultLang = 'en-US';
      const requestedLang = 'fr';

      expect(
        selectLocalizedContent(
          {
            [defaultLang]: expected,
            fr: null,
            _default: defaultLang,
          },
          requestedLang,
        ),
      ).toEqual(expected);
    });
  });
});
