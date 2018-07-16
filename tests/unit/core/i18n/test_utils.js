import config from 'config';
import moment from 'moment';
import { oneLine } from 'common-tags';

import * as utils from 'core/i18n/utils';

const defaultLang = config.get('defaultLang');

describe(__filename, () => {
  describe('normalizeLang()', () => {
    it('should normalize standard languages', () => {
      expect(utils.normalizeLang('en-us')).toEqual('en-US');
      expect(utils.normalizeLang('AR')).toEqual('ar');
    });

    it('should cope with a locale input too', () => {
      expect(utils.normalizeLang('en_US')).toEqual('en-US');
    });

    it('should handle a 3 char language', () => {
      expect(utils.normalizeLang('HaW')).toEqual('haw');
    });

    it('should handle a 3 char language with 2 parts', () => {
      expect(utils.normalizeLang('SoN-Ml')).toEqual('son-ML');
    });

    it('should handle a language with 3 parts', () => {
      expect(utils.normalizeLang('ja-JP-mac')).toEqual('ja-Mac');
    });

    it('should return undefined for no match', () => {
      expect(utils.normalizeLang(1)).toEqual(undefined);
      expect(utils.normalizeLang('')).toEqual(undefined);
    });
  });

  describe('normalizeLocale()', () => {
    it('should normalize a locale', () => {
      expect(utils.normalizeLocale('en_us')).toEqual('en_US');
      expect(utils.normalizeLocale('AR')).toEqual('ar');
    });

    it('should cope with a language input too', () => {
      expect(utils.normalizeLocale('en-us')).toEqual('en_US');
      expect(utils.normalizeLocale('EN-US')).toEqual('en_US');
    });
  });

  describe('langToLocale()', () => {
    it('should convert en-US to en_US', () => {
      expect(utils.langToLocale('en-US')).toEqual('en_US');
    });

    it('should convert sr-Latn to sr_Latn', () => {
      expect(utils.langToLocale('sr-Latn')).toEqual('sr_Latn');
    });

    it('should convert sr-Cyrl-RS to sr_RS', () => {
      expect(utils.langToLocale('sr-Cyrl-RS')).toEqual('sr_RS');
    });

    it('logs if no match found', () => {
      const fakeLog = {
        error: sinon.stub(),
      };
      utils.langToLocale('whatevs-this-is-really-odd', fakeLog);
      expect(fakeLog.error.called).toBeTruthy();
    });

    it('should return undefined for invalid input', () => {
      expect(utils.langToLocale('')).toEqual(undefined);
      expect(utils.langToLocale(1)).toEqual(undefined);
    });
  });

  describe('localeToLang()', () => {
    it('should convert en_US to en-US', () => {
      expect(utils.localeToLang('en_US')).toEqual('en-US');
    });

    it('should convert sr_Latn to sr-Latn', () => {
      expect(utils.localeToLang('sr_Latn')).toEqual('sr-Latn');
    });

    it('should convert sr_Cyrl_RS to sr-RS', () => {
      expect(utils.localeToLang('sr_Cyrl_RS')).toEqual('sr-RS');
    });

    it('logs if too many parts found', () => {
      const fakeLog = {
        error: sinon.stub(),
      };
      utils.localeToLang('what_the_heck_is_this', fakeLog);
      expect(fakeLog.error.called).toBeTruthy();
    });

    it('should return undefined for invalid input', () => {
      expect(utils.localeToLang('')).toEqual(undefined);
      expect(utils.localeToLang(1)).toEqual(undefined);
    });
  });

  describe('sanitizeLanguage()', () => {
    it('should get a standard language ', () => {
      expect(utils.sanitizeLanguage('ar')).toEqual('ar');
    });

    it('should convert short form lang to longer', () => {
      expect(utils.sanitizeLanguage('en')).toEqual('en-US');
    });

    it('should return the default if lookup not present', () => {
      expect(utils.sanitizeLanguage('awooga')).toEqual(defaultLang);
    });

    it('should return the default if bad type', () => {
      expect(utils.sanitizeLanguage(1)).toEqual(defaultLang);
    });

    it('should return a lang if handed a locale', () => {
      expect(utils.sanitizeLanguage('en_US')).toEqual('en-US');
    });

    it('should return the default if handed undefined', () => {
      expect(utils.sanitizeLanguage(undefined)).toEqual(defaultLang);
    });

    it('should return the default if handed an empty string', () => {
      expect(utils.sanitizeLanguage('')).toEqual('en-US');
    });
  });

  describe('getDirection()', () => {
    it('should see ar as rtl', () => {
      expect(utils.getDirection('ar')).toEqual('rtl');
    });

    it('should see en-US as ltr', () => {
      expect(utils.getDirection('en-US')).toEqual('ltr');
    });

    it('should see en as ltr', () => {
      expect(utils.getDirection('en')).toEqual('ltr');
    });

    it('should default to ltr on bad input', () => {
      expect(utils.getDirection('whatevs')).toEqual('ltr');
    });

    it('should default to ltr on bad type', () => {
      expect(utils.getDirection(1)).toEqual('ltr');
    });
  });

  describe('isValidLang()', () => {
    it('should see en-us as an invalid lang', () => {
      expect(utils.isValidLang('en-us')).toEqual(false);
    });

    it('should see en_US as an invalid lang', () => {
      expect(utils.isValidLang('en_US')).toEqual(false);
    });

    it('should see en-US as a valid lang', () => {
      expect(utils.isValidLang('en-US')).toEqual(true);
    });

    it('should see incorrect type as invalid lang', () => {
      expect(utils.isValidLang(1)).toEqual(false);
    });

    it('should see bogus value as invalid lang', () => {
      expect(utils.isValidLang('awooga')).toEqual(false);
    });

    it('should see pt as an invalid lang since it requires mapping', () => {
      expect(utils.isValidLang('pt')).toEqual(false);
    });
  });

  describe('isSupportedLang()', () => {
    it('should see en-us as an unsupported lang', () => {
      expect(utils.isSupportedLang('en-us')).toEqual(false);
    });

    it('should see en_US as an unsupported lang', () => {
      expect(utils.isSupportedLang('en_US')).toEqual(false);
    });

    it('should see en-US as a supported lang', () => {
      expect(utils.isSupportedLang('en-US')).toEqual(true);
    });

    it('should see incorrect type as unsupported lang', () => {
      expect(utils.isSupportedLang(1)).toEqual(false);
    });

    it('should see bogus value as an unsupported lang', () => {
      expect(utils.isSupportedLang('awooga')).toEqual(false);
    });

    it('should see pt as a supported lang (requires mapping)', () => {
      expect(utils.isSupportedLang('pt')).toEqual(true);
    });
  });

  describe('getLanguage()', () => {
    it('should return default lang if called without args', () => {
      const result = utils.getLanguage();
      expect(result.lang).toEqual(defaultLang);
      expect(result.isLangFromHeader).toEqual(false);
    });

    it('should return default lang if no lang is provided', () => {
      const result = utils.getLanguage({ lang: '' });
      expect(result.lang).toEqual(defaultLang);
      expect(result.isLangFromHeader).toEqual(false);
    });

    it('should return default lang if bad lang is provided', () => {
      const result = utils.getLanguage({ lang: 'bogus' });
      expect(result.lang).toEqual(defaultLang);
      expect(result.isLangFromHeader).toEqual(false);
    });

    it('should return default lang if bad lang type provided', () => {
      const result = utils.getLanguage({ lang: 1 });
      expect(result.lang).toEqual(defaultLang);
      expect(result.isLangFromHeader).toEqual(false);
    });

    it('should return lang if provided via the URL', () => {
      const result = utils.getLanguage({ lang: 'fr' });
      expect(result.lang).toEqual('fr');
      expect(result.isLangFromHeader).toEqual(false);
    });

    it('should fall-back to accept-language', () => {
      const acceptLanguage = 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getLanguage({ lang: 'bogus', acceptLanguage });
      expect(result.lang).toEqual('pt-BR');
      expect(result.isLangFromHeader).toEqual(true);
    });

    it('should map lang from accept-language too', () => {
      const acceptLanguage = 'pt;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getLanguage({ lang: 'wat', acceptLanguage });
      expect(result.lang).toEqual('pt-PT');
      expect(result.isLangFromHeader).toEqual(true);
    });

    it('should fallback when nothing matches', () => {
      const acceptLanguage = 'awooga;q=0.5';
      const result = utils.getLanguage({ lang: 'wat', acceptLanguage });
      expect(result.lang).toEqual(defaultLang);
      expect(result.isLangFromHeader).toEqual(true);
    });
  });

  describe('utils.parseAcceptLanguage()', () => {
    it('returns an empty list if no arg is passed', () => {
      expect(utils.parseAcceptLanguage()).toEqual([]);
    });

    it('orders an accept-language header', () => {
      const input = 'fil;q=0.5,en;q=0.7';
      const result = utils.parseAcceptLanguage(input);
      expect(result).toEqual([
        { lang: 'en', quality: 0.7 },
        { lang: 'fil', quality: 0.5 },
      ]);
    });

    it('deals with whitespace around delimiters except "="', () => {
      const input = 'fil ; q=0.5 , en ; q=0.7';
      const result = utils.parseAcceptLanguage(input);
      expect(result).toEqual([
        { lang: 'en', quality: 0.7 },
        { lang: 'fil', quality: 0.5 },
      ]);
    });

    it('orders non-quality items higher', () => {
      const input = 'fil,en;q=0.7';
      const result = utils.parseAcceptLanguage(input);
      expect(result).toEqual([
        { lang: 'fil', quality: 1 },
        { lang: 'en', quality: 0.7 },
      ]);
    });

    it('parses header where all entries have a quality value', () => {
      const input = 'de; q=1.0, en; q=0.5';
      const result = utils.parseAcceptLanguage(input);
      expect(result).toEqual([
        { lang: 'de', quality: 1 },
        { lang: 'en', quality: 0.5 },
      ]);
    });

    it('handles entries with the same quality value', () => {
      const input = 'de; q=0.5, en; q=0.5';
      expect(utils.parseAcceptLanguage(input)).toEqual([
        { lang: 'de', quality: 0.5 },
        { lang: 'en', quality: 0.5 },
      ]);
    });
  });

  describe('utils.getLangFromHeader()', () => {
    it('should find an exact language match for Punjabi', () => {
      const acceptLanguage =
        'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('pa');
    });

    it('should find an exact language match for Punjabi India', () => {
      const acceptLanguage =
        'pa-in,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('pa');
    });

    it('should not extend into region unless exact match is found', () => {
      const acceptLanguage =
        'pa,sv;q=0.8,fi;q=0.7,it-ch;q=0.5,en-us;q=0.3,en;q=0.2';
      const supportedLangs = ['af', 'en-US', 'pa-IN'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('en-US');
    });

    it('should not match Finnish to Filipino (Philiippines)', () => {
      const acceptLanguage = oneLine`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('en-US');
    });

    it('should support Filipino (Philippines)', () => {
      const acceptLanguage = oneLine`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi', 'fil-PH'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('fil-PH');
    });

    it('should support Filipino without region', () => {
      const acceptLanguage = oneLine`fil-PH,fil;q=0.97,en-US;q=0.94,en;q=0.91,en-ph;
        q=0.89,en-gb;q=0.86,hu-HU;q=0.83,hu;q=0.8,en-AU;q=0.77,en-nl;
        q=0.74,nl-en;q=0.71,nl;q=0.69,en-HK;q=0.66,en-sg;q=0.63,en-th;
        q=0.6,pl-PL;q=0.57,pl;q=0.54,fr-FR;q=0.51,fr;q=0.49,en-AE;
        q=0.46,zh-CN;q=0.43,zh;q=0.4,ja-JP;q=0.37,ja;q=0.34,id-ID;
        q=0.31,id;q=0.29,ru-RU;q=0.26,ru;q=0.23,de-DE;q=0.2,de;
        q=0.17,ko-KR;q=0.14,ko;q=0.11,es-ES;q=0.09,es;q=0.06,en-AP;q=0.0`;
      const supportedLangs = ['en-US', 'fi', 'fil'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual('fil');
    });

    it('should return undefined language for no match', () => {
      const acceptLanguage = 'whatever';
      const supportedLangs = ['af', 'en-US', 'pa'];
      const result = utils.getLangFromHeader(acceptLanguage, {
        _supportedLangs: supportedLangs,
      });
      expect(result).toEqual(undefined);
    });

    it('should return undefined for empty string', () => {
      const acceptLanguage = '';
      const result = utils.getLangFromHeader(acceptLanguage);
      expect(result).toEqual(undefined);
    });

    it('should return undefined for bad type', () => {
      const acceptLanguage = null;
      const result = utils.getLangFromHeader(acceptLanguage);
      expect(result).toEqual(undefined);
    });
  });

  describe('makeI18n', () => {
    class FakeJed {
      constructor(i18nData) {
        return i18nData;
      }
    }

    it('adds a localised moment function to the i18n object', () => {
      const i18nData = {};
      const i18n = utils.makeI18n(i18nData, 'en-US', FakeJed);
      expect(i18n.moment).toBeTruthy();
      expect(typeof i18n.moment).toBe('function');
    });

    it('exposes the lang', () => {
      const i18n = utils.makeI18n({}, 'af', FakeJed);
      expect(i18n.lang).toEqual('af');
    });

    it('tries to localise moment', () => {
      const i18nData = {
        options: {
          _momentDefineLocale: sinon.stub(),
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };
      const i18n = utils.makeI18n(i18nData, 'fr', FakeJed);
      expect(i18n.moment().locale()).toEqual('fr');
      sinon.assert.called(i18nData.options._momentDefineLocale);
    });

    it('does not localise if _momentDefineLocale is not a function', () => {
      const i18nData = {
        options: {
          _momentDefineLocale: null,
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };

      const i18n = utils.makeI18n(i18nData, 'en', FakeJed);
      expect(i18n.moment().locale()).toEqual('en');
    });

    it('always passes the locale to moment', () => {
      const i18nData = {
        options: {
          _momentDefineLocale: null,
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };
      const i18n = utils.makeI18n(i18nData, 'fr', FakeJed);
      expect(i18n.moment().locale()).toEqual('fr');
    });

    it('formats a number', () => {
      const i18n = utils.makeI18n({}, 'en', FakeJed);
      expect(i18n.formatNumber(9518231)).toEqual('9,518,231');
    });

    it('Creates an Intl.NumberFormat instance and uses it for formatting', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const i18n = utils.makeI18n({}, 'de', FakeJed);
      sinon.assert.calledWith(numberFormatSpy, 'de');
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 9518231;
      expect(i18n.formatNumber(number)).toEqual('9.518.231');
      sinon.assert.notCalled(toLocaleStringSpy);
    });

    it('falls-back to number.toLocaleString if Intl is not an object', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const i18n = utils.makeI18n({}, 'de', FakeJed, { _Intl: false });
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 9518231;
      expect(i18n.formatNumber(number)).toEqual('9.518.231');
      sinon.assert.calledWith(toLocaleStringSpy, 'de');
      sinon.assert.notCalled(numberFormatSpy);
    });

    it('falls-back to number.toLocaleString when Intl is missing a NumberFormat constructor', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const i18n = utils.makeI18n({}, 'fr', FakeJed, { _Intl: {} });
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 12345;
      expect(i18n.formatNumber(number)).toEqual('12 345');
      sinon.assert.calledWith(toLocaleStringSpy, 'fr');
      sinon.assert.notCalled(numberFormatSpy);
    });

    it('always returns a scoped moment instance', () => {
      const i18n = utils.makeI18n({}, 'fr', FakeJed);
      // Modifying the locale globally below does not affect the instance
      // created previously.
      moment.locale('de');
      expect(i18n.moment().locale()).toEqual('fr');
    });

    it('formats a date', () => {
      const i18n = utils.makeI18n({}, 'fr', FakeJed);
      expect(i18n.moment('1988-09-22').format('ll')).toEqual('22 sept. 1988');
    });
  });
});
