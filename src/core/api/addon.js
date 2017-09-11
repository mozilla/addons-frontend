import { schema as normalizrSchema } from 'normalizr';

import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';


export const addonSchema = new normalizrSchema.Entity(
  'addons', {}, { idAttribute: 'slug' });

type FetchAddonParams = {|
  api: ApiStateType,
  slug: string,
|};

export function fetchAddon({ api, slug }: FetchAddonParams) {
  return callApi({
    endpoint: `addons/addon/${slug}`,
    schema: addonSchema,
    auth: true,
    state: api,
  });
}
