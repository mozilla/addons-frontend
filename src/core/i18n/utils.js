import config from 'config';

import log from 'core/logger';

const defaultLang = config.get('defaultLang');
const langs = config.get('langs');
const langMap = config.get('langMap');
// The full list of supported langs including those that
// will be mapped by sanitizeLanguage.
const supportedLangs = langs.concat(Object.keys(langMap));
const rtlLangs = config.get('rtlLangs');


export function localeToLang(locale, log_ = log) {
  let lang;
  if (locale && locale.split) {
    const parts = locale.split('_');
    if (parts.length === 1) {
      lang = parts[0].toLowerCase();
    } else if (parts.length === 2) {
      let pt2 = parts[1];
      pt2 = (pt2.length > 2) ? pt2[0].toUpperCase() +
        pt2.slice(1).toLowerCase() : pt2.toUpperCase();
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

export function langToLocale(language, log_ = log) {
  let locale;
  if (language && language.split) {
    const parts = language.split('-');
    if (parts.length === 1) {
      locale = parts[0].toLowerCase();
    } else if (parts.length === 2) {
      let pt2 = parts[1];
      pt2 = (pt2.length > 2) ?
        pt2[0].toUpperCase() + pt2.slice(1).toLowerCase() : pt2.toUpperCase();
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

export function normalizeLang(lang) {
  return localeToLang(langToLocale(lang));
}

export function normalizeLocale(locale) {
  return langToLocale(localeToLang(locale));
}

export function isSupportedLang(lang, { _supportedLangs = supportedLangs } = {}) {
  return _supportedLangs.includes(lang);
}

export function isValidLang(lang, { _langs = langs } = {}) {
  return _langs.includes(lang);
}

export function sanitizeLanguage(langOrLocale) {
  let language = normalizeLang(langOrLocale);
  // Only look in the un-mapped lang list.
  if (!isValidLang(language)) {
    // eslint-disable-next-line no-prototype-builtins
    language = langMap.hasOwnProperty(language) ? langMap[language] : defaultLang;
  }
  return language;
}

export function isRtlLang(lang) {
  const language = sanitizeLanguage(lang);
  return rtlLangs.includes(language);
}

export function getDirection(lang) {
  return isRtlLang(lang) ? 'rtl' : 'ltr';
}


function qualityCmp(a, b) {
  if (a.quality === b.quality) {
    return 0;
  } else if (a.quality < b.quality) {
    return 1;
  }
  return -1;
}

/*
 * Parses the HTTP accept-language header and returns a
 * sorted array of objects. Example object:
 * { lang: 'pl', quality: 0.7 }
 */
export function parseAcceptLanguage(header) {
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


/*
 * Given an accept-language header and a list of currently
 * supported languages, returns the best match normalized.
 *
 * Note: this doesn't map languages e.g. pt -> pt-PT. Use sanitizeLanguage for that.
 *
 */
export function getLangFromHeader(acceptLanguage, { _supportedLangs } = {}) {
  let userLang;
  if (acceptLanguage) {
    const langList = parseAcceptLanguage(acceptLanguage);
    for (const langPref of langList) {
      if (isSupportedLang(normalizeLang(langPref.lang), { _supportedLangs })) {
        userLang = langPref.lang;
        break;
      // Match locale, even if region isn't supported
      } else if (isSupportedLang(normalizeLang(langPref.lang.split('-')[0]), { _supportedLangs })) {
        userLang = langPref.lang.split('-')[0];
        break;
      }
    }
  }
  return normalizeLang(userLang);
}

/*
 * Check validity of language:
 * - If invalid, fall-back to accept-language.
 * - Return object with lang and isLangFromHeader hint.
 *
 */
export function getLanguage({ lang, acceptLanguage } = {}) {
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
