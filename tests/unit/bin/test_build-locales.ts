import { getLocaleModulePath } from 'bin/build-locales';
import { getFakeConfig } from 'tests/unit/helpers';

describe(__filename, () => {
  describe('getLocaleModulePath', () => {
    it('returns the locale module path of a supported locale', () => {
      expect(getLocaleModulePath('fr')).toEqual('moment/locale/fr');
    });
    it('returns the locale module path of a mapped locale when locale is not supported by moment', () => {
      const locale = 'fr-fr';

      const _config = getFakeConfig({
        momentLangMap: {
          [locale]: 'fr',
        },
      });

      expect(getLocaleModulePath(locale, {
        _config,
      })).toEqual('moment/locale/fr');
    });
  });
});