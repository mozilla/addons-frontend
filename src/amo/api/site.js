/* @flow */
import invariant from 'invariant';

import { callApi } from 'amo/api';
import type { ApiState } from 'amo/reducers/api';
import type { ExternalSiteStatus } from 'amo/reducers/site';

export type GetSiteStatusParams = {
  api: ApiState,
};

export const getSiteStatus = ({
  api,
}: GetSiteStatusParams): Promise<ExternalSiteStatus> => {
  invariant(api, 'api state is required.');

  return callApi({ endpoint: 'site', apiState: api });
};
