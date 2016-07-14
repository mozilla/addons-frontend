/* eslint-disable no-console */

import config from 'config';

const defaultLang = config.get('defaultLang');
const langs = config.get('langs');
const langMap = config.get('langMap');
const validLangs = langs.concat(Object.keys(langMap));
const rtlLangs = config.get('rtlLangs');


export function localeToLang(locale, log_ = console) {
  let lang = '';
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

export function langToLocale(language, log_ = console) {
  let locale = '';
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

export function isValidLang(lang, { _validLangs = validLangs } = {}) {
  return _validLangs.includes(normalizeLang(lang));
}

export function sanitizeLanguage(langOrLocale) {
  let language = normalizeLang(langOrLocale);
  // Only look in the un-mapped lang list.
  if (!langs.includes(language)) {
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
 * {
 *   lang: 'pl', quality: 0.7
 * }
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
    if (parts.length > 1 && parts[1].indexOf('q=') === 0) {
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
 * supported languages, returns the best match with no normalization.
 *
 */
export function getLangFromHeader(acceptLanguage, { _validLangs } = {}) {
  let userLang;
  if (acceptLanguage) {
    const langList = parseAcceptLanguage(acceptLanguage);
    for (const langPref of langList) {
      if (isValidLang(langPref.lang, { _validLangs })) {
        userLang = langPref.lang;
        break;
      // Match locale, even if region isn't supported
      } else if (isValidLang(langPref.lang.split('-')[0], { _validLangs })) {
        userLang = langPref.lang.split('-')[0];
        break;
      }
    }
  }
  return userLang;
}

/*
 * Looks up the language from the router renderProps.
 * When that fails fall-back to accept-language.
 *
 */
export function getFilteredUserLanguage({ renderProps, acceptLanguage } = {}) {
  let userLang;
  // Get the lang from the url param by default if it exists.
  if (renderProps && renderProps.params && renderProps.params.lang) {
    userLang = renderProps.params.lang;
  }
  // If we don't have a valid userLang set yet try accept-language.
  if (!isValidLang(userLang) && acceptLanguage) {
    userLang = getLangFromHeader(acceptLanguage);
  }
  return sanitizeLanguage(userLang);
}
