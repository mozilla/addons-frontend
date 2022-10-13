import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalCategory } from 'amo/reducers/categories';

export type GetCategoriesParams = {
  api: ApiState;
};
export function getCategories({
  api,
}: GetCategoriesParams): Promise<Array<ExternalCategory>> {
  return callApi({
    endpoint: 'addons/categories',
    apiState: api,
  });
}