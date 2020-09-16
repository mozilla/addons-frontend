/* @flow */
import { SEARCH_SORT_POPULAR, SEARCH_SORT_RECOMMENDED } from 'core/constants';
import { convertFiltersToQueryParams } from 'core/searchUtils';

export type GetCategoryResultsQueryParams = { addonType: string, slug: string };

export const getCategoryResultsQuery = ({
  addonType,
  slug,
}: GetCategoryResultsQueryParams) => {
  return convertFiltersToQueryParams({
    addonType,
    category: slug,
    sort: `${SEARCH_SORT_RECOMMENDED},${SEARCH_SORT_POPULAR}`,
  });
};
