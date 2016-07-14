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

  describe('sanitizeLanguage()', () => {
    it('should get a standard language ', () => {
      assert.equal(utils.sanitizeLanguage('ar'), 'ar');
    });

    it('should convert short form lang to longer', () => {
      assert.equal(utils.sanitizeLanguage('en'), 'en-US');
    });

    it('should return the default if lookup not present', () => {
      assert.equal(utils.sanitizeLanguage('awooga'), 'en-US');
    });

    it('should return the default if bad type', () => {
      assert.equal(utils.sanitizeLanguage(1), 'en-US');
    });

    it('should return a lang if handed a locale', () => {
      assert.equal(utils.sanitizeLanguage('en_US'), 'en-US');
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

  describe('getFilteredUserLanguage()', () => {
    it('should return default lang if called without args', () => {
      assert.equal(utils.getFilteredUserLanguage(), config.get('defaultLang'));
    });

    it('should return default lang if no lang is provided', () => {
      const fakeRenderProps = {};
      const result = utils.getFilteredUserLanguage({ renderProps: fakeRenderProps });
      assert.equal(result, config.get('defaultLang'));
    });

    it('should return default lang if bad lang is provided', () => {
      const fakeRenderProps = {
        params: {
          lang: 'bogus',
        },
      };
      const result = utils.getFilteredUserLanguage({ renderProps: fakeRenderProps });
      assert.equal(result, config.get('defaultLang'));
    });

    it('should return default lang if bad lang type provided', () => {
      const fakeRenderProps = {
        params: {
          lang: 1,
        },
      };
      const result = utils.getFilteredUserLanguage({ renderProps: fakeRenderProps });
      assert.equal(result, config.get('defaultLang'));
    });

    it('should return lang if provided via the URL', () => {
      const fakeRenderProps = {
        params: {
          lang: 'fr',
        },
      };
      assert.equal(utils.getFilteredUserLanguage({ renderProps: fakeRenderProps }), 'fr');
    });

    it('should fall-back to accept-language', () => {
      const fakeRenderProps = {
        params: {
          lang: 'bogus',
        },
      };
      const acceptLanguage = 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getFilteredUserLanguage(
        { renderProps: fakeRenderProps, acceptLanguage });
      assert.equal(result, 'pt-BR');
    });

    it('should map lang from accept-language too', () => {
      const fakeRenderProps = {
        params: {
          lang: 'wat',
        },
      };
      const acceptLanguage = 'pt;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getFilteredUserLanguage(
        { renderProps: fakeRenderProps, acceptLanguage });
      assert.equal(result, 'pt-PT');
    });

    it('should fallback when nothing matches', () => {
      const fakeRenderProps = {
        params: {
          lang: 'wat',
        },
      };
      const acceptLanguage = 'awooga;q=0.5';
      const result = utils.getFilteredUserLanguage(
        { renderProps: fakeRenderProps, acceptLanguage });
      assert.equal(result, 'en-US');
    });
  });

  describe('utils.parseAcceptLanguage()', () => {
    it('returns an empty list if no arg is passed', () => {
      assert.deepEqual(utils.parseAcceptLanguage(), []);
    });

    it('orders an accept-language header', () => {
      const input = 'fil;q=0.5,en;q=0.7';
      assert.deepEqual(utils.parseAcceptLanguage(input), [
        { lang: 'en', quality: 0.7 },
        { lang: 'fil', quality: 0.5 },
      ], JSON.stringify(utils.parseAcceptLanguage(input)));
    });

    it('orders non-quality items higher', () => {
      const input = 'fil,en;q=0.7';
      assert.deepEqual(utils.parseAcceptLanguage(input), [
        { lang: 'fil', quality: 1 },
        { lang: 'en', quality: 0.7 },
      ], JSON.stringify(utils.parseAcceptLanguage(input)));
    });
  });

  describe('utils.getLangFromHeader()', () => {
    it('should find an exact language match for Punjabi', () => {
      const acceptLanguage = 'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'pa');
    });

    it('should find an exact language match for Punjabi India', () => {
      const acceptLanguage = 'pa-in,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'pa');
    });

    it('should not extend into region unless exact match is found', () => {
      const acceptLanguage = 'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa-IN'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'en-us');
    });

    it('should not match Finnish to Filipino (Philiippines)', () => {
      const acceptLanguage = dedent`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'en-US');
    });

    it('should support Filipino (Philippines)', () => {
      const acceptLanguage = dedent`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi', 'fil-PH'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'fil-PH');
    });

    it('should support Filipino without region', () => {
      const acceptLanguage = dedent`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi', 'fil'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, 'fil');
    });

    it('should return undefined language for no match', () => {
      const acceptLanguage = 'whatever';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, { _validLangs: supportedLangs });
      assert.equal(result, undefined);
    });

    it('should return undefined for empty string', () => {
      const acceptLanguage = '';
      const result = utils.getLangFromHeader(acceptLanguage);
      assert.equal(result, undefined);
    });

    it('should return undefined for bad type', () => {
      const acceptLanguage = null;
      const result = utils.getLangFromHeader(acceptLanguage);
      assert.equal(result, undefined);
    });
  });
});
