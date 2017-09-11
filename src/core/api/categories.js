import { schema as normalizrSchema } from 'normalizr';

import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export const categorySchema = new normalizrSchema.Entity(
  'categories', {}, { idAttribute: 'slug' });

export function categories({ api }: {| api: ApiStateType |}) {
  return callApi({
    endpoint: 'addons/categories',
    schema: { results: [categorySchema] },
    state: api,
  });
}
