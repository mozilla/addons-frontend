/* @flow */
import invariant from 'invariant';

import { callApi } from 'core/api';
import type { ApiStateType } from 'core/reducers/api';
import type { PaginatedApiResponse } from 'core/types/api';
import type { ExternalAddonType } from 'core/types/addons';


export type GetRecommendationsParams = {|
  api: ApiStateType,
  guid: string,
  recommended: boolean,
|};

export const getRecommendations = (
  { api, guid, recommended }: GetRecommendationsParams
): Promise<PaginatedApiResponse<ExternalAddonType>> => {
  invariant(guid, 'A guid is required.');
  invariant(typeof recommended === 'boolean', 'recommended is required');

  return callApi({
    auth: true,
    endpoint: 'addons/recommendations/',
    params: { guid, recommended },
    state: api,
  });
};
