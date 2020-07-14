/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';

export type GetCategoriesParams = {| api: ApiState |};

export function getCategories({ api }: GetCategoriesParams) {
  return callApi({
    endpoint: 'addons/categories',
    apiState: api,
  });
}
