/* global Intl */
/* @flow */
import config from 'config';
import filesize from 'filesize';
import Jed from 'jed';
import moment from 'moment';

import log from 'core/logger';
import { RTL, LTR } from 'core/constants';
import type { I18nType } from 'core/types/i18n';

const defaultLang = config.get('defaultLang');
const langs = config.get('langs');
const langMap = config.get('langMap');
// The full list of supported langs including those that
// will be mapped by sanitizeLanguage.
const supportedLangs = langs.concat(Object.keys(langMap));
const rtlLangs = config.get('rtlLangs');

export function localeToLang(locale?: any, log_?: typeof log = log) {
  let lang;
  if (locale && locale.split) {
    const parts = locale.split('_');
    if (parts.length === 1) {
      lang = parts[0].toLowerCase();
    } else if (parts.length === 2) {
      let pt2 = parts[1];
      pt2 =
        pt2.length > 2
          ? pt2[0].toUpperCase() + pt2.slice(1).toLowerCase()
          : pt2.toUpperCase();
      lang = `${parts[0].toLowerCase()}-${pt2}`;
    } else if (parts.length === 3) {
      // sr_RS should be sr-RS
      lang = `${parts[0].toLowerCase()}-${parts[2].toUpperCase()}`;
    } else {
      log_.error(`Unable to map a language from locale code [${locale}]`);
    }
  }
  return lang;
}

export function langToLocale(language?: any, log_?: typeof log = log) {
  let locale;
  if (language && language.split) {
    const parts = language.split('-');
    if (parts.length === 1) {
      locale = parts[0].toLowerCase();
    } else if (parts.length === 2) {
      let pt2 = parts[1];
      pt2 =
        pt2.length > 2
          ? pt2[0].toUpperCase() + pt2.slice(1).toLowerCase()
          : pt2.toUpperCase();
      locale = `${parts[0].toLowerCase()}_${pt2}`;
    } else if (parts.length === 3) {
      // sr-Cyrl-RS should be sr_RS
      locale = `${parts[0].toLowerCase()}_${parts[2].toUpperCase()}`;
    } else {
      log_.error(`Unable to map a locale from language code [${language}]`);
    }
  }
  return locale;
}

export function normalizeLang(lang?: string) {
  return localeToLang(langToLocale(lang));
}

export function normalizeLocale(locale: string) {
  return langToLocale(localeToLang(locale));
}

type IsSupportedLangOptions = {|
  _supportedLangs: typeof supportedLangs,
|};

export function isSupportedLang(
  lang?: string,
  { _supportedLangs = supportedLangs }: IsSupportedLangOptions = {},
) {
  return _supportedLangs.includes(lang);
}

type IsValidLangOptions = {|
  _langs: typeof langs,
|};

export function isValidLang(
  lang?: string,
  { _langs = langs }: IsValidLangOptions = {},
) {
  return _langs.includes(lang);
}

export function sanitizeLanguage(langOrLocale?: string) {
  let language = normalizeLang(langOrLocale);
  // Only look in the un-mapped lang list.
  if (!isValidLang(language)) {
    // eslint-disable-next-line no-prototype-builtins
    language = langMap.hasOwnProperty(language)
      ? langMap[language]
      : defaultLang;
  }
  return language;
}

export function isRtlLang(lang: string) {
  const language = sanitizeLanguage(lang);
  return rtlLangs.includes(language);
}

export function getDirection(lang: string) {
  return isRtlLang(lang) ? RTL : LTR;
}

function qualityCmp(a, b) {
  if (a.quality === b.quality) {
    return 0;
  }
  if (a.quality < b.quality) {
    return 1;
  }
  return -1;
}

/*
 * Parses the HTTP accept-language header and returns a
 * sorted array of objects. Example object:
 * { lang: 'pl', quality: 0.7 }
 */
export function parseAcceptLanguage(
  header: string,
): Array<{| lang: string, quality: number |}> {
  // pl,fr-FR;q=0.3,en-US;q=0.1
  if (!header || !header.split) {
    return [];
  }
  const rawLangs = header.split(',');
  const langList = rawLangs.map((rawLang) => {
    const parts = rawLang.split(';');
    let q = 1;
    if (parts.length > 1 && parts[1].trim().indexOf('q=') === 0) {
      const qVal = parseFloat(parts[1].split('=')[1]);
      // eslint-disable-next-line no-restricted-globals
      if (isNaN(qVal) === false) {
        q = qVal;
      }
    }
    return {
      lang: parts[0].trim(),
      quality: q,
    };
  });
  langList.sort(qualityCmp);
  return langList;
}

type GetLangFromHeaderOptions = {|
  _supportedLangs?: Object,
|};

/*
 * Given an accept-language header and a list of currently
 * supported languages, returns the best match normalized.
 *
 * Note: this doesn't map languages e.g. pt -> pt-PT. Use sanitizeLanguage for that.
 *
 */
export function getLangFromHeader(
  acceptLanguage: string,
  { _supportedLangs }: GetLangFromHeaderOptions = {},
) {
  let userLang;
  if (acceptLanguage) {
    const langList = parseAcceptLanguage(acceptLanguage);
    for (const langPref of langList) {
      if (isSupportedLang(normalizeLang(langPref.lang), { _supportedLangs })) {
        userLang = langPref.lang;
        break;
        // Match locale, even if region isn't supported
      } else if (
        isSupportedLang(normalizeLang(langPref.lang.split('-')[0]), {
          _supportedLangs,
        })
      ) {
        userLang = langPref.lang.split('-')[0];
        break;
      }
    }
  }
  return normalizeLang(userLang);
}

type GetLanguageParams = {|
  lang: string,
  acceptLanguage: string,
|};

/*
 * Check validity of language:
 * - If invalid, fall-back to accept-language.
 * - Return object with lang and isLangFromHeader hint.
 *
 */
export function getLanguage({ lang, acceptLanguage }: GetLanguageParams = {}) {
  let userLang = lang;
  let isLangFromHeader = false;
  // If we don't have a supported userLang yet try accept-language.
  if (!isSupportedLang(normalizeLang(userLang)) && acceptLanguage) {
    userLang = getLangFromHeader(acceptLanguage);
    isLangFromHeader = true;
  }
  // sanitizeLanguage will perform the following:
  // - mapping e.g. pt -> pt-PT.
  // - normalization e.g: en-us -> en-US.
  return { lang: sanitizeLanguage(userLang), isLangFromHeader };
}

// moment uses locales like "en-gb" whereas we use "en_GB".
export function makeMomentLocale(locale: string) {
  return locale.replace('_', '-').toLowerCase();
}

// Functionality based on oneLine form declandewet/common-tags https://goo.gl/4PzaJI
// If this function is changed, `babel-gettext-extractor` also needs to be
// updated.
function oneLineTranslationString(translationKey) {
  if (translationKey && translationKey.replace && translationKey.trim) {
    return translationKey.replace(/(?:\n(?:\s*))+/g, ' ').trim();
  }
  return translationKey;
}

type FormatFilesizeParams = {|
  _filesize: typeof filesize,
  _log: typeof log,
  i18n: I18nType,
  size: number,
|};

// Translates a file size in bytes into a localized user-friendly format.
export const formatFilesize = ({
  _filesize = filesize,
  _log = log,
  i18n,
  size,
}: FormatFilesizeParams): string | null => {
  const sizeStrings = {
    // These are the expected values for the unit of measure returned by
    // filesize. Realistically we shouldn't get anything back larger than TB.
    /* eslint-disable max-len */
    // translators: B is an abbreviation of Bytes in English. Localize it if necessary but use a short abbreviation.
    B: i18n.gettext('%(localizedSize)s B'),
    // translators: KB is an abbreviation of Kilobytes in English. Localize it if necessary but use a short abbreviation.
    KB: i18n.gettext('%(localizedSize)s KB'),
    // translators: MB is an abbreviation of Megabytes in English. Localize it if necessary but use a short abbreviation.
    MB: i18n.gettext('%(localizedSize)s MB'),
    // translators: GB is an abbreviation of Gigabytes in English. Localize it if necessary but use a short abbreviation.
    GB: i18n.gettext('%(localizedSize)s GB'),
    // translators: TB is an abbreviation of Terabytes in English. Localize it if necessary but use a short abbreviation.
    TB: i18n.gettext('%(localizedSize)s TB'),
    /* eslint-enable max-len */
  };

  const [sizeNumber, sizeName] = _filesize(size).split(' ');
  if (!sizeNumber || !sizeName) {
    _log.error(
      `Filesize returned sizeNumber: "${sizeNumber}", sizeName: "${sizeName}" size "${size}"`,
    );
    return i18n.formatNumber(size);
  }

  const localizedSize = i18n.formatNumber(sizeNumber);
  const sizeString = sizeStrings[sizeName];
  if (!sizeString) {
    _log.error(`Filesize returned unrecognized unit: ${sizeName}`);
    return localizedSize;
  }

  return i18n.sprintf(sizeString, { localizedSize });
};

type I18nConfig = {|
  // The following keys configure Jed.
  // See http://messageformat.github.io/Jed/
  domain: string,
  locale_data: {
    [domain: string]: {
      '': {
        // an empty string configures the domain.
        domain: string,
        lang: string,
        plural_forms: string,
      },
      [message: string]: Array<string>,
    },
  },
  // This is our custom configuration for moment.
  _momentDefineLocale?: Function,
|};

type makeI18nOptions = {|
  _Intl?: typeof Intl,
|};

// Create an i18n object with a translated moment object available we can
// use for translated dates across the app.
export function makeI18n(
  i18nData: I18nConfig,
  lang: string,
  _Jed: Jed = Jed,
  {
    // Checks required to guard against ReferenceError when Intl is not defined.
    // $FLOW_FIXME
    _Intl = typeof Intl !== 'undefined' ? Intl : undefined,
  }: makeI18nOptions = {},
) {
  const i18n = new _Jed(i18nData);
  i18n.lang = lang;

  // TODO: move all of this to an I18n class that extends Jed so that we
  // can type-check all the components that rely on the i18n object.
  // Note: the available locales for tests are controlled in tests/setup.js
  if (
    typeof _Intl === 'object' &&
    Object.prototype.hasOwnProperty.call(_Intl, 'NumberFormat')
  ) {
    log.info('Intl.NumberFormat exists');
    i18n.numberFormat = new _Intl.NumberFormat(lang);
  } else {
    log.info('Intl.NumberFormat does NOT exist');
  }

  i18n.formatNumber = (number) => {
    if (typeof i18n.numberFormat !== 'undefined') {
      return i18n.numberFormat.format(number);
    }
    // Intl is not yet supported on FF Android though it is expected to land in 54
    // See https://bugzilla.mozilla.org/show_bug.cgi?id=1215247
    return number.toLocaleString(lang);
  };

  // This adds the correct moment locale for the active locale so we can get
  // localised dates, times, etc.
  if (i18n.options && typeof i18n.options._momentDefineLocale === 'function') {
    i18n.options._momentDefineLocale();
  }

  // Wrap the core Jed functionality so that we can always strip leading
  // whitespace from translation keys to match the same process used in
  // extraction.
  i18n._dcnpgettext = i18n.dcnpgettext;
  i18n.dcnpgettext = function dcnpgettext(
    domain,
    context,
    singularKey,
    pluralKey,
    val,
  ) {
    return i18n._dcnpgettext(
      domain,
      context,
      oneLineTranslationString(singularKey),
      oneLineTranslationString(pluralKey),
      val,
    );
  };

  const momentLocale = makeMomentLocale(i18n.lang);

  // We add a translated "moment" property to our `i18n` object to make
  // translated date/time/etc. easy.
  i18n.moment = (...params) => {
    const scopedMoment = moment(...params);

    // This also makes sure moment always uses the current locale.
    scopedMoment.locale(momentLocale);

    return scopedMoment;
  };

  return i18n;
}
