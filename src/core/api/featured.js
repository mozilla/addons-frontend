import { callApi } from 'core/api';
import { addonSchema } from 'core/api/addon';
import type { ApiStateType } from 'core/reducers/api';
import { convertFiltersToQueryParams } from 'core/searchUtils';


type FeaturedParams = {|
  api: ApiStateType,
  filters: Object,
  page: number,
|};

export function featured({ api, filters, page }: FeaturedParams) {
  return callApi({
    endpoint: 'addons/featured',
    params: {
      app: api.clientApp,
      ...convertFiltersToQueryParams(filters),
      page,
    },
    schema: { results: [addonSchema] },
    state: api,
  });
}
