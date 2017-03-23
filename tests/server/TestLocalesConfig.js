/* eslint-disable no-continue */

import fs from 'fs';
import path from 'path';

import { assert } from 'chai';
import config from 'config';
import glob from 'glob';

import { langToLocale, localeToLang } from 'core/i18n/utils';

const langs = config.get('langs');
const basePath = config.get('basePath');

describe('Locale Config', () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const lang of langs) {
    // eslint-disable no-loop-func
    it(`should have a corresponding ${lang} dir in locale`, () =>
        fs.lstatSync(path.join(basePath, 'locale', langToLocale(lang))));
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const localeDir of glob.sync('locale/*')) {
    const locale = path.basename(localeDir);
    const lang = localeToLang(locale);
    if (locale === 'templates') {
      continue;
    }
    // eslint-disable no-loop-func
    it(`should have a corresponding ${lang} entry the locale dir in the config`, () =>
      assert.include(langs, lang, `Should be a "${lang}" entry in config.langs`));
  }
});

describe('Check Locale JS for entities', () => {
  // eslint-disable-next-line no-restricted-syntax
  for (const localeJSFile of glob.sync('src/locale/*/*.js')) {
    it(`${localeJSFile} should not have html entities`, (done) => {
      fs.readFile(localeJSFile, 'utf8', (err, data) => {
        if (!err) {
          assert.notOk(/&[^\s]+;/.test(data));
        } else {
          throw new Error(err);
        }
        done();
      });
    });
  }
});
