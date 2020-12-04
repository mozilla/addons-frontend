import invariant from 'invariant';

import type { LocalizedString } from 'core/types/api';

export const selectLocalizedContent = (
  field: LocalizedString,
  lang: string,
) => {
  invariant(lang, 'lang must not be empty');
  if (!field) {
    return undefined;
  }

  if (!field[lang]) {
    return field[field._default];
  }

  return field[lang];
};
