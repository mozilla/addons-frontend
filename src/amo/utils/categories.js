/* @flow */
import { SEARCH_SORT_POPULAR, SEARCH_SORT_RECOMMENDED } from 'amo/constants';
import { convertFiltersToQueryParams } from 'amo/searchUtils';
import type { QueryParams } from 'amo/types/api';

export type GetCategoryResultsQueryParams = { addonType: string, slug: string };

export const getCategoryResultsQuery = ({
  addonType,
  slug,
}: GetCategoryResultsQueryParams): QueryParams => {
  return convertFiltersToQueryParams({
    addonType,
    category: slug,
    sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
  });
};
