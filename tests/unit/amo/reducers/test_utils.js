import {
  selectLocalizedContent,
  makeInternalPromoted,
} from 'amo/reducers/utils';
import { CLIENT_APP_FIREFOX, RECOMMENDED } from 'amo/constants';

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

  describe('makeInternalPromoted', () => {
    it('returns the empty list if promoted is null', () => {
      expect(makeInternalPromoted(null)).toEqual([]);
    });
    it('returns the empty list if promoted is empty', () => {
      expect(makeInternalPromoted([])).toEqual([]);
    });
    it('returns promoted if promoted is a list', () => {
      const promoted = [{ category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] }];
      expect(makeInternalPromoted(promoted)).toEqual(promoted);
    });
    it('returns promoted in a list if promoted is a PromotedType', () => {
      const promoted = { category: RECOMMENDED, apps: [CLIENT_APP_FIREFOX] };
      expect(makeInternalPromoted(promoted)).toEqual([promoted]);
    });
  });
});
