/* @flow */
import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
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
