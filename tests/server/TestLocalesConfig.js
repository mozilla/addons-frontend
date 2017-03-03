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
  for (const lang of langs) {
    // eslint-disable no-loop-func
    it(`should have a corresponding ${lang} dir in locale`, () =>
        fs.lstatSync(path.join(basePath, 'locale', langToLocale(lang))));
  }

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
