/* @flow */
import { SEARCH_SORT_POPULAR, SEARCH_SORT_RECOMMENDED } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import { visibleAddonType } from 'amo/utils';
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
