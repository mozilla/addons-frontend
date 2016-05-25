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

export function isValidLang(lang) {
  return validLangs.indexOf(lang) > -1;
}

export function getLanguage(langOrLocale) {
  let language = normalizeLang(langOrLocale);
  // Only look in the un-mapped lang list.
  if (langs.indexOf(language) === -1) {
    language = langMap.hasOwnProperty(language) ? langMap[language] : defaultLang;
  }
  return language;
}

export function isRtlLang(lang) {
  const language = getLanguage(lang);
  return rtlLangs.indexOf(language) > -1;
}

export function getDirection(lang) {
  return isRtlLang(lang) ? 'rtl' : 'ltr';
}
