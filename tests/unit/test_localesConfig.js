/* eslint-disable no-continue */

import fs from 'fs';
import path from 'path';

import config from 'config';
import glob from 'glob';

import { langToLocale, localeToLang } from 'amo/i18n/utils';

const langs = config.get('langs');
const basePath = config.get('basePath');

const placeholderRX = /%\(.*?\)s/g;

describe(__filename, () => {
  // eslint-disable-next-line jest/expect-expect
  it.each(langs)('should have a corresponding %s dir in locale', (lang) => {
    fs.lstatSync(path.join(basePath, 'locale', langToLocale(lang)));
  });

  for (const localeDir of glob.sync('locale/*')) {
    const locale = path.basename(localeDir);
    const lang = localeToLang(locale);
    if (locale === 'templates') {
      continue;
    }
    // eslint-disable no-loop-func
    it(`should have a "${lang}" entry for locale dir in config.langs`, () =>
      expect(langs).toContain(lang));
  }

  describe('Check Locale JS files', () => {
    for (const localeJSFile of glob.sync('src/locale/*/*.js')) {
      // eslint-disable-next-line jest/no-done-callback
      it(`${localeJSFile} should not have html entities`, (done) => {
        fs.readFile(localeJSFile, 'utf8', (err, data) => {
          if (!err) {
            // eslint-disable-next-line jest/no-conditional-expect
            expect(/&[^\s]+;/.test(data)).toBeFalsy();
          } else {
            throw new Error(err);
          }
          done();
        });
      });

      it(`${localeJSFile} should not have incorrect placeholders (Hint: Fix in po file and rebuild locale JS)`, () => {
        // eslint-disable-next-line
        const localeFile = require(path.join('../../', localeJSFile));
        // eslint-disable guard-for-in
        Object.keys(localeFile.locale_data.messages).forEach((key) => {
          let placeholderCount = 0;
          const placeholderMatches = key.match(placeholderRX);
          if (placeholderMatches) {
            placeholderCount = placeholderMatches.length;
          }
          if (placeholderCount > 0) {
            const numberTranslationMatches =
              localeFile.locale_data.messages[key].length;
            for (const translation of localeFile.locale_data.messages[key]) {
              // Only check for non plural forms. This is because sometimes placeholders
              // are skipped in plural forms.
              if (translation && numberTranslationMatches === 1) {
                for (const match of placeholderMatches) {
                  // eslint-disable-next-line jest/no-conditional-expect
                  expect(translation).toContain(match);
                }
              }
            }
          }
        });
      });
    }
  });
});
