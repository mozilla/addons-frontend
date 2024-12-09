import invariant from 'invariant';

import type { LocalizedString } from 'amo/types/api';

import type { CategoryEntry } from './categories';
import type { ExternalAddonType, PromotedType } from '../types/addons';

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

export const selectCategoryObject = (
  apiAddon: ExternalAddonType,
): CategoryEntry => {
  return apiAddon.categories;
};

export const makeInternalPromoted = (
  promoted: Array<PromotedType> | PromotedType | null,
): Array<PromotedType> => {
  if (!promoted) {
    return [];
  }
  return Array.isArray(promoted) ? promoted : [promoted];
};
