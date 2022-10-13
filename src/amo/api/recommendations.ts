import invariant from 'invariant';

import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { PaginatedApiResponse } from 'amo/types/api';
import type { ExternalAddonType } from 'amo/types/addons';

export type GetRecommendationsParams = {
  api: ApiState;
  guid: string;
  recommended: boolean;
};
export const getRecommendations = ({
  api,
  guid,
  recommended,
}: GetRecommendationsParams): Promise<PaginatedApiResponse<ExternalAddonType>> => {
  invariant(guid, 'A guid is required.');
  invariant(typeof recommended === 'boolean', 'recommended is required');
  return callApi({
    apiState: api,
    auth: true,
    endpoint: 'addons/recommendations/',
    params: {
      app: api.clientApp,
      guid,
      recommended,
    },
  });
};