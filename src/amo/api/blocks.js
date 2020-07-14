/* @flow */
import { callApi } from 'core/api';
import type { ApiState } from 'core/reducers/api';
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
