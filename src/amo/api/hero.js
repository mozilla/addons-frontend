/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
import type { ExternalHeroShelvesType } from 'amo/reducers/home';

export type GetHeroShelvesParams = {| api: ApiState |};

export const getHeroShelves = ({
  api,
}: GetHeroShelvesParams): Promise<ExternalHeroShelvesType> => {
  return callApi({
    apiState: api,
    auth: true,
    endpoint: 'hero',
  });
};
