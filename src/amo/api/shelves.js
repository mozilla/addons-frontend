/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
import type { ExternalSponsoredShelfType } from 'amo/reducers/shelves';

export type GetSponsoredShelfParams = {| api: ApiState |};

export const getSponsoredShelf = ({
  api,
}: GetSponsoredShelfParams): Promise<ExternalSponsoredShelfType> => {
  return callApi({
    apiState: api,
    endpoint: 'shelves/sponsored/',
  });
};
