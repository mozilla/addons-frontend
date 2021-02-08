/* @flow */
import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { HomeShelvesType } from 'amo/reducers/home';

export type GetHomeShelvesParams = {| api: ApiState |};

export const getHomeShelves = ({
  api,
}: GetHomeShelvesParams): Promise<HomeShelvesType> => {
  return callApi({
    apiState: api,
    endpoint: 'shelves',
  });
};
