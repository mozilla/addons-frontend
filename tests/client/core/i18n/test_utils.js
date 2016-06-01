import * as utils from 'core/i18n/utils';
import config from 'config';


describe('i18n utils', () => {
  describe('normalizeLang()', () => {
    it('should normalize standard languages', () => {
      assert.equal(utils.normalizeLang('en-us'), 'en-US');
      assert.equal(utils.normalizeLang('AR'), 'ar');
    });

    it('should cope with a locale input too', () => {
      assert.equal(utils.normalizeLang('en_US'), 'en-US');
    });

    it('should handle a 3 char language', () => {
      assert.equal(utils.normalizeLang('HaW'), 'haw');
    });

    it('should handle a 3 char language with 2 parts', () => {
      assert.equal(utils.normalizeLang('SoN-Ml'), 'son-ML');
    });

    it('should handle a language with 3 parts', () => {
      assert.equal(utils.normalizeLang('ja-JP-mac'), 'ja-Mac');
    });
  });

  describe('normalizeLocale()', () => {
    it('should normalize a locale', () => {
      assert.equal(utils.normalizeLocale('en_us'), 'en_US');
      assert.equal(utils.normalizeLocale('AR'), 'ar');
    });

    it('should cope with a language input too', () => {
      assert.equal(utils.normalizeLocale('en-us'), 'en_US');
      assert.equal(utils.normalizeLocale('EN-US'), 'en_US');
    });
  });

  describe('langToLocale()', () => {
    it('should convert en-US to en_US', () => {
      assert.equal(utils.langToLocale('en-US'), 'en_US');
    });

    it('should convert sr-Latn to sr_Latn', () => {
      assert.equal(utils.langToLocale('sr-Latn'), 'sr_Latn');
    });

    it('should convert sr-Cyrl-RS to sr_RS', () => {
      assert.equal(utils.langToLocale('sr-Cyrl-RS'), 'sr_RS');
    });

    it('logs if no match found', () => {
      const fakeLog = {
        error: sinon.stub(),
      };
      utils.langToLocale('whatevs-this-is-really-odd', fakeLog);
      assert.ok(fakeLog.error.called);
    });
  });

  describe('localeToLang()', () => {
    it('should convert en_US to en-US', () => {
      assert.equal(utils.localeToLang('en_US'), 'en-US');
    });

    it('should convert sr_Latn to sr-Latn', () => {
      assert.equal(utils.localeToLang('sr_Latn'), 'sr-Latn');
    });

    it('should convert sr_Cyrl_RS to sr-RS', () => {
      assert.equal(utils.localeToLang('sr_Cyrl_RS'), 'sr-RS');
    });

    it('logs if too many parts found', () => {
      const fakeLog = {
        error: sinon.stub(),
      };
      utils.localeToLang('what_the_heck_is_this', fakeLog);
      assert.ok(fakeLog.error.called);
    });
  });

  describe('getLanguage()', () => {
    it('should get a standard language ', () => {
      assert.equal(utils.getLanguage('ar'), 'ar');
    });

    it('should convert short form lang to longer', () => {
      assert.equal(utils.getLanguage('en'), 'en-US');
    });

    it('should return the default if lookup not present', () => {
      assert.equal(utils.getLanguage('awooga'), 'en-US');
    });

    it('should return the default if bad type', () => {
      assert.equal(utils.getLanguage(1), 'en-US');
    });

    it('should return a lang if handed a locale', () => {
      assert.equal(utils.getLanguage('en_US'), 'en-US');
    });
  });

  describe('getDirection()', () => {
    it('should see ar as rtl', () => {
      assert.equal(utils.getDirection('ar'), 'rtl');
    });

    it('should see en-US as ltr', () => {
      assert.equal(utils.getDirection('en-US'), 'ltr');
    });

    it('should see en as ltr', () => {
      assert.equal(utils.getDirection('en'), 'ltr');
    });

    it('should default to ltr on bad input', () => {
      assert.equal(utils.getDirection('whatevs'), 'ltr');
    });

    it('should default to ltr on bad type', () => {
      assert.equal(utils.getDirection(1), 'ltr');
    });
  });

  describe('isValidLang()', () => {
    it('should see en-US as a valid lang', () => {
      assert.equal(utils.isValidLang('en-US'), true);
    });

    it('should see incorrect type as invalid lang', () => {
      assert.equal(utils.isValidLang(1), false);
    });

    it('should see bogus value as invalid lang', () => {
      assert.equal(utils.isValidLang('awooga'), false);
    });

    it('should see pt as a valid lang', () => {
      assert.equal(utils.isValidLang('pt'), true);
    });
  });

  describe('getLangFromRouter()', () => {
    it('should return default lang if no lang is provided', () => {
      const fakeRenderProps = {};
      assert.equal(utils.getLangFromRouter(fakeRenderProps), config.get('defaultLang'));
    });

    it('should return lang if provided via the URL', () => {
      const fakeRenderProps = {
        params: {
          lang: 'fr',
        },
      };
      assert.equal(utils.getLangFromRouter(fakeRenderProps), 'fr');
    });

    it('should return lang if provided via a query param', () => {
      const fakeRenderProps = {
        location: {
          query: {
            lang: 'pt-PT',
          },
        },
      };
      assert.equal(utils.getLangFromRouter(fakeRenderProps), 'pt-PT');
    });

    it('should use url param if both that and query string are present', () => {
      const fakeRenderProps = {
        params: {
          lang: 'fr',
        },
        location: {
          query: {
            lang: 'pt-PT',
          },
        },
      };
      assert.equal(utils.getLangFromRouter(fakeRenderProps), 'fr');
    });
  });
});
