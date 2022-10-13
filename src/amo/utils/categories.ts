import { visibleAddonType } from 'amo/utils';
import type { CategoryEntry } from 'amo/reducers/categories';

export type GetCategoryResultsPathnameParams = {
  addonType: string;
  slug: string;
};
export const getCategoryResultsPathname = ({
  addonType,
  slug,
}: GetCategoryResultsPathnameParams): string => {
  return `/${visibleAddonType(addonType)}/category/${slug}/`;
};
export const getCategoryName = (categories: CategoryEntry, slug: string): string | null => {
  if (categories && categories[slug]) {
    return categories[slug].name;
  }

  return null;
};