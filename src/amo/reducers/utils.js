import invariant from 'invariant';

import type { LocalizedString } from 'amo/types/api';

export const selectLocalizedContent = (
  field: LocalizedString,
  lang: string,
) => {
  invariant(lang, 'lang must not be empty');
  if (!field) {
    return null;
  }

  if (!field[lang]) {
    return field[field._default];
  }

  return field[lang];
};

export const selectLocalizedContentWithLocale = (
  field: LocalizedString,
  lang: string,
) => {
  invariant(lang, 'lang must not be empty');
  if (!field) {
    return null;
  }

  if (!field[lang]) {
    return {
      content: field[field._default],
      locale: field._default,
    };
  }

  return {
    content: field[lang],
    locale: lang,
  };
};
