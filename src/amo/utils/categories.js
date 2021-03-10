/* @flow */
import { SEARCH_SORT_POPULAR, SEARCH_SORT_RECOMMENDED } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { visibleAddonType } from 'amo/utils';
import type { CategoryEntry } from 'amo/reducers/categories';
import type { QueryParams } from 'amo/types/api';

export type GetCategoryResultsPathnameParams = {
  addonType: string,
  slug: string,
};

type GetCategoryResultsLinkToParams = GetCategoryResultsPathnameParams;

export const getCategoryResultsPathname = ({
  addonType,
  slug,
}: GetCategoryResultsPathnameParams): string => {
  return `/${visibleAddonType(addonType)}/category/${slug}/`;
};

export const getCategoryResultsQuery = (): QueryParams => {
  return convertFiltersToQueryParams({
    sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
  });
};

type CategoryResultsLinkTo = {|
  pathname: string,
  query: QueryParams,
|};

export const getCategoryResultsLinkTo = ({
  addonType,
  slug,
}: GetCategoryResultsLinkToParams): CategoryResultsLinkTo => {
  return {
    pathname: getCategoryResultsPathname({ addonType, slug }),
    query: getCategoryResultsQuery(),
  };
};

export const getCategoryName = (
  categories: CategoryEntry,
  slug: string,
): string | null => {
  if (categories && categories[slug]) {
    return categories[slug].name;
  }
  return null;
};
