import fs from 'fs';
import { assert } from 'chai';
import path from 'path';
import config from 'config';
import { langToLocale, localeToLang } from 'core/i18n/utils';
import glob from 'glob';

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
