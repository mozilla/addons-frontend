/* @flow */
import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalBlockType } from 'amo/reducers/blocks';

export type GetBlockParams = {| apiState: ApiState, guid: string |};

export const getBlock = ({
  apiState,
  guid,
}: GetBlockParams): Promise<ExternalBlockType> => {
  return callApi({
    apiState,
    endpoint: `blocklist/block/${guid}/`,
  });
};
