import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalHeroShelvesType } from 'amo/reducers/home';

export type GetHeroShelvesParams = {
  api: ApiState;
};
export const getHeroShelves = ({
  api,
}: GetHeroShelvesParams): Promise<ExternalHeroShelvesType> => {
  return callApi({
    apiState: api,
    auth: true,
    endpoint: 'hero',
  });
};