import * as React from 'react';
import config from 'config';
import moment from 'moment';
import { oneLine } from 'common-tags';

import Link from 'amo/components/Link';
import * as utils from 'amo/i18n/utils';
import { RTL, LTR } from 'amo/constants';
import { fakeI18n, getFakeLogger, normalizeSpaces } from 'tests/unit/helpers';

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
      const fakeLog = getFakeLogger();
      utils.langToLocale('whatevs-this-is-really-odd', fakeLog);
      sinon.assert.called(fakeLog.error);
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
      const fakeLog = getFakeLogger();
      utils.localeToLang('what_the_heck_is_this', fakeLog);
      sinon.assert.called(fakeLog.error);
    });

    it('should return undefined for invalid input', () => {
      expect(utils.localeToLang('')).toEqual(undefined);
      expect(utils.localeToLang(1)).toEqual(undefined);
    });
  });

  describe('sanitizeLanguage()', () => {
    it('should get a standard language', () => {
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
      expect(utils.getDirection('ar')).toEqual(RTL);
    });

    it('should see en-US as ltr', () => {
      expect(utils.getDirection('en-US')).toEqual(LTR);
    });

    it('should see en as ltr', () => {
      expect(utils.getDirection('en')).toEqual(LTR);
    });

    it('should default to ltr on bad input', () => {
      expect(utils.getDirection('whatevs')).toEqual(LTR);
    });

    it('should default to ltr on bad type', () => {
      expect(utils.getDirection(1)).toEqual(LTR);
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
    });

    it('should return default lang if no lang is provided', () => {
      const result = utils.getLanguage({ lang: '' });
      expect(result.lang).toEqual(defaultLang);
    });

    it('should return default lang if bad lang is provided', () => {
      const result = utils.getLanguage({ lang: 'bogus' });
      expect(result.lang).toEqual(defaultLang);
    });

    it('should return default lang if bad lang type provided', () => {
      const result = utils.getLanguage({ lang: 1 });
      expect(result.lang).toEqual(defaultLang);
    });

    it('should return lang if provided via the URL', () => {
      const result = utils.getLanguage({ lang: 'fr' });
      expect(result.lang).toEqual('fr');
    });

    it('should fall-back to accept-language', () => {
      const acceptLanguage = 'pt-br;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getLanguage({ lang: 'bogus', acceptLanguage });
      expect(result.lang).toEqual('pt-BR');
    });

    it('should map lang from accept-language too', () => {
      const acceptLanguage = 'pt;q=0.5,en-us;q=0.3,en;q=0.2';
      const result = utils.getLanguage({ lang: 'wat', acceptLanguage });
      expect(result.lang).toEqual('pt-PT');
    });

    it('should fallback when nothing matches', () => {
      const acceptLanguage = 'awooga;q=0.5';
      const result = utils.getLanguage({ lang: 'wat', acceptLanguage });
      expect(result.lang).toEqual(defaultLang);
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
      constructor(jedData) {
        // eslint-disable-next-line no-constructor-return
        return jedData;
      }
    }

    it('adds a localised moment function to the jed object', () => {
      const jedData = {};
      const jed = utils.makeI18n(jedData, 'en-US', FakeJed);
      expect(jed.moment).toBeTruthy();
      expect(typeof jed.moment).toBe('function');
    });

    it('exposes the lang', () => {
      const jed = utils.makeI18n({}, 'af', FakeJed);
      expect(jed.lang).toEqual('af');
    });

    it('tries to localise moment', () => {
      const jedData = {
        options: {
          _momentDefineLocale: sinon.stub(),
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };
      const jed = utils.makeI18n(jedData, 'fr', FakeJed);
      expect(jed.moment().locale()).toEqual('fr');
      sinon.assert.called(jedData.options._momentDefineLocale);
    });

    it('does not localise if _momentDefineLocale is not a function', () => {
      const jedData = {
        options: {
          _momentDefineLocale: null,
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };

      const jed = utils.makeI18n(jedData, 'en', FakeJed);
      expect(jed.moment().locale()).toEqual('en');
    });

    it('always passes the locale to moment', () => {
      const jedData = {
        options: {
          _momentDefineLocale: null,
          locale_data: { messages: { '': { lang: 'fr' } } },
        },
      };
      const jed = utils.makeI18n(jedData, 'fr', FakeJed);
      expect(jed.moment().locale()).toEqual('fr');
    });

    it('formats a number', () => {
      const jed = utils.makeI18n({}, 'en', FakeJed);
      expect(jed.formatNumber(9518231)).toEqual('9,518,231');
    });

    it('Creates an Intl.NumberFormat instance and uses it for formatting', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const jed = utils.makeI18n({}, 'de', FakeJed);
      sinon.assert.calledWith(numberFormatSpy, 'de');
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 9518231;
      expect(jed.formatNumber(number)).toEqual('9.518.231');
      sinon.assert.notCalled(toLocaleStringSpy);
    });

    it('falls-back to number.toLocaleString if Intl is not an object', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const jed = utils.makeI18n({}, 'de', FakeJed, { _Intl: false });
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 9518231;
      expect(jed.formatNumber(number)).toEqual('9.518.231');
      sinon.assert.calledWith(toLocaleStringSpy, 'de');
      sinon.assert.notCalled(numberFormatSpy);
    });

    it('falls-back to number.toLocaleString when Intl is missing a NumberFormat constructor', () => {
      const numberFormatSpy = sinon.spy(Intl, 'NumberFormat');
      const jed = utils.makeI18n({}, 'fr', FakeJed, { _Intl: {} });
      const toLocaleStringSpy = sinon.spy(Number.prototype, 'toLocaleString');
      const number = 12345;

      expect(normalizeSpaces(jed.formatNumber(number))).toEqual('12 345');
      sinon.assert.calledWith(toLocaleStringSpy, 'fr');
      sinon.assert.notCalled(numberFormatSpy);
    });

    it('always returns a scoped moment instance', () => {
      const jed = utils.makeI18n({}, 'fr', FakeJed);
      // Modifying the locale globally below does not affect the instance
      // created previously.
      moment.locale('de');
      expect(jed.moment().locale()).toEqual('fr');
    });

    it('formats a date', () => {
      const jed = utils.makeI18n({}, 'fr', FakeJed);
      expect(jed.moment('1988-09-22').format('ll')).toEqual('22 sept. 1988');
    });
  });

  describe('formatFilesize', () => {
    const _formatFilesize = ({
      _filesize,
      _log,
      jed = fakeI18n(),
      size = 123,
    }) => {
      return utils.formatFilesize({ _filesize, _log, jed, size });
    };

    it('formats the number returned by filesize', () => {
      const size = 1000;
      expect(_formatFilesize({ size })).toEqual('1,000 B');
    });

    it('returns the size for an invalid string from filesize', () => {
      const size = 987;
      const _filesize = sinon.stub().returns('123');
      expect(_formatFilesize({ _filesize, size })).toEqual(size.toString());
    });

    it('logs an error for an invalid string from filesize', () => {
      const fakeLog = getFakeLogger();
      const _filesize = sinon.stub().returns('123');
      _formatFilesize({ _filesize, _log: fakeLog });
      sinon.assert.called(fakeLog.error);
    });

    it('returns the size for an invalid unit of measure from filesize', () => {
      const size = 987;
      const _filesize = sinon.stub().returns(`${size} BOB`);
      expect(_formatFilesize({ _filesize, size })).toEqual(size.toString());
    });

    it('logs an error for an invalid unit of measure from filesize', () => {
      const fakeLog = getFakeLogger();
      const _filesize = sinon.stub().returns('123 BOB');
      _formatFilesize({ _filesize, _log: fakeLog });
      sinon.assert.called(fakeLog.error);
    });

    it.each([
      ['B', 123, '123'],
      ['KB', 1234, '1.21'],
      ['MB', 1234567, '1.18'],
      ['GB', 1234567890, '1.15'],
      ['TB', 1234567890123, '1.12'],
    ])(
      'calls jed.sprintf with the expected substitution for size %s',
      (sizeName, size, localizedSize) => {
        const jed = fakeI18n();
        _formatFilesize({ size, jed });
        expect(jed.sprintf).toHaveBeenCalledWith(
          `%(localizedSize)s ${sizeName}`,
          {
            localizedSize,
          },
        );
      },
    );
  });

  describe('replaceStringsWithJSX', () => {
    it('lets you replace format strings with JSX', () => {
      expect(
        utils.replaceStringsWithJSX({
          text: 'Click on %(redLinkStart)sred%(redLinkEnd)s or %(blueLinkStart)sblue%(blueLinkEnd)s, your choice',
          replacements: [
            [
              'redLinkStart',
              'redLinkEnd',
              (text) => (
                <Link key="red" to="/red">
                  {text}
                </Link>
              ),
            ],
            [
              'blueLinkStart',
              'blueLinkEnd',
              (text) => (
                <Link key="blue" to="/blue">
                  {text}
                </Link>
              ),
            ],
          ],
        }),
      ).toEqual([
        'Click on ',
        <Link key="red" to="/red">
          red
        </Link>,
        ' or ',
        <Link key="blue" to="/blue">
          blue
        </Link>,
        ', your choice',
      ]);
    });

    it('lets you replace format strings with JSX in any order', () => {
      expect(
        utils.replaceStringsWithJSX({
          text: 'Click on %(blueLinkStart)sblue%(blueLinkEnd)s or %(redLinkStart)sred%(redLinkEnd)s, your choice',
          replacements: [
            [
              'redLinkStart',
              'redLinkEnd',
              (text) => {
                return (
                  <Link key="red" to="/red">
                    {text}
                  </Link>
                );
              },
            ],
            [
              'blueLinkStart',
              'blueLinkEnd',
              (text) => {
                return (
                  <Link key="blue" to="/blue">
                    {text}
                  </Link>
                );
              },
            ],
          ],
        }),
      ).toEqual([
        'Click on ',
        <Link key="blue" to="/blue">
          blue
        </Link>,
        ' or ',
        <Link key="red" to="/red">
          red
        </Link>,
        ', your choice',
      ]);
    });

    it('throws an error when there is no replacement', () => {
      expect(() => {
        utils.replaceStringsWithJSX({ text: 'some text', replacements: [] });
      }).toThrow(/`replacements` should not be empty/);
    });

    it('throws an error when the `text` has no variables and there are replacements', () => {
      expect(() => {
        utils.replaceStringsWithJSX({
          text: 'some localized content',
          replacements: [['start', 'end', (text) => text]],
        });
      }).toThrow(/No placeholder found in `text`/);
    });

    it('throws an error when the `text` is an empty string and there are replacements', () => {
      expect(() => {
        utils.replaceStringsWithJSX({
          text: '',
          replacements: [['start', 'end', (text) => text]],
        });
      }).toThrow(/No placeholder found in `text`/);
    });

    it('throws an error when not all replacements have been used', () => {
      expect(() => {
        utils.replaceStringsWithJSX({
          text: 'a string with %(startFirst)sa link%(endFirst)s and %(startSecond)sanother one%(endSecond)s.',
          replacements: [
            ['startA', 'endA', (text) => text],
            ['startB', 'endB', (text) => text],
          ],
        });
      }).toThrow(
        /Not all replacements have been used; unused keys: startA,endA; startB,endB/,
      );
    });

    it('throws an error when `replacements` has duplicated keys', () => {
      expect(() => {
        utils.replaceStringsWithJSX({
          text: 'a string with %(startA)sa link%(endA)s and %(startB)s second one%(endB)s',
          replacements: [
            ['startA', 'endA', (text) => text],
            ['startA', 'endA', (text) => text],
          ],
        });
      }).toThrow(/Duplicate key detected in `replacements`: startA,endA/);
    });
  });

  it('throws an error for unmatched format strings', () => {
    expect(() => {
      utils.replaceStringsWithJSX({
        text: 'Click on %(redLinkStart)sred%(redLinkEnd)s or %(blueLinkStart)sblue%(blueLinkEnd)s, your choice',
        replacements: [
          [
            'redLinkStart',
            'redLinkEnd',
            (text) => (
              <Link key="red" to="/red">
                {text}
              </Link>
            ),
          ],
        ],
      });
    }).toThrow(/Expected 2 replacements but only got 1/);
  });
});
